import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { SelectField, TextField } from '../../components/fields'
import { Sheet } from '../../components/Sheet'
import { Button } from '../../components/ui'
import { useCreateCompany } from '../../lib/adminQueries'
import { notify } from '../../lib/toast'
import type { CompanyCredentials } from '../../lib/types'

const schema = z.object({
  name: z.string().min(1, 'Company name is required'),
  slug: z.string().min(1, 'Handle is required').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  password: z.string().optional(),
  currencyCode: z.string().min(1),
  currencySymbol: z.string().min(1),
  taxIdLabel: z.string().min(1),
  invoicePrefix: z.string().min(1),
})
type Form = z.infer<typeof schema>

const CURRENCY: Record<string, string> = { PKR: 'Rs', USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'AED' }

export function CreateCompanyForm({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (c: CompanyCredentials) => void
}) {
  const create = useCreateCompany()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { currencyCode: 'PKR', currencySymbol: 'Rs', taxIdLabel: 'NTN #', invoicePrefix: 'INV', password: '' },
  })

  const onSubmit = handleSubmit(async (data) => {
    try {
      const result = await create.mutateAsync({ ...data, password: data.password || null })
      notify.success(`${result.company.name} created`)
      onCreated(result)
      onClose()
    } catch (e) {
      notify.fromError(e)
    }
  })

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New company"
      footer={<Button block onClick={onSubmit} loading={isSubmitting}>Create company</Button>}
    >
      <TextField
        label="Company name"
        required
        placeholder="Salah Traders"
        error={errors.name?.message}
        {...register('name', {
          onChange: (e) => {
            const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            setValue('slug', slug, { shouldValidate: true })
          },
        })}
      />
      <TextField label="Handle (used to sign in)" required placeholder="salah-traders" autoCapitalize="none" error={errors.slug?.message} {...register('slug')} />
      <TextField
        label="Password (leave blank to auto-generate)"
        placeholder="Auto-generate"
        error={errors.password?.message}
        {...register('password')}
      />
      <SelectField
        label="Currency"
        value={watch('currencyCode')}
        onChange={(v) => {
          setValue('currencyCode', v, { shouldValidate: true })
          const sym = CURRENCY[v]
          if (sym) setValue('currencySymbol', sym, { shouldValidate: true })
        }}
        options={Object.keys(CURRENCY).map((c) => ({ value: c, label: c }))}
        error={errors.currencyCode?.message}
      />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Currency symbol" error={errors.currencySymbol?.message} {...register('currencySymbol')} />
        <TextField label="Invoice prefix" error={errors.invoicePrefix?.message} {...register('invoicePrefix')} />
      </div>
      <TextField label="Tax ID label" error={errors.taxIdLabel?.message} {...register('taxIdLabel')} />
    </Sheet>
  )
}
