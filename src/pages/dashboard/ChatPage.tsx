import { useState } from 'react'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'

type MobileView = 'list' | 'chat'

export default function ChatPage() {
  const [mobileView, setMobileView] = useState<MobileView>('list')

  return (
    <div className="flex h-full">
      <ChatSidebar
        className={mobileView === 'list' ? 'flex' : 'hidden'}
        onSelect={() => setMobileView('chat')}
      />
      <ChatWindow
        className={mobileView === 'chat' ? 'flex' : 'hidden'}
        onBack={() => setMobileView('list')}
      />
    </div>
  )
}
