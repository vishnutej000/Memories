import { useChat } from '../../Contexts/ChatContext'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function DiaryView() {
  const { messages } = useChat()
  const [currentDate, setCurrentDate] = useState(new Date())

  // Group messages by date
  const messagesByDate = messages.reduce((acc, message) => {
    const dateKey = format(message.timestamp, 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(message)
    return acc
  }, {} as Record<string, typeof messages>)

  const currentDateKey = format(currentDate, 'yyyy-MM-dd')
  const todaysMessages = messagesByDate[currentDateKey] || []

  // Calculate sentiment (mock - replace with real analysis)
  const sentimentScore = todaysMessages.length > 0 
    ? todaysMessages.reduce((sum, msg) => sum + (msg.sentimentScore || 0), 0) / todaysMessages.length
    : 0

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-whatsapp-dark text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Daily Diary</h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => changeDate(-1)}
            className="p-1 rounded-full hover:bg-white/10"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="font-medium">
            {format(currentDate, 'MMMM d, yyyy')}
          </span>
          <button 
            onClick={() => changeDate(1)}
            className="p-1 rounded-full hover:bg-white/10"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Daily Summary</h2>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              sentimentScore > 0.5 ? 'bg-green-100 text-green-800' :
              sentimentScore < -0.5 ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {sentimentScore > 0.5 ? '😊' :
               sentimentScore < -0.5 ? '😞' : '😐'}
            </div>
            <div>
              <p className="font-medium">
                {todaysMessages.length} messages
              </p>
              <p className="text-sm text-gray-500">
                {sentimentScore > 0.5 ? 'Positive day' :
                 sentimentScore < -0.5 ? 'Challenging day' : 'Neutral day'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Journal Entry</h2>
          <textarea
            placeholder="Write about your day..."
            className="w-full min-h-[120px] p-2 border border-gray-300 rounded focus:ring-2 focus:ring-whatsapp-dark focus:border-transparent"
          />
          <button className="mt-2 bg-whatsapp-dark text-white px-4 py-2 rounded hover:bg-whatsapp-darker transition">
            Save Entry
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Conversation Highlights</h2>
          {todaysMessages.length > 0 ? (
            <div className="space-y-3">
              {todaysMessages.slice(0, 5).map((message) => (
                <div key={message.id} className="border-b border-gray-100 pb-2 last:border-0">
                  <p className="text-sm text-gray-500">
                    {format(message.timestamp, 'h:mm a')}
                  </p>
                  <p className="whitespace-pre-wrap">
                    {message.content.length > 100 
                      ? `${message.content.substring(0, 100)}...` 
                      : message.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No messages on this day</p>
          )}
        </div>
      </div>
    </div>
  )
}