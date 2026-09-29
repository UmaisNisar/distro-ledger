import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type {
  Company,
  Customer,
  CustomerSummary,
  ImportResult,
  InvoiceDoc,
  MonthlySummary,
  Overview,
  Paged,
  Receivables,
  Sale,
} from './types'

// ---------- Dashboard ----------
export function useOverview() {
  return useQuery({
    queryKey: ['overview'],
    queryFn: async () => (await api.get<Overview>('/api/dashboard/overview')).data,
    placeholderData: keepPreviousData,
  })
}

export function useMonthlySummary(year: number) {
  return useQuery({
    queryKey: ['summary', year],
    queryFn: async () => (await api.get<MonthlySummary>(`/api/dashboard/summary?year=${year}`)).data,
    placeholderData: keepPreviousData,
  })
}

// ---------- Sales ----------
export interface SalesFilter {
  year?: number
  month?: number
  customerId?: string
  status?: string
  q?: string
  page?: number
  pageSize?: number
}

export function useSales(filter: SalesFilter) {
  const params = new URLSearchParams()
  if (filter.year) params.set('year', String(filter.year))
  if (filter.month) params.set('month', String(filter.month))
  if (filter.customerId) params.set('customerId', filter.customerId)
  if (filter.status) params.set('status', filter.status)
  if (filter.q) params.set('q', filter.q)
  params.set('page', String(filter.page ?? 1))
  params.set('pageSize', String(filter.pageSize ?? 50))
  return useQuery({
    queryKey: ['sales', filter],
    queryFn: async () => (await api.get<Paged<Sale>>(`/api/sales?${params}`)).data,
    placeholderData: keepPreviousData,
  })
}

function invalidateSales(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['sales'] })
  qc.invalidateQueries({ queryKey: ['overview'] })
  qc.invalidateQueries({ queryKey: ['summary'] })
  qc.invalidateQueries({ queryKey: ['receivables'] })
  qc.invalidateQueries({ queryKey: ['customers'] })
}

export function useSaveSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: unknown }) => {
      if (id) return (await api.put<Sale>(`/api/sales/${id}`, body)).data
      return (await api.post<Sale>('/api/sales', body)).data
    },
    onSuccess: () => invalidateSales(qc),
  })
}

export function useDeleteSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/sales/${id}`),
    onSuccess: () => invalidateSales(qc),
  })
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoice', id],
    enabled: !!id,
    queryFn: async () => (await api.get<InvoiceDoc>(`/api/sales/${id}/invoice`)).data,
  })
}

// ---------- Customers ----------
export function useCustomers(q?: string) {
  return useQuery({
    queryKey: ['customers', q ?? ''],
    queryFn: async () =>
      (await api.get<Customer[]>(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`)).data,
    placeholderData: keepPreviousData,
  })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customer', id],
    enabled: !!id,
    queryFn: async () => (await api.get<Customer>(`/api/customers/${id}`)).data,
    placeholderData: keepPreviousData,
  })
}

export function useCustomerSummary(id: string | undefined, year: number) {
  return useQuery({
    queryKey: ['customer-summary', id, year],
    enabled: !!id,
    queryFn: async () =>
      (await api.get<CustomerSummary>(`/api/customers/${id}/summary?year=${year}`)).data,
    placeholderData: keepPreviousData,
  })
}

export function useSaveCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: unknown }) => {
      if (id) return (await api.put<Customer>(`/api/customers/${id}`, body)).data
      return (await api.post<Customer>('/api/customers', body)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer'] })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

// ---------- Receivables ----------
export function useReceivables() {
  return useQuery({
    queryKey: ['receivables'],
    queryFn: async () => (await api.get<Receivables>('/api/receivables')).data,
    placeholderData: keepPreviousData,
  })
}

// ---------- Settings ----------
export function useUpdateSettings() {
  return useMutation({
    mutationFn: async (body: unknown) => (await api.put<Company>('/api/settings', body)).data,
  })
}

// ---------- Import ----------
export function useImportSales() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<ImportResult>('/api/import/sales', form)).data
    },
    onSuccess: () => invalidateSales(qc),
  })
}
