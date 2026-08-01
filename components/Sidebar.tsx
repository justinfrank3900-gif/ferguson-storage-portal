'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Truck,
  Users,
  ShieldCheck,
  Landmark,
  Warehouse,
  FileText,
  Gavel,
  LogOut,
  MessageSquare,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assets', label: 'Asset Intake', icon: Truck },
  { href: '/trustees', label: 'Trustee Files', icon: Users },
  { href: '/liens', label: 'Lien Registry', icon: ShieldCheck },
  { href: '/bank-outreach', label: 'Bank Outreach', icon: Landmark },
  { href: '/communications', label: 'Communications', icon: MessageSquare },
  { href: '/storage-ledger', label: 'Storage Ledger', icon: Warehouse },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/auction-network', label: 'Auction Network', icon: Gavel },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="w-64 min-h-screen flex flex-col shrink-0"
      style={{ background: 'var(--navy-panel)', borderRight: '1px solid var(--steel-800)' }}
    >
      <div className="px-6 py-7" style={{ borderBottom: '1px solid var(--steel-800)' }}>
        <h1 className="font-display text-[1.15rem] tracking-[0.02em]" style={{ color: 'var(--ice)' }}>
          Ferguson Storage
        </h1>
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase mt-1" style={{ color: 'var(--brass)' }}>
          Secured Asset Recovery
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors"
              style={{
                background: active ? 'var(--navy-panel-2)' : 'transparent',
                color: active ? 'var(--ice)' : 'var(--steel-400)',
                borderLeft: active ? '2px solid var(--brass)' : '2px solid transparent',
              }}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--steel-800)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm w-full transition-colors"
          style={{ color: 'var(--steel-400)' }}
        >
          <LogOut size={16} strokeWidth={1.75} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
