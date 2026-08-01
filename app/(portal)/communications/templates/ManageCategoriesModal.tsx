'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, GripVertical, Pencil, Trash2, Check, X } from 'lucide-react'

type Category = { id: string; name: string; sort_order: number }

export default function ManageCategoriesModal({
  categories,
  onChange,
  onClose,
}: {
  categories: Category[]
  onChange: (cats: Category[]) => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function addCategory() {
    if (!newName.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('comm_template_categories')
      .insert({ name: newName.trim(), sort_order: categories.length })
      .select()
      .single()
    setSaving(false)
    if (data) {
      onChange([...categories, data as Category])
      setNewName('')
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id)
    setEditName(c.name)
  }

  async function saveEdit(id: string) {
    const oldCat = categories.find((c) => c.id === id)
    await supabase.from('comm_template_categories').update({ name: editName.trim() }).eq('id', id)
    if (oldCat && oldCat.name !== editName.trim()) {
      await supabase.from('comm_templates').update({ category: editName.trim() }).eq('category', oldCat.name)
    }
    onChange(categories.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c)))
    setEditingId(null)
  }

  async function removeCategory(c: Category) {
    if (!confirm(`Delete category "${c.name}"? Templates in it will need a new category assigned.`)) return
    await supabase.from('comm_template_categories').delete().eq('id', c.id)
    onChange(categories.filter((x) => x.id !== c.id))
  }

  function reorder(fromIdx: number, toIdx: number) {
    const next = [...categories]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    const withOrder = next.map((c, i) => ({ ...c, sort_order: i }))
    onChange(withOrder)
    Promise.all(withOrder.map((c) => supabase.from('comm_template_categories').update({ sort_order: c.sort_order }).eq('id', c.id)))
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[380px] h-full overflow-y-auto p-5"
        style={{ background: 'var(--navy-panel)', borderLeft: '1px solid var(--steel-800)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="font-display text-base" style={{ color: 'var(--ice)' }}>Manage Categories</div>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--steel-400)' }} /></button>
        </div>

        <div className="flex gap-1.5 mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            placeholder="New category name"
            className="flex-1 px-3 py-2 text-sm rounded-sm"
            style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
          />
          <button
            onClick={addCategory}
            disabled={saving || !newName.trim()}
            className="px-3.5 rounded-sm"
            style={{ background: 'var(--brass)', color: 'var(--navy-deep)' }}
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {categories.map((c, idx) => (
            <div
              key={c.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== idx) reorder(dragIdx, idx)
                setDragIdx(null)
              }}
              className="flex items-center gap-2 rounded-sm px-2.5 py-2"
              style={{ background: dragIdx === idx ? 'var(--navy-panel-2)' : 'var(--navy-deep)', border: '1px solid var(--steel-800)' }}
            >
              <span style={{ color: 'var(--steel-600)', cursor: 'grab' }}><GripVertical size={14} /></span>
              {editingId === c.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)}
                    className="flex-1 px-2 py-1.5 text-xs rounded-sm"
                    style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
                  />
                  <button onClick={() => saveEdit(c.id)}><Check size={14} style={{ color: 'var(--brass)' }} /></button>
                  <button onClick={() => setEditingId(null)}><X size={14} style={{ color: 'var(--steel-400)' }} /></button>
                </>
              ) : (
                <>
                  <div className="flex-1 text-xs font-semibold" style={{ color: 'var(--ice)' }}>{c.name}</div>
                  <button onClick={() => startEdit(c)}><Pencil size={13} style={{ color: 'var(--steel-400)' }} /></button>
                  <button onClick={() => removeCategory(c)}><Trash2 size={13} style={{ color: 'var(--steel-400)' }} /></button>
                </>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <div className="text-xs text-center py-5" style={{ color: 'var(--steel-400)' }}>No categories yet — add one above.</div>
          )}
        </div>
      </div>
    </div>
  )
}
