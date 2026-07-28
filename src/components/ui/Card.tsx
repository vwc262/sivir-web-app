import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <section className={`glass-card p-5 ${className}`}>
      {title && (
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </h3>
      )}
      {children}
    </section>
  )
}
