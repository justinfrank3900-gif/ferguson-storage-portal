'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ManageCategoriesModal from './ManageCategoriesModal'
import {
  Plus, Trash2, Pencil, MessageSquare, Mail, Phone, Paperclip,
  Image as ImageIcon, Video, Mic, X, Upload, Settings, Sparkles,
} from 'lucide-react'

type Template = {
  id: string
  category: string
  channel: 'sms' | 'email' | 'call_script'
  name: string
  subject: string | null
  body: string
  sort_order: number
  media_url: string | null
  media_type: string | null
  media_filename: string | null
}
type Category = { id: string; name: string; sort_order: number }

const CHANNEL_ICON = { sms: MessageSquare, email: Mail, call_script: Phone }
const CHANNEL_LABEL = { sms: 'Text', email: 'Email', call_script: 'Call Script' }

const MAX_MEDIA_BYTES = 5 * 1024 * 1024
const ACCEPTED_MEDIA_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/bmp',
  'video/mp4', 'video/3gpp',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg',
]
function mediaKind(type: string | null): 'image' | 'video' | 'audio' | null {
  if (!type) return null
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  return null
}
const MEDIA_ICON = { image: ImageIcon, video: Video, audio: Mic }

const STARTER_CATEGORIES = ['Bank Outreach', 'Trustee Coordination', 'Payment Follow-Up', 'Auction & Delivery']
const STARTER_TEMPLATES: Omit<Template, 'id' | 'sort_order' | 'media_url' | 'media_type' | 'media_filename'>[] = [
  { category: 'Bank Outreach', channel: 'sms', name: 'Asset Secured — Initial Contact', subject: null, body: "Hi {{contact_name}}, this is {{sender_name}} with {{company_name}}. We've secured one of your assets and sent a full report to your email. Please reach out to arrange payment or delivery." },
  { category: 'Bank Outreach', channel: 'email', name: 'Asset Secured Notification', subject: 'Notice of Secured Asset — {{company_name}}', body: 'Hi {{contact_name}},\n\n{{company_name}} has taken possession of an asset tied to your institution. A full secured-asset report with photos and chain of custody is attached.\n\nPlease contact us to arrange payment or delivery to the nearest auction.\n\n{{sender_name}}\n{{company_name}}' },
  { category: 'Bank Outreach', channel: 'call_script', name: 'First Call — Introduce Ferguson Storage', subject: null, body: "Hi, this is {{sender_name}} calling from {{company_name}}. We've secured a vehicle tied to one of your files through our trustee network. I'm calling to confirm the right contact for recovery/collections so I can send over the file details and next steps." },
  { category: 'Trustee Coordination', channel: 'sms', name: 'Pickup Confirmation', subject: null, body: "Hi {{contact_name}}, confirming pickup is scheduled for the unit on your file. We'll send photos and confirmation once it's secured in storage." },
  { category: 'Trustee Coordination', channel: 'email', name: 'Authorization Received — Confirming Pickup', subject: 'Confirming Pickup — {{company_name}}', body: "Hi {{contact_name}},\n\nThanks for the authorization. We'll coordinate pickup and send confirmation with photos once the asset is secured in our storage facility.\n\n{{sender_name}}\n{{company_name}}" },
  { category: 'Payment Follow-Up', channel: 'sms', name: 'Invoice Follow-Up — 7 Days', subject: null, body: 'Hi {{contact_name}}, following up on the storage invoice sent last week for the secured asset on file. Let us know if you need anything to process payment.' },
  { category: 'Payment Follow-Up', channel: 'email', name: 'Payment Reminder', subject: 'Payment Reminder — {{company_name}}', body: 'Hi {{contact_name}},\n\nThis is a follow-up on the outstanding storage invoice. Daily storage charges continue to accrue until payment or pickup arrangements are made.\n\nLet us know how you\'d like to proceed.\n\n{{sender_name}}\n{{company_name}}' },
  { category: 'Auction & Delivery', channel: 'sms', name: 'Offer Delivery to Auction', subject: null, body: "Hi {{contact_name}}, happy to arrange delivery of the secured unit directly to your preferred auction house. Just confirm the location and we'll quote the delivery fee." },
  { category: 'Auction & Delivery', channel: 'email', name: 'Delivery to Auction — Quote', subject: 'Delivery Quote — {{company_name}}', body: "Hi {{contact_name}},\n\nWe can deliver the secured unit directly to your preferred auction house. Let us know the location and we'll confirm the delivery fee and timeline.\n\n{{sender_name}}\n{{company_name}}" },
]

