export interface ChatMessage {
  id: string
  senderId: string
  text?: string
  imageUrl?: string
  timestamp: string     // ISO 8601
  status: 'sent' | 'delivered' | 'read'
}

export interface Conversation {
  id: string
  contactName: string
  messages: ChatMessage[]
  unreadCount: number
}

export type MapProvider = 'mapbox' | 'osm'
export type AlertType = 'discreta' | 'critica'

export interface OperatorData {
  name: string
  unitId: string
  device: string
}
