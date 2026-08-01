import { createClient } from '@/lib/supabase/server'
import PrintButton from './PrintButton'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: outreach } = await supabase
    .from('bank_outreach')
    .select('*, assets(*, trustees(name, firm), asset_photos(url))')
    .eq('id', id)
    .single()

  if (!outreach) return <div style={{ color: 'var(--ice)' }}>Not found.</div>

  const asset = outreach.assets

  const { data: lien } = await supabase.from('liens').select('*').eq('asset_id', asset?.id).maybeSingle()

  return (
    <div>
      <div className="mb-6 print:hidden">
        <PrintButton />
      </div>

      <div
        id="report"
        className="max-w-3xl mx-auto p-10 rounded-sm"
        style={{ background: '#f7f5f0', color: '#1a1a1a' }}
      >
        <div className="flex items-center justify-between border-b pb-6 mb-6" style={{ borderColor: '#c7bfa8' }}>
          <div>
            <h1 className="font-display text-2xl" style={{ color: '#0e1c30' }}>Ferguson Storage</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: '#8a7649' }}>
              Secured Asset Recovery &amp; Storage
            </p>
          </div>
          <div className="text-right text-xs" style={{ color: '#555' }}>
            <p>Notice of Secured Asset</p>
            <p>File Ref: {asset?.file_number || '—'}</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <p className="text-sm mb-6">
          Attn: {outreach.bank_name}{outreach.contact_name ? `, ${outreach.contact_name}` : ''} — this notice confirms Ferguson
          Storage has taken possession of the asset described below, secured under proper trustee authorization.
        </p>

        <Section title="Asset">
          <Row label="Description" value={[asset?.year, asset?.make, asset?.model].filter(Boolean).join(' ') || asset?.asset_type} />
          <Row label="VIN / Serial" value={asset?.vin} />
          <Row label="Condition" value={asset?.condition_notes} />
          <Row label="Pickup Date" value={asset?.pickup_date} />
          <Row label="Current Location" value={asset?.lot_location || 'Ferguson Storage secured lot'} />
        </Section>

        <Section title="Chain of Custody">
          <Row label="Trustee" value={asset?.trustees?.name} />
          <Row label="Firm" value={asset?.trustees?.firm} />
          <Row label="Authorization" value="On file — trustee proposal authorization" />
          <Row label="Lien Registration" value={lien?.registration_number || 'Filing in progress'} />
        </Section>

        <Section title="Storage & Billing">
          <Row label="Daily Storage Rate" value={`$${outreach.daily_rate}/day`} />
          <Row label="Total Owed To Date" value={`$${outreach.total_owed}`} />
          <Row label="Delivery To Auction" value="Available — delivery fee quoted on request" />
        </Section>

        {asset?.asset_photos?.length > 0 && (
          <Section title="Photos">
            <div className="grid grid-cols-3 gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {asset.asset_photos.map((p: any) => (
                <img key={p.url} src={p.url} alt="Asset" className="w-full h-24 object-cover rounded-sm" />
              ))}
            </div>
          </Section>
        )}

        <p className="text-xs mt-8 pt-6 border-t" style={{ borderColor: '#c7bfa8', color: '#555' }}>
          Ferguson Storage regularly secures assets ahead of formal notification through our trustee network. We&apos;re glad
          to be your point of contact for anything found in our region. Please remit payment or contact us to arrange
          pickup/delivery.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: '#8a7649' }}>
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex text-sm">
      <span className="w-40 shrink-0" style={{ color: '#666' }}>{label}</span>
      <span>{value || '—'}</span>
    </div>
  )
}
