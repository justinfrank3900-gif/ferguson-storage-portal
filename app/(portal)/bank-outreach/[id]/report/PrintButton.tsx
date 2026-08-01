'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2.5 rounded-sm text-sm font-mono uppercase tracking-wider"
      style={{ background: 'var(--ice)', color: 'var(--navy-panel)' }}
    >
      Print / Save as PDF
    </button>
  )
}
