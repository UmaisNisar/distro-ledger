import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAdmin } from '../../auth/AdminContext'
import { TextField } from '../../components/fields'
import { Button, ErrorNote } from '../../components/ui'
import { apiErrorMessage } from '../../lib/api'

const schema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
})
type Form = z.infer<typeof schema>

export function AdminLoginPage() {
  const { login } = useAdmin()
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
      await login(data.username.trim(), data.password)
      navigate('/admin')
    } catch (e) {
      setError(apiErrorMessage(e, 'Incorrect admin credentials.'))
    }
  })

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="footnote text-secondary" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Platform Admin
          </div>
          <h1 className="large-title mt-1">Console</h1>
        </div>
        <div className="card p-5 sm:p-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-2">
            {error && <ErrorNote message={error} />}
            <TextField label="Username" autoCapitalize="none" autoComplete="username" error={errors.username?.message} {...register('username')} />
            <TextField label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
            <Button type="submit" block loading={isSubmitting} className="mt-2">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
