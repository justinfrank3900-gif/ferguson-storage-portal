'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, ShieldCheck } from 'lucide-react'

export default function VerifyPage() {
  const [fileNumber, setFileNumber] = useState('')
  const [result, setResult] = useState<any>(null)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearched(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('assets')
      .select('make, model, year, status, pickup_date, file_number, liens(registration_number, status)')
      .eq('file_number', fileNumber)
      .maybeSingle()
    setResult(data)
  }

  return (
    <div className="min-h-screen guilloche-bg flex items-center justify-center px-6" style={{ background: 'var(--navy-deep)' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <ShieldCheck size={28} style={{ color: 'var(--brass)' }} />
          <h1 className="font-display text-2xl mt-3" style={{ color: 'var(--ice)' }}>
            Ferguson Storage
          </h1>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase mt-1" style={{ color: 'var(--steel-400)' }}>
            Asset Verification
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            value={fileNumber}
            onChange={(e) => setFileNumber(e.target.value)}
            placeholder="Enter file reference number"
            className="flex-1 px-3 py-3 text-sm rounded-sm font-mono"
            style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
          />
          <button type="submit" className="px-4 rounded-sm" style={{ background: 'var(--ice)' }}>
            <Search size={16} color="var(--navy-panel)" />
          </button>
        </form>

        {searched && !result && (
          <p className="text-sm text-center" style={{ color: 'var(--steel-400)' }}>
            No record found for that file reference number.
          </p>
        )}

        {result && (
          <div className="rounded-sm p-5" style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--brass)' }}>
              Verified Record
            </p>
            <Row label="Asset" value={[result.year, result.make, result.model].filter(Boolean).join(' ')} />
            <Row label="File #" value={result.file_number} />
            <Row label="Status" value={result.status} />
            <Row label="Pickup Date" value={result.pickup_date} />
            <Row label="Lien Status" value={result.liens?.[0]?.status || 'Filing in progress'} />
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex text-sm py-1.5" style={{ borderTop: '1px solid var(--steel-800)' }}>
      <span className="w-28 shrink-0" style={{ color: 'var(--steel-400)' }}>{label}</span>
      <span style={{ color: 'var(--ice)' }}>{value || '—'}</span>
    </div>
  )
}
