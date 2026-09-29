import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { TextField } from '../../components/fields'
import { IconDownload, IconUpload } from '../../components/icons'
import { Button, ErrorNote, SectionHeader } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useImportSales, useUpdateSettings } from '../../lib/queries'
import type { ImportResult } from '../../lib/types'
import { ACCENT_PRESETS, applyAccent } from '../../theme/theme'

const schema = z.object({
  name: z.string().min(1, 'Required').max(200),
  themeColor: z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Pick a color'),
  currencyCode: z.string().min(1).max(8),
  currencySymbol: z.string().min(1).max(8),
  taxIdLabel: z.string().min(1).max(40),
  invoicePrefix: z.string().min(1).max(16),
  address: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
})
type Form = z.infer<typeof schema>

export function SettingsPage() {
  const { company, setCompany, logout } = useAuth()
  const update = useUpdateSettings()
  const importSales = useImportSales()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: company?.name ?? '',
      themeColor: company?.themeColor ?? '#0A84FF',
      currencyCode: company?.currencyCode ?? 'PKR',
      currencySymbol: company?.currencySymbol ?? 'Rs',
      taxIdLabel: company?.taxIdLabel ?? 'NTN #',
      invoicePrefix: company?.invoicePrefix ?? 'INV',
      address: company?.address ?? '',
      phone: company?.phone ?? '',
      city: company?.city ?? '',
    },
  })
  const themeColor = watch('themeColor')

  const onSubmit = handleSubmit(async (data) => {
    setError('')
    setSaved(false)
    try {
      const updated = await update.mutateAsync({
        ...data,
        address: data.address || null,
        phone: data.phone || null,
        city: data.city || null,
        logoUrl: company?.logoUrl ?? null,
      })
      setCompany(updated)
      setSaved(true)
    } catch (e) {
      setError(apiErrorMessage(e))
    }
  })

  const onImport = async (file: File) => {
    setImportResult(null)
    try {
      const result = await importSales.mutateAsync(file)
      setImportResult(result)
    } catch (e) {
      setError(apiErrorMessage(e))
    }
  }

  const download = async (path: string, filename: string) => {
    try {
      const res = await api.get(path, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(apiErrorMessage(e))
    }
  }

  return (
    <Page title="Settings">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {error && <ErrorNote message={error} />}
        {saved && <div className="subhead" style={{ color: 'var(--success)' }}>Saved.</div>}

        <SectionHeader>Company</SectionHeader>
        <TextField label="Company name" error={errors.name?.message} {...register('name')} />
        <TextField label="Handle (cannot be changed)" value={`@${company?.slug ?? ''}`} disabled readOnly />

        <div className="field">
          <label className="field-label">Accent color</label>
          <div className="flex flex-wrap gap-2.5 py-1">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setValue('themeColor', c, { shouldValidate: true, shouldDirty: true })
                  applyAccent(c)
                }}
                aria-label={c}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: c,
                  border: themeColor.toLowerCase() === c.toLowerCase() ? '3px solid var(--label)' : '3px solid transparent',
                  boxShadow: '0 0 0 1px var(--separator)',
                  cursor: 'pointer',
                }}
              />
            ))}
            <label style={{ width: 34, height: 34, borderRadius: 999, overflow: 'hidden', boxShadow: '0 0 0 1px var(--separator)', cursor: 'pointer', display: 'inline-flex' }}>
              <input
                type="color"
                value={themeColor}
                onChange={(e) => {
                  setValue('themeColor', e.target.value.toUpperCase(), { shouldValidate: true, shouldDirty: true })
                  applyAccent(e.target.value)
                }}
                style={{ width: 44, height: 44, border: 'none', padding: 0, transform: 'translate(-5px,-5px)', cursor: 'pointer' }}
              />
            </label>
          </div>
          <span className="field-error">{errors.themeColor?.message ?? ''}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextField label="Currency code" error={errors.currencyCode?.message} {...register('currencyCode')} />
          <TextField label="Currency symbol" error={errors.currencySymbol?.message} {...register('currencySymbol')} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Tax ID label" error={errors.taxIdLabel?.message} {...register('taxIdLabel')} />
          <TextField label="Invoice prefix" error={errors.invoicePrefix?.message} {...register('invoicePrefix')} />
        </div>
        <TextField label="Address" error={errors.address?.message} {...register('address')} />
        <div className="grid grid-cols-2 gap-2">
          <TextField label="City" error={errors.city?.message} {...register('city')} />
          <TextField label="Phone" error={errors.phone?.message} {...register('phone')} />
        </div>

        <Button type="submit" block loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </form>

      {/* Data */}
      <SectionHeader>Data</SectionHeader>
      <div className="card p-4 flex flex-col gap-3">
        <div>
          <div className="subhead" style={{ fontWeight: 600 }}>Import sales (CSV)</div>
          <div className="footnote text-secondary">
            Columns: Date, Customer Name, {company?.taxIdLabel ?? 'NTN #'}, Amount, Payment Status, Payment Method, Notes.
            Missing customers are created automatically.
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImport(f)
            e.target.value = ''
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => fileRef.current?.click()} loading={importSales.isPending}>
            <IconUpload width={18} height={18} /> Import CSV
          </Button>
          <Button variant="secondary" onClick={() => download('/api/export/sales.csv', 'sales.csv')}>
            <IconDownload width={18} height={18} /> Export sales
          </Button>
          <Button variant="secondary" onClick={() => download('/api/export/customers.csv', 'customers.csv')}>
            <IconDownload width={18} height={18} /> Export customers
          </Button>
        </div>
        {importResult && (
          <div className="footnote" style={{ color: 'var(--label-secondary)' }}>
            Imported {importResult.imported}, skipped {importResult.skipped}.
            {importResult.errors.length > 0 && (
              <ul className="mt-1" style={{ color: 'var(--danger)' }}>
                {importResult.errors.slice(0, 5).map((er, i) => <li key={i}>• {er}</li>)}
                {importResult.errors.length > 5 && <li>• …and {importResult.errors.length - 5} more</li>}
              </ul>
            )}
          </div>
        )}
      </div>

      <SectionHeader>Session</SectionHeader>
      <Button variant="secondary" onClick={logout}>Sign out</Button>
      <div className="footnote text-tertiary text-center mt-4 mb-2">DistroLedger · {company?.name}</div>
    </Page>
  )
}
