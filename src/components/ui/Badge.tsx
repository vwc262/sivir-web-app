import type { ReactNode } from 'react'

interface BadgeProps {
  color?: 'red' | 'blue' | 'amber' | 'green'
  pulse?: boolean
  children: ReactNode
}

const COLORS = {
  red: 'bg-accent-red/15 text-accent-red border-accent-red/40',
  blue: 'bg-accent-blue/15 text-accent-blue border-accent-blue/40',
  amber: 'bg-accent-amber/15 text-accent-amber border-accent-amber/40',
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
} as const

export function Badge({ color = 'blue', pulse = false, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${COLORS[color]} ${pulse ? 'animate-pulse' : ''}`}
    >
      {children}
    </span>
  )
}
