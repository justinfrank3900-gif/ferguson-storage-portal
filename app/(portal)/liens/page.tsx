import { createClient } from '@/lib/supabase/server'
import FileLien from './FileLien'

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function statusDisplay(lien: { status: string; expiry_date: string | null }) {
  if (lien.status === 'pending') return { label: 'Needs Filing', color: 'var(--danger)' }
  const days = daysUntil(lien.expiry_date)
  if (days !== null && days < 0) return { label: 'Expired', color: 'var(--danger)' }
  if (days !== null && days <= 30) return { label: `Renew — ${days}d`, color: 'var(--brass)' }
  return { label: 'Filed', color: 'var(--success)' }
}

export default async function LiensPage() {
  const supabase = await createClient()
  const { data: liens } = await supabase
    .from('liens')
    .select('id, registration_number, filed_date, expiry_date, status, assets(make, model, vin, file_number)')
    .order('created_at', { ascending: false })

  const needsAttention = (liens || []).filter((l: any) => {
    const s = statusDisplay(l)
    return s.label !== 'Filed'
  }).length

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--ice)' }}>
            Lien Registry
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--steel-400)' }}>
            Garage Keepers&apos; Lien Act registrations and renewal tracking.
          </p>
        </div>
        {needsAttention > 0 && (
          <span
            className="font-mono text-[10px] uppercase px-3 py-2 rounded-sm"
            style={{ background: 'var(--navy-panel-2)', color: 'var(--danger)', border: '1px solid var(--steel-800)' }}
          >
            {needsAttention} need{needsAttention === 1 ? 's' : ''} attention
          </span>
        )}
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--steel-800)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--navy-panel-2)' }}>
              {['Asset', 'Registration #', 'Filed', 'Expiry', 'Status', ''].map((h) => (
                <th key={h} className="text-left font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-3" style={{ color: 'var(--steel-400)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!liens || liens.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--steel-400)' }}>
                  No liens yet. One is created automatically the moment a new asset is picked up.
                </td>
              </tr>
            )}
            {liens?.map((l: any) => {
              const s = statusDisplay(l)
              return (
                <tr key={l.id} style={{ borderTop: '1px solid var(--steel-800)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--ice)' }}>
                    {l.assets ? [l.assets.make, l.assets.model].filter(Boolean).join(' ') || l.assets.file_number : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--steel-200)' }}>{l.registration_number || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-400)' }}>{l.filed_date || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-400)' }}>{l.expiry_date || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] uppercase px-2 py-1 rounded-sm" style={{ background: 'var(--navy-panel-2)', color: s.color }}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <FileLien lien={l} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
