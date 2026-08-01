import { createClient } from '@/lib/supabase/server'

export default async function AuctionNetworkPage() {
  const supabase = await createClient()
  const { data: auctions } = await supabase.from('auction_network').select('*').order('name')

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl" style={{ color: 'var(--ice)' }}>
          Auction Network
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--steel-400)' }}>
          Saved auction houses with distance and delivery fee per lot.
        </p>
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--steel-800)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--navy-panel-2)' }}>
              {['Auction House', 'Address', 'Distance', 'Delivery Fee', 'Notes'].map((h) => (
                <th key={h} className="text-left font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-3" style={{ color: 'var(--steel-400)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {auctions?.map((a) => (
              <tr key={a.id} style={{ borderTop: '1px solid var(--steel-800)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--ice)' }}>{a.name}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-200)' }}>{a.address || '—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-400)' }}>{a.distance_km ? `${a.distance_km} km` : '—'}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--steel-200)' }}>{a.delivery_fee ? `$${a.delivery_fee}` : '—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--steel-400)' }}>{a.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
