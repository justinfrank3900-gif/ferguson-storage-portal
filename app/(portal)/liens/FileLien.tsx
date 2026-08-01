'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function FileLien({
  lien,
}: {
  lien: { id: string; registration_number: string | null; filed_date: string | null; expiry_date: string | null; status: string }
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    registration_number: lien.registration_number || '',
    filed_date: lien.filed_date || new Date().toISOString().slice(0, 10),
    expiry_date: lien.expiry_date || '',
  })
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('liens').update({ ...form, status: 'filed' }).eq('id', lien.id)
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-mono text-[10px] uppercase px-2.5 py-1 rounded-sm"
        style={{ background: 'var(--ice)', color: 'var(--navy-panel)' }}
      >
        {lien.status === 'pending' ? 'File Lien' : 'Edit'}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <input
        required
        placeholder="Registration #"
        value={form.registration_number}
        onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
        className="w-28 px-2 py-1 text-[11px] rounded-sm font-mono"
        style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
      />
      <input
        type="date"
        required
        value={form.filed_date}
        onChange={(e) => setForm({ ...form, filed_date: e.target.value })}
        className="px-2 py-1 text-[11px] rounded-sm"
        style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
      />
      <input
        type="date"
        required
        value={form.expiry_date}
        onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
        className="px-2 py-1 text-[11px] rounded-sm"
        style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
      />
      <button type="submit" disabled={saving} className="font-mono text-[10px] uppercase px-2.5 py-1 rounded-sm" style={{ background: 'var(--ice)', color: 'var(--navy-panel)' }}>
        {saving ? '…' : 'Save'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="font-mono text-[10px] uppercase px-2 py-1" style={{ color: 'var(--steel-400)' }}>
        ✕
      </button>
    </form>
  )
}
