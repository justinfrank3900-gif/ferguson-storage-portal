import { createClient } from '@/lib/supabase/server'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: docs } = await supabase
    .from('documents')
    .select('id, name, doc_type, signed, url, assets(make, model, file_number)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl" style={{ color: 'var(--ice)' }}>
          Documents
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--steel-400)' }}>
          Authorization forms, insurance certificates, and lien filings.
        </p>
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--steel-800)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--navy-panel-2)' }}>
              {['Document', 'Asset', 'Type', 'Signed'].map((h) => (
                <th key={h} className="text-left font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-3" style={{ color: 'var(--steel-400)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!docs || docs.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--steel-400)' }}>
                  No documents uploaded yet.
                </td>
              </tr>
            )}
            {docs?.map((d: any) => (
              <tr key={d.id} style={{ borderTop: '1px solid var(--steel-800)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--ice)' }}>{d.name}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-200)' }}>
                  {d.assets ? [d.assets.make, d.assets.model].filter(Boolean).join(' ') || d.assets.file_number : '—'}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-400)' }}>{d.doc_type}</td>
                <td className="px-4 py-3">
                  <span
                    className="font-mono text-[10px] uppercase px-2 py-1 rounded-sm"
                    style={{ background: 'var(--navy-panel-2)', color: d.signed ? 'var(--success)' : 'var(--steel-400)' }}
                  >
                    {d.signed ? 'Signed' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
