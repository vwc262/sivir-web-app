// Barrel export — punto de entrada del código compartido de la app web.
export * from './types'
export * from './config'
export * from './constants'
export * from './mockData'
export * from './utils'
export * from './api'
export * from './hooks'
export * from './realtime'
export * from './store/storage'
export { getAccessToken } from './auth'
export {
  useAuthStore,
  useSession,
  useCondominioId,
  isSessionValid,
  type Session,
} from './store/useAuthStore'
export { useAlertsStore, useUnreadAlertCount } from './store/useAlertsStore'
export { useMapStore } from './store/useMapStore'
export { useChatStore } from './store/useChatStore'
export { useSettingsStore } from './store/useSettingsStore'
