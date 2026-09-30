import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { Combobox, MoneyField, SelectField, TextField, TextareaField } from '../../components/fields'
import { Sheet } from '../../components/Sheet'
import { useConfirm } from '../../components/ConfirmProvider'
import { Button } from '../../components/ui'
import { notify } from '../../lib/toast'
import { inputDate, money } from '../../lib/format'
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
  presetCustomerId,
}: {
  open: boolean
  onClose: () => void
  sale?: Sale
  customers: Customer[]
  presetCustomerId?: string
}) {
  const save = useSaveSale()
  const del = useDeleteSale()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { company } = useAuth()
  const symbol = company?.currencySymbol ?? 'Rs'

  const {
    register,
    control,
    watch,
    setValue,
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
          customerId: presetCustomerId ?? '',
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
    if (!sale) return
    const ok = await confirm({
      title: 'Delete this sale?',
      message: `${sale.invoiceNumber} will be permanently removed.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(sale.id)
      notify.success('Sale deleted')
      onClose()
    } catch (e) {
      notify.fromError(e)
    }
  }

  // Received defaults to the total (most sales are paid in full) until the user
  // edits it themselves. Not auto-mirrored when editing an existing sale.
  const paidEdited = useRef(!!sale)

  // Live payment status derived from the two amounts (clarifies their relationship).
  const amountV = Number(watch('amount')) || 0
  const paidV = Number(watch('amountPaid')) || 0
  const outstanding = Math.max(0, amountV - paidV)
  const derivedStatus = amountV <= 0 ? null : paidV <= 0 ? 'Unpaid' : paidV >= amountV ? 'Paid' : 'Partial'
  const statusColor =
    derivedStatus === 'Paid' ? 'var(--color-success)' : derivedStatus === 'Partial' ? 'var(--color-warning)' : 'var(--color-error)'

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow={sale ? 'Edit entry' : 'New entry'}
      title={sale ? `Edit ${sale.invoiceNumber}` : 'Record a sale'}
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
          <Button className="flex-1" onClick={onSubmit} loading={isSubmitting}>
            {sale ? 'Save changes' : 'Add sale'}
          </Button>
        </div>
      }
    >
      <Controller
        name="customerId"
        control={control}
        render={({ field }) => (
          <Combobox
            label="Customer"
            required
            value={field.value ?? ''}
            onChange={field.onChange}
            options={customers.map((c) => ({ value: c.id, label: c.name, hint: c.taxId ?? undefined }))}
            placeholder="Select a customer…"
            error={errors.customerId?.message}
            emptyText="No customers match"
          />
        )}
      />
      <TextField label="Date" type="date" required error={errors.date?.message} {...register('date')} />
      <div className="grid grid-cols-2 gap-2">
        <MoneyField
          label="Total amount"
          required
          symbol={symbol}
          placeholder="0"
          hint="Full invoice value"
          error={errors.amount?.message}
          {...register('amount', {
            onChange: (e) => {
              if (!paidEdited.current) setValue('amountPaid', e.target.value, { shouldValidate: true })
            },
          })}
        />
        <MoneyField
          label="Received"
          symbol={symbol}
          placeholder="0"
          hint="Paid so far · 0 if unpaid"
          error={errors.amountPaid?.message}
          {...register('amountPaid', {
            onChange: () => {
              paidEdited.current = true
            },
          })}
        />
      </div>
      {derivedStatus && (
        <div className="flex items-center justify-between px-3 py-2.5 -mt-1 mb-1 rounded-lg bg-base-200 text-[0.85rem]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
            <span className="font-semibold" style={{ color: statusColor }}>{derivedStatus}</span>
          </span>
          <span className="text-secondary">
            Outstanding <span className="tabular font-semibold text-base-content">{money(outstanding, symbol)}</span>
          </span>
        </div>
      )}
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
