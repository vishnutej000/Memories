import { useChat } from '../../Contexts/ChatContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, eachDayOfInterval, subDays } from 'date-fns'

export default function StatsView() {
  const { messages } = useChat()

  // Generate last 7 days data
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  }).map(date => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const dayMessages = messages.filter(m => 
      format(m.timestamp, 'yyyy-MM-dd') === dateKey
    )
    const sentiment = dayMessages.length > 0
      ? dayMessages.reduce((sum, m) => sum + (m.sentimentScore || 0), 0) / dayMessages.length
      : 0

    return {
      date: format(date, 'EEE'),
      fullDate: dateKey,
      messages: dayMessages.length,
      sentiment: parseFloat(sentiment.toFixed(2))
    }
  })

  // Top emojis calculation
  const emojiCounts = messages.reduce((acc, { content }) => {
    const emojiRegex = /[\p{Emoji}]/gu
    const emojis = content.match(emojiRegex) || []
    emojis.forEach(emoji => {
      acc[emoji] = (acc[emoji] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const topEmojis = Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="h-full flex flex-col">
      <div className="bg-whatsapp-dark text-white p-4">
        <h1 className="text-xl font-semibold">Chat Statistics</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Activity Last 7 Days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar 
                  yAxisId="left"
                  dataKey="messages" 
                  name="Messages"
                  fill="#8884d8" 
                />
                <Bar 
                  yAxisId="right"
                  dataKey="sentiment" 
                  name="Sentiment"
                  fill="#82ca9d" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Top Emojis</h2>
            {topEmojis.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {topEmojis.map(([emoji, count]) => (
                  <div key={emoji} className="flex flex-col items-center">
                    <span className="text-3xl">{emoji}</span>
                    <span className="text-sm text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No emojis found</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Conversation Insights</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Messages:</span>
                <span className="font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Most Active Day:</span>
                <span className="font-medium">
                  {last7Days.reduce((max, day) => 
                    day.messages > max.messages ? day : max
                  ).fullDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Average Sentiment:</span>
                <span className="font-medium">
                  {messages.length > 0
                    ? (messages.reduce((sum, m) => sum + (m.sentimentScore || 0), 0) / messages.length).toFixed(2)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}