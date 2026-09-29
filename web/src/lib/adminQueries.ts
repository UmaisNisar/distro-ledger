import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from './adminApi'
import type { CompanyAdmin, CompanyCredentials } from './types'

export function useCompanies() {
  return useQuery({
    queryKey: ['admin-companies'],
    queryFn: async () => (await adminApi.get<CompanyAdmin[]>('/api/admin/companies')).data,
  })
}

export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: unknown) =>
      (await adminApi.post<CompanyCredentials>('/api/admin/companies', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-companies'] }),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (id: string) =>
      (await adminApi.post<CompanyCredentials>(`/api/admin/companies/${id}/reset-password`, {})).data,
  })
}

export function useDeleteCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => adminApi.delete(`/api/admin/companies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-companies'] }),
  })
}
