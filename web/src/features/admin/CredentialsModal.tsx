import { useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button } from '../../components/ui'
import { IconCheck } from '../../components/icons'
import type { CompanyCredentials } from '../../lib/types'

export function CredentialsModal({
  data,
  onClose,
}: {
  data: CompanyCredentials
  onClose: () => void
}) {
  const loginUrl = `${location.origin}/login`
  return (
    <Sheet open onClose={onClose} title="Company credentials" footer={<Button block onClick={onClose}>Done</Button>}>
      <p className="subhead text-secondary">
        Share these with <b style={{ color: 'var(--label)' }}>{data.company.name}</b>. The password is shown
        only once — copy it now.
      </p>
      <CopyRow label="Login URL" value={loginUrl} />
      <CopyRow label="Company handle" value={data.slug} />
      <CopyRow label="Password" value={data.password} mono />
    </Sheet>
  )
}

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="flex gap-2">
        <div
          className="field-input flex items-center"
          style={{ flex: 1, fontFamily: mono ? 'ui-monospace, monospace' : undefined, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {value}
        </div>
        <Button variant="secondary" onClick={copy} type="button">
          {copied ? <IconCheck width={18} height={18} /> : 'Copy'}
        </Button>
      </div>
    </div>
  )
}
