'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2 } from 'lucide-react'

export default function NewAssetPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [form, setForm] = useState({
    asset_type: 'vehicle',
    make: '',
    model: '',
    year: '',
    vin: '',
    file_number: '',
    pickup_address: '',
    condition_notes: '',
  })

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setPhotos((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        ...form,
        status: 'in_transit',
        pickup_date: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single()

    if (error || !asset) {
      alert('Could not save asset: ' + error?.message)
      setSaving(false)
      return
    }

    for (const photo of photos) {
      const path = `${asset.id}/${Date.now()}-${photo.name}`
      const { error: uploadError } = await supabase.storage.from('asset-media').upload(path, photo)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('asset-media').getPublicUrl(path)
        await supabase.from('asset_photos').insert({ asset_id: asset.id, url: urlData.publicUrl })
      }
    }

    // Every new pickup automatically needs a lien filed — flag it right away so nothing gets missed
    await supabase.from('liens').insert({ asset_id: asset.id, status: 'pending' })

    // Start the storage clock the same day
    await supabase.from('storage_ledger').insert({ asset_id: asset.id, storage_start: new Date().toISOString().slice(0, 10) })

    router.push('/assets')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl" style={{ color: 'var(--ice)' }}>
          New Pickup
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--steel-400)' }}>
          Log the asset in the field — VIN, photos, and pickup details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo capture */}
        <div className="rounded-sm p-5" style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}>
          <label className="font-mono text-[10px] tracking-[0.15em] uppercase mb-3 block" style={{ color: 'var(--brass)' }}>
            Photos
          </label>
          <label
            className="flex items-center justify-center gap-2 py-8 rounded-sm cursor-pointer"
            style={{ border: '1px dashed var(--steel-600)', color: 'var(--steel-400)' }}
          >
            <Camera size={18} />
            <span className="text-sm">Tap to capture — front, back, sides, damage, odometer</span>
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoCapture} />
          </label>
          {photos.length > 0 && (
            <p className="text-xs mt-3" style={{ color: 'var(--steel-400)' }}>
              {photos.length} photo{photos.length > 1 ? 's' : ''} attached
            </p>
          )}
        </div>

        {/* Asset details */}
        <div className="rounded-sm p-5 space-y-4" style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}>
          <div>
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase mb-2 block" style={{ color: 'var(--steel-400)' }}>
              Asset Type
            </label>
            <select
              value={form.asset_type}
              onChange={(e) => update('asset_type', e.target.value)}
              className="w-full px-3 py-3 text-sm rounded-sm"
              style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
            >
              <option value="vehicle">Vehicle</option>
              <option value="boat">Boat</option>
              <option value="trailer">Trailer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Year" value={form.year} onChange={(v) => update('year', v)} />
            <Field label="Make" value={form.make} onChange={(v) => update('make', v)} />
            <Field label="Model" value={form.model} onChange={(v) => update('model', v)} />
          </div>

          <Field label="VIN / Serial (scan or type)" value={form.vin} onChange={(v) => update('vin', v)} mono />
          <Field label="Trustee File #" value={form.file_number} onChange={(v) => update('file_number', v)} mono />
          <Field label="Pickup Address" value={form.pickup_address} onChange={(v) => update('pickup_address', v)} />

          <div>
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase mb-2 block" style={{ color: 'var(--steel-400)' }}>
              Condition Notes
            </label>
            <textarea
              value={form.condition_notes}
              onChange={(e) => update('condition_notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-3 text-sm rounded-sm"
              style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-sm font-mono text-[11px] tracking-[0.18em] uppercase flex items-center justify-center gap-2"
          style={{ background: 'var(--ice)', color: 'var(--navy-panel)', opacity: saving ? 0.6 : 1 }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving…' : 'Save Pickup'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  mono,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  mono?: boolean
}) {
  return (
    <div>
      <label className="font-mono text-[10px] tracking-[0.15em] uppercase mb-2 block" style={{ color: 'var(--steel-400)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-3 text-sm rounded-sm ${mono ? 'font-mono' : ''}`}
        style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
      />
    </div>
  )
}
