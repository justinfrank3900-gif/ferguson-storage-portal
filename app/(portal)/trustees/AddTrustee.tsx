'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

export default function AddTrustee() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', firm: '', contact_email: '', contact_phone: '' })
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('trustees').insert(form)
    setForm({ name: '', firm: '', contact_email: '', contact_phone: '' })
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-mono uppercase tracking-wider"
        style={{ background: 'var(--brass)', color: 'var(--navy-deep)' }}
      >
        <Plus size={14} /> Add Trustee
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
      style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}
    >
      <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2.5 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
      <input placeholder="Firm" value={form.firm} onChange={(e) => setForm({ ...form, firm: e.target.value })} className="px-3 py-2.5 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
      <input placeholder="Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="px-3 py-2.5 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
      <input placeholder="Phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="px-3 py-2.5 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
      <div className="sm:col-span-2 flex gap-3">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-sm text-sm font-mono uppercase tracking-wider" style={{ background: 'var(--brass)', color: 'var(--navy-deep)' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-sm text-sm font-mono uppercase tracking-wider" style={{ border: '1px solid var(--steel-600)', color: 'var(--steel-200)' }}>
          Cancel
        </button>
      </div>
    </form>
  )
}
