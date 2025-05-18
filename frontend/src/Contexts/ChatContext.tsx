import { createContext, useContext, ReactNode, useState } from 'react'
import { WhatsAppMessage } from '../lib/types'

interface ChatContextType {
  messages: WhatsAppMessage[]
  parseFile: (file: File) => Promise<void>
  isLoading: boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const parseFile = async (file: File) => {
    setIsLoading(true)
    try {
      const text = await file.text()
      // Temporary mock data - replace with actual parser
      const mockMessages: WhatsAppMessage[] = Array(100).fill(0).map((_, i) => ({
        id: `msg-${i}`,
        timestamp: new Date(Date.now() - i * 60000),
        sender: i % 2 === 0 ? "You" : "Friend",
        content: `Sample message ${i}`,
        isMedia: false,
        isUser: i % 2 === 0,
      }))
      setMessages(mockMessages)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ChatContext.Provider value={{ messages, parseFile, isLoading }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used within ChatProvider')
  return context
}