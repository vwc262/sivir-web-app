/** Iniciales de un nombre para avatares (máx. 2 letras). */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Hora corta HH:MM de un ISO string. */
export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

/** Etiqueta relativa para la lista de chats: hora si es hoy, si no fecha corta. */
export function conversationTimeLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

/** Color de un nivel de batería (0–100) para indicadores. */
export function batteryColor(level: number): string {
  if (level <= 20) return '#ef4444'
  if (level <= 50) return '#f59e0b'
  return '#22c55e'
}
