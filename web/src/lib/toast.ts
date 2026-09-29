import { toast } from 'sonner'
import { apiErrorMessage } from './api'

export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast(msg),
  fromError: (e: unknown, fallback?: string) => toast.error(apiErrorMessage(e, fallback)),
}
