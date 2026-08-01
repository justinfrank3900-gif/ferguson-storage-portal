'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, FileText, Phone } from 'lucide-react'

const TABS = [
  { href: '/communications/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/communications/templates', label: 'Templates', icon: FileText },
  { href: '/communications/numbers', label: 'Phone Numbers', icon: Phone },
]

export default function CommunicationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-8 rounded-sm overflow-hidden" style={{ background: 'var(--navy-deep)' }}>
      <div
        className="flex items-center gap-1 px-6 pt-4"
        style={{ background: 'var(--navy-panel)', borderBottom: '1px solid var(--steel-800)' }}
      >
        <div className="font-display text-base mr-5 pb-3" style={{ color: 'var(--ice)' }}>
          Communications
        </div>
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold"
              style={{
                color: active ? 'var(--brass)' : 'var(--steel-400)',
                borderBottom: active ? '2px solid var(--brass)' : '2px solid transparent',
              }}
            >
              <Icon size={13} /> {label}
            </Link>
          )
        })}
      </div>
      <div className="flex-1 min-h-0" style={{ background: 'var(--navy-deep)' }}>
        {children}
      </div>
    </div>
  )
}
