import { createClient } from '@/lib/supabase/server'

export default async function StorageLedgerPage() {
  const supabase = await createClient()
  const { data: ledger } = await supabase
    .from('storage_ledger')
    .select('id, daily_rate, storage_start, released_date, assets(make, model, file_number)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl" style={{ color: 'var(--ice)' }}>
          Storage Ledger
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--steel-400)' }}>
          Daily rate accrual and release tracking per unit.
        </p>
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--steel-800)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--navy-panel-2)' }}>
              {['Asset', 'Rate/Day', 'Storage Start', 'Days Accrued', 'Total', 'Released'].map((h) => (
                <th key={h} className="text-left font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-3" style={{ color: 'var(--steel-400)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!ledger || ledger.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--steel-400)' }}>
                  No storage entries yet.
                </td>
              </tr>
            )}
            {ledger?.map((l: any) => {
              const start = l.storage_start ? new Date(l.storage_start) : null
              const end = l.released_date ? new Date(l.released_date) : new Date()
              const days = start ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000)) : 0
              const total = (days * (l.daily_rate || 0)).toFixed(2)
              return (
                <tr key={l.id} style={{ borderTop: '1px solid var(--steel-800)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--ice)' }}>
                    {l.assets ? [l.assets.make, l.assets.model].filter(Boolean).join(' ') || l.assets.file_number : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--steel-200)' }}>${l.daily_rate}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-400)' }}>{l.storage_start || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-400)' }}>{days}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--steel-200)' }}>${total}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-400)' }}>{l.released_date || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
