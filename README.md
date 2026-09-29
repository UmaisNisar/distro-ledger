# DistroLedger

A multi-tenant **sales & receivables** app for distribution / wholesale companies — a modern
replacement for the monthly sales spreadsheet. Any company signs up, runs a short onboarding
(name, accent color, currency, tax-id label), and gets its own isolated workspace:

- **Sales register** with auto invoice numbers, payment status & method
- **Customer master** with per-customer full-year breakdown
- **Dashboards** — monthly totals, transaction counts, trend chart
- **Receivables** — outstanding balances with aging
- **Printable invoices** and **CSV import/export**

Native **iOS-style** UI, fully responsive (built for phones), light + dark mode.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19 + TypeScript + Vite, React Router, TanStack Query, **React Hook Form + Zod**, Recharts, Tailwind v4 |
| Backend  | .NET 10 Minimal API, EF Core + Npgsql, JWT auth, FluentValidation |
| Database | PostgreSQL |

Tenant isolation is enforced in one place — an EF Core **global query filter** on `TenantId`,
resolved from the JWT — so no query can leak another company's data.

---

## Run locally

### Option A — Docker (one command)

```bash
cp .env.example .env         # set JWT_SECRET
docker compose up --build
```

Open **http://localhost:8081**. Postgres, the API, and the web app all start together; the schema
is created automatically on first boot.

### Option B — Without Docker

You need a local PostgreSQL and the .NET 10 SDK + Node 20+.

```bash
# 1. Backend  (http://localhost:5080)
cd server
# set the connection string + a JWT secret in DistroLedger.Api/appsettings.Development.json
dotnet run --project DistroLedger.Api

# 2. Frontend (http://localhost:5173) — proxies /api to the backend
cd ../web
npm install
npm run dev
```

---

## Deploy for free

### Recommended — one VM, always on (Oracle Cloud Always-Free)

A single Always-Free VM runs the whole stack 24/7 with **no cold starts**, unlike PaaS free tiers.
Caddy handles HTTPS automatically.

1. Create an **Oracle Cloud Always-Free** VM (Ampere ARM works great). Open ports **80** and **443**
   in the security list, install Docker + the compose plugin.
2. Point a domain's **A record** at the VM's public IP.
3. On the VM:
   ```bash
   git clone https://github.com/UmaisNisar/distro-ledger.git && cd distro-ledger
   cp .env.example .env      # set DOMAIN, JWT_SECRET, POSTGRES_PASSWORD
   docker compose -f docker-compose.prod.yml up -d --build
   ```

That's it — Postgres, API, web, and Caddy (auto-TLS for `DOMAIN`) all come up; the schema is created
on first boot. Update later with `git pull && docker compose -f docker-compose.prod.yml up -d --build`.
(If you front it with Cloudflare Tunnel instead of a public IP, point the tunnel at the `caddy`
service — or at `web:80` and let Cloudflare handle TLS.)

### Alternative — managed free tiers (Neon + Render + Vercel)

Zero servers to manage, but the API **sleeps after ~15 min idle** (first request then takes ~30–60s).

1. **[Neon](https://neon.tech)** — create a Postgres project, copy the connection string.
2. **[Render](https://render.com)** — New → Blueprint on this repo (uses [`render.yaml`](render.yaml)),
   or a Docker web service with Root Directory `server`. Env:
   `ConnectionStrings__Postgres` (the Neon `postgres://…` URL works — it's normalized),
   `Jwt__Secret` (generate), `AllowedOrigins` = your web URL. Health check `/health`.
3. **[Vercel](https://vercel.com)** / Cloudflare Pages — import with Root Directory `web`,
   set `VITE_API_URL` to the Render API URL.

---

## CSV import format

Import from **Settings → Data → Import CSV**. Headers are matched flexibly; a row needs at least a
customer name and amount. Missing customers are created automatically.

```
Date, Customer Name, NTN #, Amount, Payment Status, Payment Method, Notes
01-Feb-2026, ZEE MART, 0018406, 18640, Paid, Cash,
```

Amounts may contain thousands separators (`18,640.00`). This maps directly onto the original
"Salah Trader Sales" monthly sheets.

## Project layout

```
server/   .NET solution — Domain, Infrastructure (EF), Api (endpoints), Tests
web/      Vite React app — features/, components/ (iOS design system), lib/, theme/
docker-compose.yml   local full stack
render.yaml          Render blueprint for the API
```

## Tests

```bash
cd server && dotnet test      # tenant isolation, invoice numbering, receivables math
```
