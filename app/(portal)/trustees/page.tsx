import { createClient } from '@/lib/supabase/server'
import AddTrustee from './AddTrustee'

export default async function TrusteesPage() {
  const supabase = await createClient()
  const { data: trustees } = await supabase.from('trustees').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl" style={{ color: 'var(--ice)' }}>
          Trustee Files
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--steel-400)' }}>
          Trustee relationships and authorization records.
        </p>
      </div>

      <AddTrustee />

      <div className="rounded-sm overflow-hidden mt-6" style={{ border: '1px solid var(--steel-800)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--navy-panel-2)' }}>
              {['Name', 'Firm', 'Email', 'Phone'].map((h) => (
                <th key={h} className="text-left font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-3" style={{ color: 'var(--steel-400)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!trustees || trustees.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--steel-400)' }}>
                  No trustees on file yet.
                </td>
              </tr>
            )}
            {trustees?.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid var(--steel-800)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--ice)' }}>{t.name}</td>
                <td className="px-4 py-3" style={{ color: 'var(--steel-200)' }}>{t.firm || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--steel-200)' }}>{t.contact_email || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--steel-200)' }}>{t.contact_phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
