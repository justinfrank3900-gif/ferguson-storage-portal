'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Phone, Mail, Send, Search, Paperclip, X, Plus } from 'lucide-react'
import TemplatePicker, { Template } from '@/components/TemplatePicker'
import { fillTemplateVars, senderNameFromEmail } from '@/lib/templateVars'

type Contact = {
  id: string
  name: string
  type: string
  phone: string | null
  email: string | null
}

type Message = {
  id: string
  contact_id: string
  channel: 'sms' | 'email' | 'call'
  direction: 'inbound' | 'outbound'
  subject: string | null
  body: string | null
  status: string
  error_detail: string | null
  media_url: string | null
  created_at: string
}

const CHANNEL_TO_TEMPLATE_CHANNEL: Record<Message['channel'], Template['channel']> = {
  sms: 'sms',
  call: 'call_script',
  email: 'email',
}

const CHANNELS: { key: Message['channel']; label: string; icon: typeof MessageSquare }[] = [
  { key: 'sms', label: 'Text', icon: MessageSquare },
  { key: 'call', label: 'Call', icon: Phone },
  { key: 'email', label: 'Email', icon: Mail },
]

const AVATAR_COLORS = ['#b3925a', '#8b9bb4', '#4a8b6f', '#c1543f', '#6b8fb0', '#a78bfa']
function avatarColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function initials(name: string) {
  const parts = name.trim().split(' ')
  return `${(parts[0] || '?')[0]}${(parts[1] || '')[0] || ''}`.toUpperCase()
}

