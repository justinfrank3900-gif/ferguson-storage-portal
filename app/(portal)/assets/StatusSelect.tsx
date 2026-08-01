'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STATUSES = [
  { value: 'in_transit', label: 'In Transit' },
  { value: 'in_storage', label: 'In Storage' },
  { value: 'released', label: 'Released' },
  { value: 'at_auction', label: 'At Auction' },
]

export default function StatusSelect({ assetId, status }: { assetId: string; status: string }) {
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('assets').update({ status: e.target.value }).eq('id', assetId)
    setSaving(false)
    router.refresh()
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      className="font-mono text-[10px] uppercase px-2 py-1 rounded-sm"
      style={{ background: 'var(--navy-panel-2)', color: 'var(--brass)', border: '1px solid var(--steel-800)' }}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  )
}
