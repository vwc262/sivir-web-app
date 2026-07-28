import type { Unit, Conversation } from './types'

export const TACTICAL_UNITS: Unit[] = [
  { id: '1', name: 'Usuario 1', phone: '+52 55 1234 5678', battery: 34, isAlerted: true,  coords: [-99.1250, 19.4380] },
  { id: '2', name: 'Usuario 2', phone: '+52 55 2345 6789', battery: 88, isAlerted: false, coords: [-99.1400, 19.4250] },
  { id: '3', name: 'Usuario 3', phone: '+52 55 3456 7890', battery: 12, isAlerted: false, coords: [-99.1350, 19.4450] },
  { id: '4', name: 'Usuario 4', phone: '+52 55 4567 8901', battery: 55, isAlerted: true,  coords: [-99.1180, 19.4300] },
  { id: '5', name: 'Usuario 5', phone: '+52 55 5678 9012', battery: 95, isAlerted: false, coords: [-99.1280, 19.4200] },
]

const today = new Date()
const at = (hoursAgo: number, minutes = 0): string => {
  const d = new Date(today)
  d.setHours(d.getHours() - hoursAgo, d.getMinutes() - minutes, 0, 0)
  return d.toISOString()
}

// 'me' = operador actual; cualquier otro senderId es el contacto
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    contactName: 'Usuario 1',
    unreadCount: 2,
    messages: [
      { id: 'c1m1', senderId: 'u1', text: 'Comandante, llegué al punto de control norte.', timestamp: at(5), status: 'read' },
      { id: 'c1m2', senderId: 'me', text: 'Recibido. ¿Todo en orden en el perímetro?', timestamp: at(4, 50), status: 'read' },
      { id: 'c1m3', senderId: 'u1', text: 'Afirmativo, sin novedades por ahora.', timestamp: at(4, 40), status: 'read' },
      { id: 'c1m4', senderId: 'u1', imageUrl: 'https://picsum.photos/seed/sivir1/480/320', timestamp: at(4, 35), status: 'read' },
      { id: 'c1m5', senderId: 'me', text: 'Buena foto del acceso. Mantén posición hasta las 18:00.', timestamp: at(4, 20), status: 'read' },
      { id: 'c1m6', senderId: 'u1', text: 'Entendido. Batería al 34%, aviso si baja más.', timestamp: at(1), status: 'delivered' },
      { id: 'c1m7', senderId: 'u1', text: '⚠️ Movimiento inusual en la zona este.', timestamp: at(0, 15), status: 'delivered' },
    ],
  },
  {
    id: 'c2',
    contactName: 'Usuario 2',
    unreadCount: 0,
    messages: [
      { id: 'c2m1', senderId: 'me', text: '¿Estado de las cámaras del sector B?', timestamp: at(28), status: 'read' },
      { id: 'c2m2', senderId: 'u2', text: 'Cámaras 1, 2 y 4 operativas. La 3 sigue sin señal.', timestamp: at(27, 45), status: 'read' },
      { id: 'c2m3', senderId: 'u2', imageUrl: 'https://picsum.photos/seed/sivir2/480/320', timestamp: at(27, 40), status: 'read' },
      { id: 'c2m4', senderId: 'me', text: 'Ok, programa mantenimiento para mañana.', timestamp: at(27, 30), status: 'read' },
      { id: 'c2m5', senderId: 'u2', text: 'Agendado a las 09:00.', timestamp: at(27), status: 'read' },
      { id: 'c2m6', senderId: 'me', text: 'Perfecto, gracias.', timestamp: at(26), status: 'read' },
    ],
  },
  {
    id: 'c3',
    contactName: 'Usuario 4',
    unreadCount: 1,
    messages: [
      { id: 'c3m1', senderId: 'u4', text: 'Activé la alerta desde mi dispositivo, es una prueba.', timestamp: at(50), status: 'read' },
      { id: 'c3m2', senderId: 'me', text: 'Recibida la prueba. La señal llegó fuerte y clara.', timestamp: at(49, 30), status: 'read' },
      { id: 'c3m3', senderId: 'u4', text: '¿Puedes confirmar mi posición en el mapa?', timestamp: at(49), status: 'read' },
      { id: 'c3m4', senderId: 'me', text: 'Confirmada: zona centro, cerca del segundo punto de reunión.', timestamp: at(48, 40), status: 'read' },
      { id: 'c3m5', senderId: 'u4', imageUrl: 'https://picsum.photos/seed/sivir3/480/320', timestamp: at(3), status: 'read' },
      { id: 'c3m6', senderId: 'u4', text: 'Vista desde mi posición actual.', timestamp: at(2, 55), status: 'delivered' },
    ],
  },
]

