import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { TextField } from '../../components/fields'
import { Button, ErrorNote } from '../../components/ui'
import { apiErrorMessage } from '../../lib/api'

const schema = z.object({
  slug: z.string().min(1, 'Company handle is required'),
  password: z.string().min(1, 'Password is required'),
})
type Form = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (data) => {
    setError('')
    try {
      await login(data.slug.trim().toLowerCase(), data.password)
      navigate('/')
    } catch (e) {
      setError(apiErrorMessage(e, 'Incorrect company handle or password.'))
    }
  })

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your company workspace">
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        {error && <ErrorNote message={error} />}
        <TextField
          label="Company handle"
          placeholder="salah-traders"
          autoCapitalize="none"
          autoComplete="username"
          error={errors.slug?.message}
          {...register('slug')}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" block loading={isSubmitting} className="mt-2">
          Sign in
        </Button>
      </form>
      <p className="subhead text-secondary text-center mt-4">
        New company?{' '}
        <Link to="/onboarding" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Get started
        </Link>
      </p>
    </AuthShell>
  )
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="title-2" style={{ color: 'var(--accent)' }}>DistroLedger</div>
          <h1 className="large-title mt-2">{title}</h1>
          <p className="subhead text-secondary mt-1">{subtitle}</p>
        </div>
        <div className="card p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}
