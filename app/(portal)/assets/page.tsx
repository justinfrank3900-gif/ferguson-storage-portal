import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StatusSelect from './StatusSelect'

export default async function AssetsPage() {
  const supabase = await createClient()
  const { data: assets } = await supabase
    .from('assets')
    .select('id, asset_type, make, model, year, vin, file_number, status, pickup_date')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--ice)' }}>
            Asset Intake
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--steel-400)' }}>
            Every unit picked up, from field intake through release.
          </p>
        </div>
        <Link
          href="/assets/new"
          className="px-4 py-2.5 rounded-sm text-sm font-mono uppercase tracking-wider"
          style={{ background: 'var(--brass)', color: 'var(--navy-deep)' }}
        >
          New Pickup
        </Link>
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--steel-800)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--navy-panel-2)' }}>
              {['Asset', 'VIN', 'File #', 'Status', 'Pickup Date'].map((h) => (
                <th
                  key={h}
                  className="text-left font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-3"
                  style={{ color: 'var(--steel-400)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!assets || assets.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--steel-400)' }}>
                  No assets on file yet. Log the first pickup to get started.
                </td>
              </tr>
            )}
            {assets?.map((a) => (
              <tr key={a.id} style={{ borderTop: '1px solid var(--steel-800)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--ice)' }}>
                  {[a.year, a.make, a.model].filter(Boolean).join(' ') || a.asset_type}
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--steel-200)' }}>
                  {a.vin || '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--steel-200)' }}>
                  {a.file_number || '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusSelect assetId={a.id} status={a.status} />
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-400)' }}>
                  {a.pickup_date ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
