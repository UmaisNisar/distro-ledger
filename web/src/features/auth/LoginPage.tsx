import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { PasswordField, TextField } from '../../components/fields'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Button } from '../../components/ui'
import { notify } from '../../lib/toast'
import type { ReactNode } from 'react'

const schema = z.object({
  slug: z.string().min(1, 'Company handle is required'),
  password: z.string().min(1, 'Password is required'),
})
type Form = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data.slug.trim().toLowerCase(), data.password)
      navigate('/')
    } catch (e) {
      notify.fromError(e, 'Incorrect company handle or password.')
    }
  })

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your company workspace">
      <form onSubmit={onSubmit} className="flex flex-col gap-1">
        <TextField label="Company handle" required placeholder="salah-traders" autoCapitalize="none" autoComplete="username" error={errors.slug?.message} {...register('slug')} />
        <PasswordField label="Password" required autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" block loading={isSubmitting} className="mt-2">Sign in</Button>
      </form>
      <p className="subhead text-secondary text-center mt-4">
        New company? <Link to="/onboarding" className="link link-primary font-semibold no-underline">Get started</Link>
      </p>
      <p className="footnote text-tertiary text-center mt-3">
        <Link to="/admin/login" className="link link-hover">Admin console</Link>
      </p>
    </AuthShell>
  )
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-full grid lg:grid-cols-2">
      {/* Brand panel (desktop) — restrained dark editorial, accent only on the mark */}
      <div className="hidden lg:flex flex-col justify-between p-14" style={{ background: 'var(--color-neutral)', color: 'var(--color-neutral-content)' }}>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-lg bg-primary text-primary-content font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>D</span>
          <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>DistroLedger</span>
        </div>
        <div className="max-w-md">
          <h2 className="leading-[1.1]" style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Sales &amp; receivables,<br />without the spreadsheet.
          </h2>
          <p className="mt-4 subhead" style={{ color: 'color-mix(in oklab, var(--color-neutral-content) 68%, transparent)' }}>
            Track invoices, payments and outstanding balances for your distribution business — fast, precise and clean.
          </p>
        </div>
        <div className="footnote pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'color-mix(in oklab, var(--color-neutral-content) 55%, transparent)' }}>
          © {new Date().getFullYear()} DistroLedger
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-4 py-10 relative">
        <div className="absolute top-4 right-4"><ThemeToggle compact /></div>
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="section-header mb-2 lg:hidden">DistroLedger</div>
            <h1 className="large-title">{title}</h1>
            <p className="subhead text-secondary mt-1.5">{subtitle}</p>
          </div>
          <div className="animate-page">{children}</div>
        </div>
      </div>
    </div>
  )
}
