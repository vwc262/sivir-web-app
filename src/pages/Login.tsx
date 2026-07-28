import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck, User, KeyRound } from 'lucide-react'
import { useAuthStore } from '@/shared'

type Mode = 'login' | 'register'

export default function Login() {
  const user = useAuthStore((s) => s.user)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to="/dashboard/map" replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña')
      return
    }
    login(username.trim())
    navigate('/dashboard/map', { replace: true })
  }

  return (
    <div className="grid-bg flex min-h-full items-center justify-center bg-bg-deep p-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-border p-8"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="glow-blue flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/15 text-accent-blue">
            <ShieldCheck size={28} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-wide">SIVIR</h1>
            <p className="text-xs text-text-muted">Sistema de Comando Táctico</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-black/30 p-1">
          {(
            [
              { value: 'login', label: 'Iniciar Sesión' },
              { value: 'register', label: 'Registrarse' },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-lg py-2 text-sm font-medium transition-all duration-300 cursor-pointer ${
                mode === value
                  ? 'bg-accent-blue text-white shadow-lg shadow-blue-500/20'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs text-text-muted">
              <User size={13} /> Usuario
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError(null)
              }}
              autoComplete="username"
              className="w-full rounded-lg border border-border bg-black/30 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent-blue/60"
              placeholder="operador01"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs text-text-muted">
              <KeyRound size={13} /> Contraseña o PIN
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full rounded-lg border border-border bg-black/30 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent-blue/60"
              placeholder="••••••"
            />
          </label>

          {error && <p className="text-xs text-accent-red">{error}</p>}

          <button
            type="submit"
            className="btn-shimmer w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            {mode === 'login' ? 'Acceder al sistema' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
