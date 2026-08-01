'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Incorrect email or password.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="guilloche-bg min-h-screen w-full flex items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #ffffff 0%, #e6eaf0 60%)' }}
    >
      <div className="w-full max-w-[420px]">
        {/* Seal / wordmark */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
            style={{ border: '1px solid var(--brass-dim)' }}
          >
            <div
              className="w-9 h-9 rounded-full"
              style={{ border: '1px solid var(--brass)' }}
            />
          </div>
          <h1
            className="font-display text-[2rem] tracking-[0.04em] text-center leading-none"
            style={{ color: 'var(--ice)' }}
          >
            Ferguson Storage
          </h1>
          <p
            className="font-mono text-[10px] tracking-[0.28em] uppercase mt-3"
            style={{ color: 'var(--brass)' }}
          >
            Secured Asset Recovery &amp; Storage
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-sm px-8 py-9"
          style={{
            background: 'var(--navy-panel)',
            border: '1px solid var(--steel-800)',
            boxShadow: '0 20px 45px -20px rgba(15,33,55,0.18)',
          }}
        >
          <form onSubmit={handleSubmit}>
            <label
              className="font-mono block text-[10px] tracking-[0.18em] uppercase mb-2"
              style={{ color: 'var(--steel-400)' }}
            >
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-5 px-3 py-3 text-sm rounded-sm outline-none"
              style={{
                background: 'var(--navy-deep)',
                border: '1px solid var(--steel-800)',
                color: 'var(--ice)',
              }}
              placeholder="name@fergusonstorage.com"
            />

            <label
              className="font-mono block text-[10px] tracking-[0.18em] uppercase mb-2"
              style={{ color: 'var(--steel-400)' }}
            >
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-6 px-3 py-3 text-sm rounded-sm outline-none"
              style={{
                background: 'var(--navy-deep)',
                border: '1px solid var(--steel-800)',
                color: 'var(--ice)',
              }}
              placeholder="••••••••"
            />

            {error && (
              <p className="text-sm mb-5" style={{ color: 'var(--danger)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-sm font-mono text-[11px] tracking-[0.18em] uppercase transition-opacity"
              style={{
                background: 'var(--ice)',
                color: 'var(--navy-panel)',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verifying…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p
          className="font-mono text-center text-[10px] tracking-[0.15em] uppercase mt-8"
          style={{ color: 'var(--steel-600)' }}
        >
          Authorized Personnel Only
        </p>
      </div>
    </div>
  )
}
