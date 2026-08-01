'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, ChevronDown, ChevronLeft, ChevronRight, Paperclip } from 'lucide-react'

export type Template = {
  id: string
  category: string
  channel: 'sms' | 'email' | 'call_script'
  name: string
  subject: string | null
  body: string
  media_url?: string | null
}

export default function TemplatePicker({
  templates,
  label,
  onSelect,
}: {
  templates: Template[]
  label: string
  onSelect: (t: Template) => void
}) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && ref.current.contains(e.target as Node)) return
      setOpen(false)
      setCategory(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  useEffect(() => {
    setCategory(null)
  }, [templates])

  const categories = Array.from(new Set(templates.map((t) => t.category)))

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[10.5px] font-semibold font-mono uppercase tracking-wider"
        style={{ background: 'var(--navy-panel-2)', color: 'var(--brass)', border: '1px solid var(--steel-800)' }}
      >
        <FileText size={11} /> {label} <ChevronDown size={10} />
      </button>
      {open && (
        <div
          ref={ref}
          className="absolute bottom-full left-0 mb-1.5 w-[300px] max-h-80 overflow-y-auto rounded-sm z-30"
          style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
        >
          {templates.length === 0 ? (
            <div className="p-4 text-xs text-center" style={{ color: 'var(--steel-400)' }}>
              No templates for this channel yet.
            </div>
          ) : category === null ? (
            categories.map((cat) => {
              const count = templates.filter((t) => t.category === cat).length
              return (
                <div
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="flex justify-between items-center px-3 py-2.5 cursor-pointer"
                  style={{ borderBottom: '1px solid var(--steel-800)' }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--ice)' }}>{cat}</span>
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--steel-400)' }}>
                    <span className="text-[10px]">{count}</span>
                    <ChevronRight size={12} />
                  </span>
                </div>
              )
            })
          ) : (
            <div>
              <div
                onClick={() => setCategory(null)}
                className="flex items-center gap-1.5 px-3 py-2 cursor-pointer text-[10.5px] font-semibold sticky top-0"
                style={{ color: 'var(--steel-400)', borderBottom: '1px solid var(--steel-800)', background: 'var(--navy-panel)' }}
              >
                <ChevronLeft size={11} /> {category}
              </div>
              {templates
                .filter((t) => t.category === category)
                .map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelect(t)
                      setOpen(false)
                      setCategory(null)
                    }}
                    className="px-3 py-2.5 cursor-pointer"
                    style={{ borderBottom: '1px solid var(--steel-800)' }}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--ice)' }}>
                      {t.name}
                      {t.media_url && <Paperclip size={10} style={{ color: 'var(--brass)' }} />}
                    </div>
                    <div className="text-[10.5px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--steel-400)' }}>
                      {t.body}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
