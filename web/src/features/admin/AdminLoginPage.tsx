import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAdmin } from '../../auth/AdminContext'
import { PasswordField, TextField } from '../../components/fields'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Button } from '../../components/ui'
import { notify } from '../../lib/toast'

const schema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
})
type Form = z.infer<typeof schema>

export function AdminLoginPage() {
  const { login } = useAdmin()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data.username.trim(), data.password)
      navigate('/admin')
    } catch (e) {
      notify.fromError(e, 'Incorrect admin credentials.')
    }
  })

  return (
    <div className="min-h-full grid place-items-center px-4 py-10 relative">
      <div className="absolute top-4 right-4"><ThemeToggle compact /></div>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-primary text-primary-content mx-auto mb-3">
            <ShieldCheck size={28} />
          </span>
          <div className="footnote text-secondary uppercase tracking-widest">Platform Admin</div>
          <h1 className="large-title mt-1">Console</h1>
        </div>
        <div className="panel p-6 animate-page">
          <form onSubmit={onSubmit} className="flex flex-col gap-1">
            <TextField label="Username" required autoCapitalize="none" autoComplete="username" error={errors.username?.message} {...register('username')} />
            <PasswordField label="Password" required autoComplete="current-password" error={errors.password?.message} {...register('password')} />
            <Button type="submit" block loading={isSubmitting} className="mt-2">Sign in</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
