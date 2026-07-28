import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'btn-shimmer text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:pointer-events-none',
  danger:
    'bg-accent-red/90 hover:bg-accent-red text-white font-semibold glow-red disabled:opacity-40',
  ghost:
    'bg-bg-overlay hover:bg-white/10 text-text-primary border border-border disabled:opacity-40',
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors cursor-pointer ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
