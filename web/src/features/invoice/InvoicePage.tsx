import { useNavigate, useParams } from 'react-router-dom'
import { IconPrint } from '../../components/icons'
import { Button, PaymentBadge, Spinner } from '../../components/ui'
import { money, shortDate } from '../../lib/format'
import { useInvoice } from '../../lib/queries'

export function InvoicePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useInvoice(id)

  if (isLoading || !data) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ color: 'var(--accent)' }}>
        <Spinner />
      </div>
    )
  }

  const { company, customer, sale } = data
  const symbol = company.currencySymbol

  return (
    <div className="min-h-full" style={{ background: 'var(--bg-grouped)' }}>
      {/* Toolbar (hidden when printing) */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between px-4 py-3 hairline"
        style={{ background: 'var(--bg-surface)' }}>
        <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
        <Button onClick={() => window.print()}>
          <IconPrint width={18} height={18} /> Print / Save PDF
        </Button>
      </div>

      {/* Sheet */}
      <div className="mx-auto max-w-2xl p-4 sm:p-8">
        <div className="card p-6 sm:p-10" style={{ background: '#fff', color: '#111' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="title-2" style={{ color: company.themeColor }}>{company.name}</div>
              {company.address && <div className="footnote" style={{ color: '#555' }}>{company.address}</div>}
              {(company.city || company.phone) && (
                <div className="footnote" style={{ color: '#555' }}>
                  {[company.city, company.phone].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="headline">INVOICE</div>
              <div className="footnote" style={{ color: '#555' }}>{sale.invoiceNumber}</div>
              <div className="footnote" style={{ color: '#555' }}>{shortDate(sale.date)}</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="footnote" style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bill to
            </div>
            <div className="headline mt-1">{customer.name}</div>
            {customer.taxId && <div className="footnote" style={{ color: '#555' }}>{company.taxIdLabel}: {customer.taxId}</div>}
            {customer.address && <div className="footnote" style={{ color: '#555' }}>{customer.address}</div>}
          </div>

          {/* Line */}
          <table className="w-full mt-8" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                <th className="footnote" style={{ padding: '8px 0', color: '#888' }}>Description</th>
                <th className="footnote" style={{ padding: '8px 0', color: '#888', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 0' }}>
                  Sale — {shortDate(sale.date)}
                  {sale.notes ? <div className="footnote" style={{ color: '#777' }}>{sale.notes}</div> : null}
                </td>
                <td style={{ padding: '12px 0', textAlign: 'right' }}>{money(sale.amount, symbol)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div style={{ width: 240 }}>
              <Row label="Total" value={money(sale.amount, symbol)} bold />
              <Row label="Paid" value={money(sale.amountPaid, symbol)} />
              <Row label="Balance due" value={money(sale.outstanding, symbol)} bold />
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            {sale.paymentMethod && <div className="footnote" style={{ color: '#555' }}>Method: {sale.paymentMethod}</div>}
            <PaymentBadge status={sale.paymentStatus} />
          </div>

          <div className="footnote text-center mt-10" style={{ color: '#aaa' }}>
            Thank you for your business.
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1.5" style={{ borderTop: '1px solid #eee' }}>
      <span className="subhead" style={{ color: '#555', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span className="subhead" style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  )
}
