import { create } from 'zustand'
import type { ChatMessage, Conversation } from '../types'
import { MOCK_CONVERSATIONS } from '../mockData'

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  draft: string
  setDraft: (d: string) => void
  setActiveConversation: (id: string) => void
  sendMessage: (
    conversationId: string,
    msg: Omit<ChatMessage, 'id' | 'timestamp' | 'status'>,
  ) => void
}

export const useChatStore = create<ChatState>()((set) => ({
  conversations: MOCK_CONVERSATIONS,
  activeConversationId: MOCK_CONVERSATIONS[0]?.id ?? null,
  draft: '',
  setDraft: (d) => set({ draft: d }),
  setActiveConversation: (id) =>
    set((state) => ({
      activeConversationId: id,
      draft: '',
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c,
      ),
    })),
  sendMessage: (conversationId, msg) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  ...msg,
                  id: `${conversationId}-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  status: 'sent' as const,
                },
              ],
            }
          : c,
      ),
      draft: '',
    })),
}))
