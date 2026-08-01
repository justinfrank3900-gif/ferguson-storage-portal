import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: inStorage },
    { count: pickedUpThisMonth },
    { data: outreach },
    { data: liens },
  ] = await Promise.all([
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'in_storage'),
    supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .gte('pickup_date', new Date(new Date().setDate(1)).toISOString().slice(0, 10)),
    supabase.from('bank_outreach').select('total_owed, payment_status'),
    supabase.from('liens').select('status, expiry_date'),
  ])

  const totalReceivable =
    outreach?.filter((o) => o.payment_status !== 'paid').reduce((sum, o) => sum + (o.total_owed || 0), 0) ?? 0

  const liensNeedingAttention =
    liens?.filter((l) => {
      if (l.status === 'pending') return true
      if (!l.expiry_date) return false
      const days = Math.round((new Date(l.expiry_date).getTime() - Date.now()) / 86400000)
      return days <= 30
    }).length ?? 0

  const cards = [
    { label: 'Units In Storage', value: inStorage ?? 0 },
    { label: 'Picked Up This Month', value: pickedUpThisMonth ?? 0 },
    { label: 'Receivables Outstanding', value: `$${totalReceivable.toLocaleString()}` },
    { label: 'Liens Needing Attention', value: liensNeedingAttention, alert: liensNeedingAttention > 0 },
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl" style={{ color: 'var(--ice)' }}>
          Dashboard
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--steel-400)' }}>
          Live overview of assets, storage, and receivables.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-sm p-5"
            style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}
          >
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--steel-400)' }}>
              {c.label}
            </p>
            <p className="font-display text-3xl" style={{ color: c.alert ? 'var(--danger)' : 'var(--ice)' }}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div
        className="mt-8 rounded-sm p-6"
        style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}
      >
        <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--brass)' }}>
          Quick Actions
        </h3>
        <div className="flex gap-3 flex-wrap mt-3">
          <a
            href="/assets/new"
            className="px-4 py-2 rounded-sm text-sm font-mono uppercase tracking-wider"
            style={{ background: 'var(--brass)', color: 'var(--navy-deep)' }}
          >
            New Pickup
          </a>
          <a
            href="/bank-outreach"
            className="px-4 py-2 rounded-sm text-sm font-mono uppercase tracking-wider"
            style={{ border: '1px solid var(--steel-600)', color: 'var(--steel-200)' }}
          >
            Bank Outreach
          </a>
        </div>
      </div>
    </div>
  )
}
