import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { SelectField, TextField } from '../../components/fields'
import { Button, ErrorNote } from '../../components/ui'
import { apiErrorMessage } from '../../lib/api'
import { ACCENT_PRESETS, applyAccent } from '../../theme/theme'
import { AuthShell } from '../auth/LoginPage'

const schema = z
  .object({
    name: z.string().min(1, 'Company name is required').max(200),
    slug: z
      .string()
      .min(1, 'Handle is required')
      .max(80)
      .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
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
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })

type Form = z.infer<typeof schema>

const STEP_FIELDS: (keyof Form)[][] = [
  ['name', 'slug', 'address', 'phone', 'city'],
  ['themeColor', 'currencyCode', 'currencySymbol', 'taxIdLabel', 'invoicePrefix'],
  ['password', 'confirm'],
]

export function OnboardingPage() {
  const { onboard } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')

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
    defaultValues: {
      themeColor: '#0A84FF',
      currencyCode: 'PKR',
      currencySymbol: 'Rs',
      taxIdLabel: 'NTN #',
      invoicePrefix: 'INV',
    },
  })

  const themeColor = watch('themeColor')

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step])
    if (ok) setStep((s) => Math.min(s + 1, 2))
  }

  const onSubmit = handleSubmit(async (data) => {
    setError('')
    try {
      const { confirm, ...payload } = data
      void confirm
      await onboard(payload)
      navigate('/')
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not create your workspace.'))
    }
  })

  return (
    <AuthShell title="Set up your company" subtitle={`Step ${step + 1} of 3`}>
      {/* progress dots */}
      <div className="flex gap-1.5 justify-center mb-5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: i === step ? 22 : 7,
              height: 7,
              borderRadius: 999,
              background: i <= step ? 'var(--accent)' : 'var(--fill-strong)',
              transition: 'all 0.2s ease',
            }}
          />
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        {error && <ErrorNote message={error} />}

        {step === 0 && (
          <>
            <TextField
              label="Company name"
              placeholder="Salah Traders"
              error={errors.name?.message}
              {...register('name', {
                onChange: (e) => {
                  const slug = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                  setValue('slug', slug, { shouldValidate: true })
                },
              })}
            />
            <TextField
              label="Company handle (used to sign in)"
              placeholder="salah-traders"
              autoCapitalize="none"
              error={errors.slug?.message}
              {...register('slug')}
            />
            <TextField label="Address (optional)" error={errors.address?.message} {...register('address')} />
            <div className="grid grid-cols-2 gap-2">
              <TextField label="City (optional)" error={errors.city?.message} {...register('city')} />
              <TextField label="Phone (optional)" error={errors.phone?.message} {...register('phone')} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="field">
              <label className="field-label">Accent color</label>
              <div className="flex flex-wrap gap-2.5 py-1">
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setValue('themeColor', c, { shouldValidate: true })
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
                <label
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    overflow: 'hidden',
                    boxShadow: '0 0 0 1px var(--separator)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                  }}
                >
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => {
                      setValue('themeColor', e.target.value.toUpperCase(), { shouldValidate: true })
                      applyAccent(e.target.value)
                    }}
                    style={{ width: 44, height: 44, border: 'none', padding: 0, transform: 'translate(-5px,-5px)', cursor: 'pointer' }}
                  />
                </label>
              </div>
              <span className="field-error">{errors.themeColor?.message ?? ''}</span>
            </div>

            <SelectField
              label="Currency"
              error={errors.currencyCode?.message}
              {...register('currencyCode', {
                onChange: (e) => {
                  const map: Record<string, string> = { PKR: 'Rs', USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'AED' }
                  const sym = map[e.target.value]
                  if (sym) setValue('currencySymbol', sym, { shouldValidate: true })
                },
              })}
            >
              <option value="PKR">PKR — Pakistani Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — Pound</option>
              <option value="INR">INR — Indian Rupee</option>
              <option value="AED">AED — UAE Dirham</option>
            </SelectField>

            <div className="grid grid-cols-2 gap-2">
              <TextField label="Currency symbol" error={errors.currencySymbol?.message} {...register('currencySymbol')} />
              <TextField label="Invoice prefix" error={errors.invoicePrefix?.message} {...register('invoicePrefix')} />
            </div>
            <TextField
              label="Tax ID label"
              placeholder="NTN #"
              error={errors.taxIdLabel?.message}
              {...register('taxIdLabel')}
            />
          </>
        )}

        {step === 2 && (
          <>
            <p className="subhead text-secondary mb-1">
              One shared password signs your whole team into this company.
            </p>
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <TextField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register('confirm')}
            />
          </>
        )}

        <div className="flex gap-2 mt-3">
          {step > 0 && (
            <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" block onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="submit" block loading={isSubmitting}>
              Create workspace
            </Button>
          )}
        </div>
      </form>

      <p className="subhead text-secondary text-center mt-4">
        Already have one?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
