import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { TextField, TextareaField } from '../../components/fields'
import { Sheet } from '../../components/Sheet'
import { Button, ErrorNote } from '../../components/ui'
import { apiErrorMessage } from '../../lib/api'
import { useSaveCustomer } from '../../lib/queries'
import type { Customer } from '../../lib/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  taxId: z.string().optional(),
  otherIds: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
})
type Form = z.infer<typeof schema>

export function CustomerForm({
  open,
  onClose,
  customer,
}: {
  open: boolean
  onClose: () => void
  customer?: Customer
}) {
  const { company } = useAuth()
  const save = useSaveCustomer()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? '',
      taxId: customer?.taxId ?? '',
      otherIds: customer?.otherIds ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
      city: customer?.city ?? '',
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    setError('')
    try {
      await save.mutateAsync({
        id: customer?.id,
        body: {
          name: data.name,
          taxId: data.taxId || null,
          otherIds: data.otherIds || null,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
        },
      })
      onClose()
    } catch (e) {
      setError(apiErrorMessage(e))
    }
  })

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={customer ? 'Edit customer' : 'New customer'}
      footer={
        <Button block onClick={onSubmit} loading={isSubmitting}>
          {customer ? 'Save changes' : 'Add customer'}
        </Button>
      }
    >
      {error && <ErrorNote message={error} />}
      <TextField label="Name" placeholder="Zee Mart" error={errors.name?.message} {...register('name')} />
      <TextField label={company?.taxIdLabel ?? 'Tax ID'} error={errors.taxId?.message} {...register('taxId')} />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Phone" error={errors.phone?.message} {...register('phone')} />
        <TextField label="City" error={errors.city?.message} {...register('city')} />
      </div>
      <TextField label="Address" error={errors.address?.message} {...register('address')} />
      <TextareaField label="Other IDs (optional)" error={errors.otherIds?.message} {...register('otherIds')} />
    </Sheet>
  )
}
