import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileOutput } from 'lucide-react'

export default async function BankOutreachPage() {
  const supabase = await createClient()
  const { data: outreach } = await supabase
    .from('bank_outreach')
    .select('id, bank_name, contact_name, invoice_sent_date, daily_rate, total_owed, payment_status, asset_id, assets(make, model, vin, file_number)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl" style={{ color: 'var(--ice)' }}>
          Bank Outreach
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--steel-400)' }}>
          Notification, invoicing, and the Asset Secured Report per bank.
        </p>
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--steel-800)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--navy-panel-2)' }}>
              {['Bank', 'Asset', 'Invoiced', 'Rate/Day', 'Owed', 'Status', ''].map((h) => (
                <th key={h} className="text-left font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-3" style={{ color: 'var(--steel-400)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!outreach || outreach.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--steel-400)' }}>
                  No bank files yet. Once an asset is in storage, notify the bank and it will show here.
                </td>
              </tr>
            )}
            {outreach?.map((o: any) => (
              <tr key={o.id} style={{ borderTop: '1px solid var(--steel-800)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--ice)' }}>{o.bank_name}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-200)' }}>
                  {o.assets ? [o.assets.make, o.assets.model].filter(Boolean).join(' ') || o.assets.file_number : '—'}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-400)' }}>{o.invoice_sent_date || '—'}</td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--steel-200)' }}>${o.daily_rate}</td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--steel-200)' }}>${o.total_owed}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-[10px] uppercase px-2 py-1 rounded-sm" style={{ background: 'var(--navy-panel-2)', color: 'var(--brass)' }}>
                    {o.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/bank-outreach/${o.id}/report`} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--brass)' }}>
                    <FileOutput size={13} /> Report
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
