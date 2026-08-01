'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Phone } from 'lucide-react'

type PhoneNumber = { id: string; phone_number: string; label: string | null; status: string }

export default function NumbersPage() {
  const supabase = createClient()
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ phone_number: '', label: '' })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from('comm_phone_numbers').select('*').order('created_at', { ascending: false })
    setNumbers((data as PhoneNumber[]) || [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('comm_phone_numbers').insert({ ...form, status: 'active' })
    setForm({ phone_number: '', label: '' })
    setShowAdd(false)
    load()
  }

  return (
    <div className="p-8 overflow-y-auto h-full">
      <p className="text-sm mb-2" style={{ color: 'var(--steel-400)' }}>
        Twilio numbers used to send and receive SMS. Add a number here, then set your
        <code className="mx-1 px-1.5 py-0.5 rounded-sm text-xs" style={{ background: 'var(--navy-panel-2)', color: 'var(--brass)' }}>TWILIO_ACCOUNT_SID</code>
        and
        <code className="mx-1 px-1.5 py-0.5 rounded-sm text-xs" style={{ background: 'var(--navy-panel-2)', color: 'var(--brass)' }}>TWILIO_AUTH_TOKEN</code>
        in Vercel to go live.
      </p>

      <button
        onClick={() => setShowAdd((v) => !v)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider mb-5"
        style={{ background: 'var(--ice)', color: 'var(--navy-panel)' }}
      >
        <Plus size={13} /> Add Number
      </button>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-sm p-5 mb-6 flex gap-3" style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}>
          <input required placeholder="+1 403 555 0100" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="flex-1 px-3 py-2 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
          <input placeholder="Label (optional)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="flex-1 px-3 py-2 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
          <button type="submit" className="px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider" style={{ background: 'var(--ice)', color: 'var(--navy-panel)' }}>Save</button>
        </form>
      )}

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--steel-800)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--navy-panel-2)' }}>
              {['Number', 'Label', 'Status'].map((h) => (
                <th key={h} className="text-left font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-3" style={{ color: 'var(--steel-400)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {numbers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--steel-400)' }}>No numbers added yet.</td>
              </tr>
            )}
            {numbers.map((n) => (
              <tr key={n.id} style={{ borderTop: '1px solid var(--steel-800)' }}>
                <td className="px-4 py-3 font-mono flex items-center gap-2" style={{ color: 'var(--ice)' }}><Phone size={13} style={{ color: 'var(--brass)' }} />{n.phone_number}</td>
                <td className="px-4 py-3" style={{ color: 'var(--steel-200)' }}>{n.label || '—'}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-[10px] uppercase px-2 py-1 rounded-sm" style={{ background: 'var(--navy-panel-2)', color: 'var(--success)' }}>{n.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
