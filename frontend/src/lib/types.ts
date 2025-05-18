export interface WhatsAppMessage {
  id: string
  timestamp: Date
  sender: string
  content: string
  isMedia: boolean
  isUser: boolean
  emojis?: string[]
  sentimentScore?: number
}