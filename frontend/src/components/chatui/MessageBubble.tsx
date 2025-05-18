import { format } from 'date-fns'
import { WhatsAppMessage } from '../../lib/types'

interface MessageBubbleProps {
  message: WhatsAppMessage
  isUser: boolean
}

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  return (
    <div className={`flex mb-2 px-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
        isUser 
          ? 'bg-whatsapp-DEFAULT text-white rounded-tr-none' 
          : 'bg-gray-200 rounded-tl-none'
      }`}>
        <p>{message.content}</p>
        <p className={`text-xs mt-1 ${
          isUser ? 'text-white/70' : 'text-gray-500'
        }`}>
          {format(message.timestamp, 'HH:mm')}
        </p>
      </div>
    </div>
  )
}