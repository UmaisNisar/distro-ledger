import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { SelectField, TextField } from '../../components/fields'
import { Sheet } from '../../components/Sheet'
import { Button, ErrorNote } from '../../components/ui'
import { apiErrorMessage } from '../../lib/api'
import { useCreateCompany } from '../../lib/adminQueries'
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
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { currencyCode: 'PKR', currencySymbol: 'Rs', taxIdLabel: 'NTN #', invoicePrefix: 'INV', password: '' },
  })

  const onSubmit = handleSubmit(async (data) => {
    setError('')
    try {
      const result = await create.mutateAsync({ ...data, password: data.password || null })
      onCreated(result)
      onClose()
    } catch (e) {
      setError(apiErrorMessage(e))
    }
  })

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New company"
      footer={<Button block onClick={onSubmit} loading={isSubmitting}>Create company</Button>}
    >
      {error && <ErrorNote message={error} />}
      <TextField
        label="Company name"
        placeholder="Salah Traders"
        error={errors.name?.message}
        {...register('name', {
          onChange: (e) => {
            const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            setValue('slug', slug, { shouldValidate: true })
          },
        })}
      />
      <TextField label="Handle (used to sign in)" placeholder="salah-traders" autoCapitalize="none" error={errors.slug?.message} {...register('slug')} />
      <TextField
        label="Password (leave blank to auto-generate)"
        placeholder="Auto-generate"
        error={errors.password?.message}
        {...register('password')}
      />
      <SelectField
        label="Currency"
        error={errors.currencyCode?.message}
        {...register('currencyCode', {
          onChange: (e) => {
            const sym = CURRENCY[e.target.value]
            if (sym) setValue('currencySymbol', sym, { shouldValidate: true })
          },
        })}
      >
        {Object.keys(CURRENCY).map((c) => <option key={c} value={c}>{c}</option>)}
      </SelectField>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Currency symbol" error={errors.currencySymbol?.message} {...register('currencySymbol')} />
        <TextField label="Invoice prefix" error={errors.invoicePrefix?.message} {...register('invoicePrefix')} />
      </div>
      <TextField label="Tax ID label" error={errors.taxIdLabel?.message} {...register('taxIdLabel')} />
    </Sheet>
  )
}