export default function InboxPage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [channel, setChannel] = useState<Message['channel'] | null>(null)
  const [body, setBody] = useState('')
  const [subject, setSubject] = useState('')
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', type: 'bank', phone: '', email: '' })
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectedContact = contacts.find((c) => c.id === selectedId) || null
  const filteredContacts = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    ;(async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        setSenderName(senderNameFromEmail(userData.user.email))
        setSenderEmail(userData.user.email || '')
      }
      const { data: tpls } = await supabase.from('comm_templates').select('*').order('category')
      setTemplates((tpls as Template[]) || [])
      const { data } = await supabase.from('contacts').select('id, name, type, phone, email').order('created_at', { ascending: false })
      setContacts((data as Contact[]) || [])
    })()
  }, [])

  useEffect(() => {
    setChannel(null)
    setBody('')
    setSubject('')
    if (!selectedId) {
      setMessages([])
      return
    }
    loadMessages(selectedId)

    const threadSub = supabase
      .channel(`comm_messages_thread_${selectedId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comm_messages', filter: `contact_id=eq.${selectedId}` }, () => {
        loadMessages(selectedId)
      })
      .subscribe()
    return () => {
      supabase.removeChannel(threadSub)
    }
  }, [selectedId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  async function loadMessages(contactId: string) {
    const { data } = await supabase.from('comm_messages').select('*').eq('contact_id', contactId).order('created_at', { ascending: true })
    setMessages((data as Message[]) || [])
  }

  function applyTemplate(t: Template) {
    const fill = (s: string) => fillTemplateVars(s, { contactName: selectedContact?.name, senderName, senderEmail })
    setBody(fill(t.body))
    if (t.channel === 'email' && t.subject) setSubject(fill(t.subject))
    setMediaUrl(t.media_url || null)
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault()
    const { data } = await supabase.from('contacts').insert(newContact).select().single()
    if (data) {
      setContacts((prev) => [data as Contact, ...prev])
      setSelectedId(data.id)
    }
    setNewContact({ name: '', type: 'bank', phone: '', email: '' })
    setShowAddContact(false)
  }

  async function send() {
    if (!selectedId || !channel || !body.trim()) return
    setSending(true)

    const { data: inserted } = await supabase
      .from('comm_messages')
      .insert({
        contact_id: selectedId,
        channel,
        direction: 'outbound',
        subject: channel === 'email' ? subject : null,
        body,
        status: channel === 'call' ? 'logged' : 'queued',
        media_url: mediaUrl,
      })
      .select()
      .single()

    if (channel === 'sms' && inserted && selectedContact?.phone) {
      await fetch('/api/twilio/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: inserted.id, contactId: selectedId, to: selectedContact.phone, body, mediaUrl }),
      })
    }

    setBody('')
    setSubject('')
    setMediaUrl(null)
    setSending(false)
  }

  return (
    <div className="flex h-full">
      {/* CONTACT LIST */}
      <div className="w-72 shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--steel-800)' }}>
        <div className="p-3" style={{ borderBottom: '1px solid var(--steel-800)' }}>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-sm" style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)' }}>
            <Search size={13} style={{ color: 'var(--steel-400)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: 'var(--ice)' }}
            />
          </div>
          <button
            onClick={() => setShowAddContact((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 rounded-sm text-[10.5px] font-mono uppercase tracking-wider"
            style={{ background: 'var(--brass)', color: 'var(--navy-deep)' }}
          >
            <Plus size={12} /> Add Contact
          </button>
          {showAddContact && (
            <form onSubmit={addContact} className="mt-2 space-y-1.5">
              <input required placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="w-full px-2 py-1.5 text-xs rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
              <select value={newContact.type} onChange={(e) => setNewContact({ ...newContact, type: e.target.value })} className="w-full px-2 py-1.5 text-xs rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}>
                <option value="bank">Bank</option>
                <option value="trustee">Trustee</option>
                <option value="auction">Auction House</option>
                <option value="other">Other</option>
              </select>
              <input placeholder="Phone" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="w-full px-2 py-1.5 text-xs rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
              <input placeholder="Email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} className="w-full px-2 py-1.5 text-xs rounded-sm" style={{ background: 'var(--navy-deep)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }} />
              <button type="submit" className="w-full py-1.5 rounded-sm text-[10px] font-mono uppercase tracking-wider" style={{ border: '1px solid var(--steel-600)', color: 'var(--steel-200)' }}>Save Contact</button>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((c) => {
            const active = c.id === selectedId
            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer"
                style={{
                  background: active ? 'var(--navy-panel-2)' : 'transparent',
                  borderLeft: active ? '2px solid var(--brass)' : '2px solid transparent',
                  borderBottom: '1px solid var(--steel-800)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                  style={{ background: avatarColor(c.name), color: 'var(--navy-deep)' }}
                >
                  {initials(c.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: 'var(--ice)' }}>{c.name}</div>
                  <div className="text-[10px]" style={{ color: 'var(--steel-400)' }}>{c.phone || c.email || c.type}</div>
                </div>
              </div>
            )
          })}
          {filteredContacts.length === 0 && (
            <div className="p-5 text-center text-xs" style={{ color: 'var(--steel-400)' }}>No contacts yet.</div>
          )}
        </div>
      </div>

      {/* CONVERSATION */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--steel-400)' }}>
            Select a contact to start a conversation.
          </div>
        ) : (
          <>
            <div className="px-5 py-3.5 text-sm font-semibold" style={{ borderBottom: '1px solid var(--steel-800)', color: 'var(--ice)' }}>
              {selectedContact.name}
              <span className="text-xs font-normal ml-2.5" style={{ color: 'var(--steel-400)' }}>
                {selectedContact.phone} {selectedContact.email && `· ${selectedContact.email}`}
              </span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-2.5">
              {messages.length === 0 && (
                <div className="text-center text-xs mt-8" style={{ color: 'var(--steel-400)' }}>No messages yet. Start the conversation below.</div>
              )}
              {messages.map((m) => {
                const ChannelIcon = CHANNELS.find((c) => c.key === m.channel)?.icon || MessageSquare
                const outbound = m.direction === 'outbound'
                return (
                  <div key={m.id} className="flex" style={{ justifyContent: outbound ? 'flex-end' : 'flex-start' }}>
                    <div
                      className="max-w-[65%] px-3 py-2 rounded-sm text-xs"
                      style={{
                        background: outbound ? 'var(--brass)' : 'var(--navy-panel)',
                        color: outbound ? 'var(--navy-deep)' : 'var(--ice)',
                        border: outbound ? 'none' : '1px solid var(--steel-800)',
                      }}
                    >
                      <div className="flex items-center gap-1 text-[9.5px] font-bold opacity-70 mb-0.5 uppercase">
                        <ChannelIcon size={10} /> {m.channel} · {m.status}
                      </div>
                      {m.subject && <div className="font-bold mb-0.5">{m.subject}</div>}
                      {m.media_url && (
                        <a href={m.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] mb-1 opacity-85">
                          <Paperclip size={11} /> Attachment
                        </a>
                      )}
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      {m.status === 'failed' && m.error_detail && (
                        <div className="mt-1 pt-1 text-[10.5px] font-bold" style={{ borderTop: '1px solid rgba(0,0,0,0.25)', color: 'var(--danger)' }}>
                          {m.error_detail}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-3.5" style={{ borderTop: '1px solid var(--steel-800)' }}>
              <div className="flex gap-1.5 mb-1.5">
                {CHANNELS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setChannel((c) => (c === key ? null : key))
                      setMediaUrl(null)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-bold"
                    style={{
                      background: channel === key ? 'var(--brass)' : 'var(--navy-panel-2)',
                      color: channel === key ? 'var(--navy-deep)' : 'var(--steel-400)',
                      border: channel === key ? 'none' : '1px solid var(--steel-800)',
                    }}
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>

              {channel && (
                <>
                  <div className="mt-2.5 mb-2.5">
                    <TemplatePicker
                      templates={templates.filter((t) => t.channel === CHANNEL_TO_TEMPLATE_CHANNEL[channel])}
                      label={channel === 'call' ? 'Scripts' : 'Templates'}
                      onSelect={applyTemplate}
                    />
                  </div>
                  {channel === 'email' && (
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full mb-2 px-2.5 py-2 text-xs rounded-sm"
                      style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
                    />
                  )}
                  {mediaUrl && (
                    <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded-sm text-[10.5px]" style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)', color: 'var(--brass)' }}>
                      <Paperclip size={11} /> <span className="flex-1">Attachment from template</span>
                      <button onClick={() => setMediaUrl(null)}><X size={12} style={{ color: 'var(--steel-400)' }} /></button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      autoFocus
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={channel === 'call' ? 'Log call notes…' : `Write a ${CHANNELS.find((c) => c.key === channel)?.label.toLowerCase()}…`}
                      rows={2}
                      className="flex-1 px-2.5 py-2 text-xs rounded-sm resize-none"
                      style={{ background: 'var(--navy-panel)', border: '1px solid var(--steel-800)', color: 'var(--ice)' }}
                    />
                    <button
                      onClick={send}
                      disabled={sending || !body.trim()}
                      className="flex items-center gap-1.5 px-4 rounded-sm text-xs font-bold"
                      style={{ background: 'var(--brass)', color: 'var(--navy-deep)', opacity: sending || !body.trim() ? 0.5 : 1 }}
                    >
                      <Send size={13} /> {channel === 'call' ? 'Log' : 'Send'}
                    </button>
                  </div>
                  <div className="text-[10px] mt-1.5" style={{ color: 'var(--steel-400)' }}>
                    {channel === 'email' ? 'Logs here — connect email sending in Numbers to deliver live.' : 'Add Twilio credentials to deliver live — saves here either way.'}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
