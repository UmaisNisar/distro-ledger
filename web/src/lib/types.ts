export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid'
export type PaymentMethod = 'Cash' | 'Bank' | 'Cheque' | 'Credit' | 'Other'

export interface Company {
  id: string
  name: string
  slug: string
  themeColor: string
  currencyCode: string
  currencySymbol: string
  taxIdLabel: string
  invoicePrefix: string
  address?: string | null
  phone?: string | null
  city?: string | null
  logoUrl?: string | null
}

export interface AuthResponse {
  token: string
  expiresAt: string
  company: Company
}

export interface Customer {
  id: string
  name: string
  taxId?: string | null
  otherIds?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  totalSales: number
  createdAt: string
}

export interface Sale {
  id: string
  invoiceNumber: string
  date: string
  customerId: string
  customerName: string
  amount: number
  amountPaid: number
  outstanding: number
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod | null
  notes?: string | null
  createdAt: string
}

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface MonthTotal {
  month: number
  monthName: string
  total: number
  transactions: number
}

export interface MonthlySummary {
  year: number
  months: MonthTotal[]
  yearTotal: number
  yearTransactions: number
}

export interface Overview {
  monthSales: number
  monthTransactions: number
  yearSales: number
  totalOutstanding: number
  customerCount: number
  trend: MonthTotal[]
}

export interface MonthBreakdown {
  month: number
  monthName: string
  sales: number
  transactions: number
}

export interface CustomerSummary {
  customerId: string
  customerName: string
  year: number
  yearSales: number
  yearTransactions: number
  months: MonthBreakdown[]
}

export interface ReceivableCustomer {
  customerId: string
  customerName: string
  outstanding: number
  openInvoices: number
  oldestDate?: string | null
  current: number
  days31To60: number
  days61To90: number
  days90Plus: number
}

export interface Receivables {
  totalOutstanding: number
  customers: ReceivableCustomer[]
}

export interface InvoiceDoc {
  company: Company
  customer: Customer
  sale: Sale
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}