export default function TemplatesPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStarter, setLoadingStarter] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showManageCategories, setShowManageCategories] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fCategory, setFCategory] = useState('')
  const [fChannel, setFChannel] = useState<Template['channel']>('sms')
  const [fName, setFName] = useState('')
  const [fSubject, setFSubject] = useState('')
  const [fBody, setFBody] = useState('')
  const [fMediaUrl, setFMediaUrl] = useState('')
  const [fMediaType, setFMediaType] = useState('')
  const [fMediaFilename, setFMediaFilename] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data: cats } = await supabase.from('comm_template_categories').select('*').order('sort_order')
    setCategories((cats as Category[]) || [])
    const { data } = await supabase.from('comm_templates').select('*').order('sort_order')
    setTemplates((data as Template[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function loadStarterTemplates() {
    if (!confirm(`This adds ${STARTER_TEMPLATES.length} starter templates across ${STARTER_CATEGORIES.length} categories. Continue?`)) return
    setLoadingStarter(true)

    const existingCatNames = new Set(categories.map((c) => c.name))
    const catsToAdd = STARTER_CATEGORIES.filter((c) => !existingCatNames.has(c))
    if (catsToAdd.length > 0) {
      await supabase.from('comm_template_categories').insert(catsToAdd.map((name, i) => ({ name, sort_order: categories.length + i })))
    }

    const tplRows = STARTER_TEMPLATES.map((t, i) => ({ ...t, sort_order: templates.length + i }))
    await supabase.from('comm_templates').insert(tplRows)

    setLoadingStarter(false)
    load()
  }

  function startAdd() {
    setEditingId(null)
    setFCategory(categories[0]?.name || '')
    setFChannel('sms')
    setFName('')
    setFSubject('')
    setFBody('')
    setFMediaUrl('')
    setFMediaType('')
    setFMediaFilename('')
    setUploadError('')
    setShowAdd(true)
  }
  function startEdit(t: Template) {
    setEditingId(t.id)
    setFCategory(t.category)
    setFChannel(t.channel)
    setFName(t.name)
    setFSubject(t.subject || '')
    setFBody(t.body)
    setFMediaUrl(t.media_url || '')
    setFMediaType(t.media_type || '')
    setFMediaFilename(t.media_filename || '')
    setUploadError('')
    setShowAdd(true)
  }

  async function uploadMedia(file: File) {
    setUploadError('')
    if (!ACCEPTED_MEDIA_TYPES.includes(file.type)) {
      setUploadError(`Unsupported format (${file.type || 'unknown'}). Use JPEG/PNG/GIF/BMP images, MP4 video, or MP3/WAV/OGG audio.`)
      return
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setUploadError(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is 5MB for MMS delivery.`)
      return
    }
    setUploading(true)
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('comm-media').upload(path, file)
    if (error) {
      setUploadError(`Upload failed: ${error.message}`)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('comm-media').getPublicUrl(path)
    setFMediaUrl(data.publicUrl)
    setFMediaType(file.type)
    setFMediaFilename(file.name)
    setUploading(false)
  }

  async function saveTemplate() {
    if (!fCategory.trim() || !fName.trim() || !fBody.trim()) return
    setSaving(true)
    const mediaFields = { media_url: fMediaUrl || null, media_type: fMediaType || null, media_filename: fMediaFilename || null }
    if (editingId) {
      await supabase.from('comm_templates').update({
        category: fCategory.trim(), channel: fChannel, name: fName.trim(),
        subject: fChannel === 'email' ? fSubject.trim() || null : null, body: fBody.trim(), ...mediaFields,
      }).eq('id', editingId)
    } else {
      await supabase.from('comm_templates').insert({
        category: fCategory.trim(), channel: fChannel, name: fName.trim(),
        subject: fChannel === 'email' ? fSubject.trim() || null : null, body: fBody.trim(), sort_order: templates.length, ...mediaFields,
      })
    }
    setSaving(false)
    setShowAdd(false)
    setEditingId(null)
    load()
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return
    await supabase.from('comm_templates').delete().eq('id', id)
    load()
  }

  const orderedCategoryNames = categories.map((c) => c.name)
  const strayCategories = Array.from(new Set(templates.map((t) => t.category))).filter((c) => !orderedCategoryNames.includes(c))
  const allCategoryNames = [...orderedCategoryNames, ...strayCategories]

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs" style={{ color: 'var(--steel-400)' }}>
          {templates.length} template{templates.length !== 1 ? 's' : ''} across {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadStarterTemplates}
            disabled={loadingStarter}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm text-xs font-mono uppercase tracking-wider"
            style={{ border: '1px solid var(--steel-600)', color: 'var(--steel-200)' }}
          >
            <Sparkles size={13} /> {loadingStarter ? 'Loading…' : 'Load Starter Templates'}
          </button>
          <button
            onClick={() => setShowManageCategories(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm text-xs font-mono uppercase tracking-wider"
            style={{ border: '1px solid var(--steel-600)', color: 'var(--steel-200)' }}
          >
            <Settings size={13} /> Manage Categories
          </button>
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm text-xs font-mono uppercase tracking-wider"
            style={{ background: 'var(--brass)', color: 'var(--navy-deep)' }}
          >
            <Plus size={14} /> Add Template
          </button>
        </div>
      </div>

      {showManageCategories && (
        <ManageCategoriesModal categories={categories} onChange={setCategories} onClose={() => setShowManageCategories(false)} />
      )}

      {showAdd && (
        <div className="rounded-sm p-5 mb-5" style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}>
          <div className="text-xs font-bold mb-2.5" style={{ color: 'var(--brass)' }}>{editingId ? 'Edit Template' : 'New Template'}</div>
          <div className="flex gap-2.5 mb-2">
            <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}>
              {categories.length === 0 && <option value="">No categories yet — add one first</option>}
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select value={fChannel} onChange={(e) => setFChannel(e.target.value as Template['channel'])} className="flex-1 px-3 py-2 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}>
              <option value="sms">Text (SMS)</option>
              <option value="email">Email</option>
              <option value="call_script">Call Script</option>
            </select>
          </div>
          <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Template name" className="w-full mb-2 px-3 py-2 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
          {fChannel === 'email' && (
            <input value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="Email subject" className="w-full mb-2 px-3 py-2 text-sm rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
          )}
          <textarea
            value={fBody}
            onChange={(e) => setFBody(e.target.value)}
            placeholder="Message body — use {{contact_name}}, {{sender_name}}, {{company_name}} as placeholders"
            rows={5}
            className="w-full px-3 py-2 text-sm rounded-sm resize-y"
            style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
          />

          {fChannel === 'sms' && (
            <div className="mt-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--steel-400)' }}>Attachment (optional — sends as MMS)</div>
              {fMediaUrl ? (
                <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)' }}>
                  {mediaKind(fMediaType) === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fMediaUrl} alt="" className="w-10 h-10 object-cover rounded-sm shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0" style={{ background: 'var(--navy-panel-2)' }}>
                      {(() => { const K = MEDIA_ICON[mediaKind(fMediaType) || 'image']; return <K size={16} style={{ color: 'var(--brass)' }} /> })()}
                    </div>
                  )}
                  <div className="flex-1 text-xs truncate" style={{ color: 'var(--ice)' }}>{fMediaFilename}</div>
                  <button onClick={() => { setFMediaUrl(''); setFMediaType(''); setFMediaFilename('') }}><X size={14} style={{ color: 'var(--steel-400)' }} /></button>
                </div>
              ) : (
                <label
                  className="flex items-center justify-center gap-1.5 p-3 rounded-sm text-xs font-semibold"
                  style={{ border: '1px dashed var(--steel-600)', color: 'var(--steel-400)', cursor: uploading ? 'default' : 'pointer' }}
                >
                  <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload image, video, or voice clip'}
                  <input type="file" accept={ACCEPTED_MEDIA_TYPES.join(',')} disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0])} className="hidden" />
                </label>
              )}
              {uploadError && <div className="text-[10.5px] mt-1" style={{ color: 'var(--danger)' }}>{uploadError}</div>}
              <div className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--steel-400)' }}>
                Max 5MB. Images: JPEG, PNG, GIF, BMP. Video: MP4 (keep clips short). Audio: MP3, WAV, OGG.
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button onClick={saveTemplate} disabled={saving || !fCategory} className="px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider" style={{ background: 'var(--brass)', color: 'var(--navy-deep)' }}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Template'}
            </button>
            <button onClick={() => { setShowAdd(false); setEditingId(null) }} className="px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider" style={{ border: '1px solid var(--steel-600)', color: 'var(--steel-200)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: 'var(--steel-400)' }}>Loading…</div>
      ) : templates.length === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: 'var(--steel-400)' }}>
          No templates yet. Click &ldquo;Load Starter Templates&rdquo; above, or add your own.
        </div>
      ) : (
        allCategoryNames.map((cat) => {
          const catTemplates = templates.filter((t) => t.category === cat)
          if (catTemplates.length === 0) return null
          return (
            <div key={cat} className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: 'var(--brass)' }}>{cat}</div>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {catTemplates.map((t) => {
                  const Icon = CHANNEL_ICON[t.channel]
                  return (
                    <div key={t.id} className="rounded-sm p-3.5" style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: 'var(--steel-400)' }}>
                          <Icon size={11} /> {CHANNEL_LABEL[t.channel]}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(t)}><Pencil size={12} style={{ color: 'var(--steel-400)' }} /></button>
                          <button onClick={() => deleteTemplate(t.id)}><Trash2 size={12} style={{ color: 'var(--steel-400)' }} /></button>
                        </div>
                      </div>
                      <div className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: 'var(--ice)' }}>
                        {t.name}
                        {t.media_url && <Paperclip size={11} style={{ color: 'var(--brass)' }} />}
                      </div>
                      {t.subject && <div className="text-[11px] mb-1" style={{ color: 'var(--brass)' }}>{t.subject}</div>}
                      <div className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--steel-400)' }}>{t.body}</div>
                      {t.media_url && mediaKind(t.media_type) === 'image' && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.media_url} alt="" className="w-full h-[90px] object-cover rounded-sm mt-2" />
                      )}
                      {t.media_url && mediaKind(t.media_type) !== 'image' && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10.5px]" style={{ color: 'var(--steel-400)' }}>
                          {(() => { const K = MEDIA_ICON[mediaKind(t.media_type) || 'image']; return <K size={11} /> })()} {t.media_filename}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
