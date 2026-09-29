import { zodResolver } from '@hookform/resolvers/zod'
import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { TextField } from '../../components/fields'
import { Button, SectionHeader } from '../../components/ui'
import { api } from '../../lib/api'
import { useImportSales, useUpdateSettings } from '../../lib/queries'
import { notify } from '../../lib/toast'
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
  const { company, setCompany } = useAuth()
  const update = useUpdateSettings()
  const importSales = useImportSales()
  const fileRef = useRef<HTMLInputElement>(null)

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
      themeColor: company?.themeColor ?? '#17613F',
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
    try {
      const updated = await update.mutateAsync({
        ...data,
        address: data.address || null,
        phone: data.phone || null,
        city: data.city || null,
        logoUrl: company?.logoUrl ?? null,
      })
      setCompany(updated)
      notify.success('Settings saved')
    } catch (e) {
      notify.fromError(e)
    }
  })

  const onImport = async (file: File) => {
    try {
      const r = await importSales.mutateAsync(file)
      notify.success(`Imported ${r.imported} sale${r.imported === 1 ? '' : 's'}${r.skipped ? `, skipped ${r.skipped}` : ''}`)
      if (r.errors.length) notify.error(`${r.errors.length} row(s) had issues`)
    } catch (e) {
      notify.fromError(e)
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
      notify.fromError(e)
    }
  }

  return (
    <Page title="Settings" subtitle="Company profile, branding and data">
      <form onSubmit={onSubmit} className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-5 flex flex-col">
          <SectionHeader>Company</SectionHeader>
          <TextField label="Company name" error={errors.name?.message} {...register('name')} />
          <TextField label="Handle (cannot be changed)" value={`@${company?.slug ?? ''}`} disabled readOnly />
          <TextField label="Address" error={errors.address?.message} {...register('address')} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="City" error={errors.city?.message} {...register('city')} />
            <TextField label="Phone" error={errors.phone?.message} {...register('phone')} />
          </div>
        </div>

        <div className="panel p-5 flex flex-col">
          <SectionHeader>Branding & format</SectionHeader>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-2 text-secondary">Accent color</label>
            <div className="flex flex-wrap gap-2.5 items-center">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => {
                    setValue('themeColor', c, { shouldValidate: true, shouldDirty: true })
                    applyAccent(c)
                  }}
                  className="rounded-full transition-transform hover:scale-110"
                  style={{
                    width: 32,
                    height: 32,
                    background: c,
                    outline: themeColor.toLowerCase() === c.toLowerCase() ? '3px solid var(--color-base-content)' : '2px solid transparent',
                    outlineOffset: 2,
                  }}
                />
              ))}
              <input
                type="color"
                value={themeColor}
                onChange={(e) => {
                  setValue('themeColor', e.target.value.toUpperCase(), { shouldValidate: true, shouldDirty: true })
                  applyAccent(e.target.value)
                }}
                className="w-9 h-9 rounded-full overflow-hidden cursor-pointer bg-transparent border-0"
                aria-label="Custom color"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Currency code" error={errors.currencyCode?.message} {...register('currencyCode')} />
            <TextField label="Currency symbol" error={errors.currencySymbol?.message} {...register('currencySymbol')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Tax ID label" error={errors.taxIdLabel?.message} {...register('taxIdLabel')} />
            <TextField label="Invoice prefix" error={errors.invoicePrefix?.message} {...register('invoicePrefix')} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
        </div>
      </form>

      <div className="panel p-5">
        <SectionHeader>Data</SectionHeader>
        <p className="subhead text-secondary mb-3">
          Import sales from a CSV (Date, Customer Name, {company?.taxIdLabel ?? 'NTN #'}, Amount, Payment Status, Payment Method, Notes).
          Missing customers are created automatically.
        </p>
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
            <Upload size={16} /> Import CSV
          </Button>
          <Button variant="secondary" onClick={() => download('/api/export/sales.csv', 'sales.csv')}>
            <Download size={16} /> Export sales
          </Button>
          <Button variant="secondary" onClick={() => download('/api/export/customers.csv', 'customers.csv')}>
            <Download size={16} /> Export customers
          </Button>
        </div>
      </div>
    </Page>
  )
}
