import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { PasswordField, SelectField, TextField } from '../../components/fields'
import { Button } from '../../components/ui'
import { notify } from '../../lib/toast'
import { ACCENT_PRESETS, applyAccent } from '../../theme/theme'
import { AuthShell } from '../auth/LoginPage'

const schema = z
  .object({
    name: z.string().min(1, 'Company name is required').max(200),
    slug: z.string().min(1, 'Handle is required').max(80).regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
    address: z.string().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    themeColor: z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Pick a color'),
    currencyCode: z.string().min(1).max(8),
    currencySymbol: z.string().min(1).max(8),
    taxIdLabel: z.string().min(1).max(40),
    invoicePrefix: z.string().min(1).max(16),
    password: z.string().min(6, 'At least 6 characters'),
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' })

type Form = z.infer<typeof schema>
const STEP_FIELDS: (keyof Form)[][] = [
  ['name', 'slug', 'address', 'phone', 'city'],
  ['themeColor', 'currencyCode', 'currencySymbol', 'taxIdLabel', 'invoicePrefix'],
  ['password', 'confirm'],
]
const CURRENCY: Record<string, string> = { PKR: 'Rs', USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'AED' }

export function OnboardingPage() {
  const { onboard } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { themeColor: '#17613F', currencyCode: 'PKR', currencySymbol: 'Rs', taxIdLabel: 'NTN #', invoicePrefix: 'INV' },
  })
  const themeColor = watch('themeColor')

  const next = async () => {
    if (await trigger(STEP_FIELDS[step])) setStep((s) => Math.min(s + 1, 2))
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { confirm, ...payload } = data
      void confirm
      await onboard(payload)
      navigate('/')
    } catch (e) {
      notify.fromError(e, 'Could not create your workspace.')
    }
  })

  return (
    <AuthShell title="Set up your company" subtitle={`Step ${step + 1} of 3`}>
      <ul className="steps w-full mb-5">
        <li className={`step ${step >= 0 ? 'step-primary' : ''}`}>Company</li>
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Branding</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Password</li>
      </ul>

      <form onSubmit={onSubmit} className="flex flex-col gap-1">
        {step === 0 && (
          <>
            <TextField
              label="Company name"
              required
              placeholder="Salah Traders"
              error={errors.name?.message}
              {...register('name', {
                onChange: (e) => setValue('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''), { shouldValidate: true }),
              })}
            />
            <TextField label="Company handle (used to sign in)" required placeholder="salah-traders" autoCapitalize="none" error={errors.slug?.message} {...register('slug')} />
            <TextField label="Address (optional)" error={errors.address?.message} {...register('address')} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="City (optional)" error={errors.city?.message} {...register('city')} />
              <TextField label="Phone (optional)" error={errors.phone?.message} {...register('phone')} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="subhead text-secondary mb-2">
              Optional — sensible defaults are already set. Change anything now, or later in Settings.
            </p>
            <label className="block text-sm font-medium mb-2 text-secondary">Accent color</label>
            <div className="flex flex-wrap gap-2.5 items-center mb-2">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => { setValue('themeColor', c, { shouldValidate: true }); applyAccent(c) }}
                  className="rounded-full transition-transform hover:scale-110"
                  style={{ width: 32, height: 32, background: c, outline: themeColor.toLowerCase() === c.toLowerCase() ? '3px solid var(--color-base-content)' : '2px solid transparent', outlineOffset: 2 }}
                />
              ))}
              <input type="color" value={themeColor} onChange={(e) => { setValue('themeColor', e.target.value.toUpperCase(), { shouldValidate: true }); applyAccent(e.target.value) }} className="w-9 h-9 rounded-full cursor-pointer bg-transparent border-0" aria-label="Custom color" />
            </div>
            <SelectField
              label="Currency"
              value={watch('currencyCode')}
              onChange={(v) => {
                setValue('currencyCode', v, { shouldValidate: true })
                const s = CURRENCY[v]
                if (s) setValue('currencySymbol', s, { shouldValidate: true })
              }}
              options={Object.keys(CURRENCY).map((c) => ({ value: c, label: c }))}
              error={errors.currencyCode?.message}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Currency symbol" error={errors.currencySymbol?.message} {...register('currencySymbol')} />
              <TextField label="Invoice prefix" error={errors.invoicePrefix?.message} {...register('invoicePrefix')} />
            </div>
            <TextField label="Tax ID label" placeholder="NTN #" error={errors.taxIdLabel?.message} {...register('taxIdLabel')} />
          </>
        )}

        {step === 2 && (
          <>
            <p className="subhead text-secondary mb-1">One shared password signs your whole team into this company.</p>
            <PasswordField label="Password" required autoComplete="new-password" error={errors.password?.message} {...register('password')} />
            <PasswordField label="Confirm password" required autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
          </>
        )}

        <div className="flex gap-2 mt-3">
          {step > 0 && <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>Back</Button>}
          {step < 2 ? (
            <Button type="button" block onClick={next}>Continue</Button>
          ) : (
            <Button type="submit" block loading={isSubmitting}>Create workspace</Button>
          )}
        </div>
        {step === 1 && (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mx-auto mt-2 text-sm font-semibold text-secondary hover:text-base-content transition-colors"
          >
            Skip — use defaults
          </button>
        )}
      </form>

      <p className="subhead text-secondary text-center mt-4">
        Already have one? <Link to="/login" className="link link-primary font-semibold no-underline">Sign in</Link>
      </p>
    </AuthShell>
  )
}
