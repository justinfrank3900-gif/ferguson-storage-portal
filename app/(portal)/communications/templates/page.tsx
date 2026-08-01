'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

type Template = {
  id: string
  category: string
  channel: string
  name: string
  subject: string | null
  body: string
}

export default function TemplatesPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ category: 'Bank Outreach', channel: 'sms', name: '', subject: '', body: '' })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from('comm_templates').select('*').order('category')
    setTemplates((data as Template[]) || [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('comm_templates').insert(form)
    setForm({ category: 'Bank Outreach', channel: 'sms', name: '', subject: '', body: '' })
    setShowAdd(false)
    load()
  }

  const categories = Array.from(new Set(templates.map((t) => t.category)))

  return (
    <div className="p-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: 'var(--steel-400)' }}>
          Reusable messages for bank outreach, trustee coordination, and follow-up.
        </p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider"
          style={{ background: 'var(--brass)', color: 'var(--navy-deep)' }}
        >
          <Plus size={13} /> New Template
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-sm p-5 mb-6 space-y-3" style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}>
          <div className="grid grid-cols-3 gap-3">
            <input required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
            <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="px-3 py-2 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="call_script">Call Script</option>
            </select>
            <input required placeholder="Template Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
          </div>
          {form.channel === 'email' && (
            <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
          )}
          <textarea
            required
            placeholder="Body — use {{contact_name}}, {{sender_name}}, {{company_name}}"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-sm"
            style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
          />
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider" style={{ background: 'var(--brass)', color: 'var(--navy-deep)' }}>Save</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider" style={{ border: '1px solid var(--steel-600)', color: 'var(--steel-200)' }}>Cancel</button>
          </div>
        </form>
      )}

      {categories.map((cat) => (
        <div key={cat} className="mb-6">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--brass)' }}>{cat}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates
              .filter((t) => t.category === cat)
              .map((t) => (
                <div key={t.id} className="rounded-sm p-4" style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold" style={{ color: 'var(--ice)' }}>{t.name}</span>
                    <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm" style={{ background: 'var(--navy-panel-2)', color: 'var(--steel-400)' }}>{t.channel}</span>
                  </div>
                  {t.subject && <p className="text-xs mb-1" style={{ color: 'var(--steel-400)' }}>Subject: {t.subject}</p>}
                  <p className="text-xs whitespace-pre-wrap" style={{ color: 'var(--steel-200)' }}>{t.body}</p>
                </div>
              ))}
          </div>
        </div>
      ))}

      {templates.length === 0 && (
        <p className="text-sm text-center mt-10" style={{ color: 'var(--steel-400)' }}>No templates yet — add one to get started.</p>
      )}
    </div>
  )
}
