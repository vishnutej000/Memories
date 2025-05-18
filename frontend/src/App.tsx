import { useState } from 'react'
import { ChatProvider } from './Contexts/ChatContext'
import ChatView from './components/views/chatView'
import DiaryView from './components/views/DairyView'

function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'diary'>('chat')

  return (
    <ChatProvider>
      <div className="flex h-screen bg-gray-50">
        <div className="w-16 bg-gray-800 flex flex-col items-center py-4">
          <button onClick={() => setCurrentView('chat')} className="p-3 text-white">
            💬
          </button>
          <button onClick={() => setCurrentView('diary')} className="p-3 text-white">
            📅
          </button>
        </div>
        
        <div className="flex-1">
          {currentView === 'chat' && <ChatView />}
          {currentView === 'diary' && <DiaryView />}
        </div>
      </div>
    </ChatProvider>
  )
}

export default App