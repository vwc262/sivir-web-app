import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '../constants'
import { sivirStorage } from './storage'

interface AuthState {
  user: string | null
  loggedAt: string | null
  login: (username: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loggedAt: null,
      login: (username) => set({ user: username, loggedAt: new Date().toISOString() }),
      logout: () => set({ user: null, loggedAt: null }),
    }),
    {
      name: STORAGE_KEYS.session,
      storage: createJSONStorage(() => sivirStorage),
    },
  ),
)
