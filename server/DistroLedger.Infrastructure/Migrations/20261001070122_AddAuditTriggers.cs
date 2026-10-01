using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DistroLedger.Infrastructure.Migrations
{
    /// <summary>
    /// Database-level audit trail: an <c>audit_logs</c> table plus a generic trigger
    /// attached to every table that records every INSERT / UPDATE / DELETE as JSONB.
    /// Capturing at the DB (not the app) means changes made by the admin console, CSV
    /// imports or direct SQL are audited too.
    /// </summary>
    public partial class AddAuditTriggers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Audit store. snake_case + unquoted so it stays distinct from the
            //    PascalCase domain tables and is easy to query by hand.
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS audit_logs (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name   text        NOT NULL,
    operation    text        NOT NULL,
    record_id    text,
    tenant_id    uuid,
    old_data     jsonb,
    new_data     jsonb,
    changed_cols text[],
    changed_by   text,
    changed_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_audit_logs_table_time  ON audit_logs (table_name, changed_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_logs_tenant_time ON audit_logs (tenant_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_logs_record      ON audit_logs (table_name, record_id);
");

            // 2. Generic capture function. Derives the primary key from the catalog so
            //    it works for single- and composite-key tables alike; pulls TenantId
            //    when the row has one; records which columns changed on an update.
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION audit_capture() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_old     jsonb;
    v_new     jsonb;
    v_src     jsonb;
    v_pk      text[];
    v_rec_id  text;
    v_tenant  uuid;
    v_changed text[];
    v_by      text;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
        v_src := v_old;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new := to_jsonb(NEW);
        v_src := v_new;
    ELSE
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_src := v_new;
        IF v_old = v_new THEN
            RETURN NEW;  -- nothing actually changed
        END IF;
    END IF;

    -- primary key column names, in order
    SELECT array_agg(a.attname ORDER BY k.ord)
    INTO v_pk
    FROM pg_index i
    JOIN LATERAL unnest(string_to_array(i.indkey::text, ' ')::smallint[])
         WITH ORDINALITY AS k(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
    WHERE i.indrelid = TG_RELID AND i.indisprimary;

    IF v_pk IS NOT NULL THEN
        SELECT string_agg(coalesce(v_src ->> col, ''), '|' ORDER BY ord)
        INTO v_rec_id
        FROM unnest(v_pk) WITH ORDINALITY AS t(col, ord);
    END IF;

    -- tenant scope, when the row carries one
    IF v_src ? 'TenantId' THEN
        BEGIN
            v_tenant := (v_src ->> 'TenantId')::uuid;
        EXCEPTION WHEN others THEN
            v_tenant := NULL;
        END;
    END IF;

    -- which columns changed (updates only)
    IF (TG_OP = 'UPDATE') THEN
        SELECT array_agg(key)
        INTO v_changed
        FROM jsonb_object_keys(v_new) AS key
        WHERE (v_new -> key) IS DISTINCT FROM (v_old -> key);
    END IF;

    -- optional actor: the app may set it per request via
    --   SET LOCAL app.actor = '<tenant slug or user>';
    -- (GUC name avoids the reserved word 'current_user').
    v_by := current_setting('app.actor', true);

    INSERT INTO audit_logs
        (table_name, operation, record_id, tenant_id, old_data, new_data, changed_cols, changed_by)
    VALUES
        (TG_TABLE_NAME, TG_OP, v_rec_id, v_tenant, v_old, v_new, v_changed, v_by);

    RETURN COALESCE(NEW, OLD);
END;
$$;
");

            // 3. Attach the trigger to every current table (except the audit store and
            //    EF's migration-history table). Idempotent.
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION audit_apply_to_all() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
    FOR r IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname NOT IN ('audit_logs', '__EFMigrationsHistory')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS audit_trg ON %I', r.relname);
        EXECUTE format(
            'CREATE TRIGGER audit_trg AFTER INSERT OR UPDATE OR DELETE ON %I '
            'FOR EACH ROW EXECUTE FUNCTION audit_capture()', r.relname);
    END LOOP;
END;
$$;

SELECT audit_apply_to_all();
");

            // 4. Best-effort auto-attach for tables created later. Event triggers need
            //    elevated privilege; on managed hosts that forbid them this is skipped
            //    (re-run SELECT audit_apply_to_all(); from a later migration instead).
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION audit_on_create_table() RETURNS event_trigger
LANGUAGE plpgsql AS $$
DECLARE
    obj record;
    v_rel text;
    v_nsp text;
    v_kind char;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE TABLE'
    LOOP
        SELECT c.relname, n.nspname, c.relkind
        INTO v_rel, v_nsp, v_kind
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.oid = obj.objid;

        IF v_nsp = 'public' AND v_kind = 'r'
           AND v_rel NOT IN ('audit_logs', '__EFMigrationsHistory') THEN
            EXECUTE format('DROP TRIGGER IF EXISTS audit_trg ON %I', v_rel);
            EXECUTE format(
                'CREATE TRIGGER audit_trg AFTER INSERT OR UPDATE OR DELETE ON %I '
                'FOR EACH ROW EXECUTE FUNCTION audit_capture()', v_rel);
        END IF;
    END LOOP;
END;
$$;

DO $$
BEGIN
    DROP EVENT TRIGGER IF EXISTS audit_ddl_trg;
    CREATE EVENT TRIGGER audit_ddl_trg ON ddl_command_end
        WHEN TAG IN ('CREATE TABLE')
        EXECUTE FUNCTION audit_on_create_table();
EXCEPTION WHEN insufficient_privilege OR feature_not_supported THEN
    RAISE NOTICE 'audit: skipping DDL event trigger (not permitted on this host) - %', SQLERRM;
END;
$$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
BEGIN
    DROP EVENT TRIGGER IF EXISTS audit_ddl_trg;
EXCEPTION WHEN insufficient_privilege THEN
    NULL;
END;
$$;

DROP FUNCTION IF EXISTS audit_on_create_table() CASCADE;
DROP FUNCTION IF EXISTS audit_apply_to_all();
-- CASCADE drops every audit_trg trigger that depends on this function.
DROP FUNCTION IF EXISTS audit_capture() CASCADE;
DROP TABLE IF EXISTS audit_logs;
");
        }
    }
}
