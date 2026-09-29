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
        <TextField label="Company handle" placeholder="salah-traders" autoCapitalize="none" autoComplete="username" error={errors.slug?.message} {...register('slug')} />
        <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
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
      {/* Brand panel (desktop) */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-primary-content relative overflow-hidden" style={{ background: 'var(--color-primary)' }}>
        <div className="flex items-center gap-2 relative z-10">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/20 font-extrabold">D</span>
          <span className="font-bold text-xl">DistroLedger</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold leading-tight">Sales & receivables,<br />without the spreadsheet.</h2>
          <p className="mt-3 opacity-80 max-w-sm">Track invoices, payments and outstanding balances for your distribution business — fast and clean.</p>
        </div>
        <div className="opacity-60 footnote relative z-10">© {new Date().getFullYear()} DistroLedger</div>
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -right-8 top-12 w-40 h-40 rounded-full bg-white/10" />
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-4 py-10 relative">
        <div className="absolute top-4 right-4"><ThemeToggle compact /></div>
        <div className="w-full max-w-md">
          <div className="text-center mb-6 lg:hidden">
            <div className="title-2 text-primary">DistroLedger</div>
          </div>
          <div className="text-center mb-6">
            <h1 className="large-title">{title}</h1>
            <p className="subhead text-secondary mt-1">{subtitle}</p>
          </div>
          <div className="panel p-6 animate-page">{children}</div>
        </div>
      </div>
    </div>
  )
}
