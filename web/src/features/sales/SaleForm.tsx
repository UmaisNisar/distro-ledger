import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { SelectField, TextField, TextareaField } from '../../components/fields'
import { Sheet } from '../../components/Sheet'
import { Button } from '../../components/ui'
import { notify } from '../../lib/toast'
import { inputDate } from '../../lib/format'
import { useDeleteSale, useSaveSale } from '../../lib/queries'
import type { Customer, Sale } from '../../lib/types'

const schema = z
  .object({
    date: z.string().min(1, 'Date is required'),
    customerId: z.string().min(1, 'Select a customer'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    amountPaid: z.coerce.number().min(0, 'Cannot be negative'),
    paymentMethod: z.string().optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((d) => d.amountPaid <= d.amount, {
    path: ['amountPaid'],
    message: 'Paid cannot exceed the amount',
  })

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

const METHODS = ['Cash', 'Bank', 'Cheque', 'Credit', 'Other']

export function SaleForm({
  open,
  onClose,
  sale,
  customers,
}: {
  open: boolean
  onClose: () => void
  sale?: Sale
  customers: Customer[]
}) {
  const save = useSaveSale()
  const del = useDeleteSale()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: sale
      ? {
          date: inputDate(sale.date),
          customerId: sale.customerId,
          amount: sale.amount,
          amountPaid: sale.amountPaid,
          paymentMethod: sale.paymentMethod ?? '',
          notes: sale.notes ?? '',
        }
      : {
          date: inputDate(new Date().toISOString()),
          customerId: '',
          amount: undefined,
          amountPaid: 0,
          paymentMethod: '',
          notes: '',
        },
  })

  const onSubmit = handleSubmit(async (data) => {
    try {
      await save.mutateAsync({
        id: sale?.id,
        body: {
          date: data.date,
          customerId: data.customerId,
          amount: data.amount,
          amountPaid: data.amountPaid,
          paymentStatus: 'Unpaid', // derived server-side from amounts
          paymentMethod: data.paymentMethod || null,
          notes: data.notes || null,
        },
      })
      notify.success(sale ? 'Sale updated' : 'Sale added')
      onClose()
    } catch (e) {
      notify.fromError(e)
    }
  })

  const onDelete = async () => {
    if (!sale || !confirm('Delete this sale?')) return
    try {
      await del.mutateAsync(sale.id)
      notify.success('Sale deleted')
      onClose()
    } catch (e) {
      notify.fromError(e)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={sale ? `Edit ${sale.invoiceNumber}` : 'New sale'}
      footer={
        <div className="flex gap-2">
          {sale && (
            <>
              <Button variant="secondary" onClick={() => navigate(`/invoice/${sale.id}`)}>
                Invoice
              </Button>
              <Button variant="danger" onClick={onDelete} loading={del.isPending}>
                Delete
              </Button>
            </>
          )}
          <Button block onClick={onSubmit} loading={isSubmitting}>
            {sale ? 'Save changes' : 'Add sale'}
          </Button>
        </div>
      }
    >
      <SelectField label="Customer" error={errors.customerId?.message} {...register('customerId')}>
        <option value="">Select a customer…</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>
      <TextField label="Date" type="date" error={errors.date?.message} {...register('date')} />
      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="Amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <TextField
          label="Amount paid"
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          error={errors.amountPaid?.message}
          {...register('amountPaid')}
        />
      </div>
      <SelectField label="Payment method" error={errors.paymentMethod?.message} {...register('paymentMethod')}>
        <option value="">Not set</option>
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </SelectField>
      <TextareaField label="Notes (optional)" error={errors.notes?.message} {...register('notes')} />
    </Sheet>
  )
}
