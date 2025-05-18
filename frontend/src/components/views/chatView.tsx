import { useChat } from '../../Contexts/ChatContext'
import { FixedSizeList as List } from 'react-window'
import MessageBubble from '../chatui/messagebubble'
import FileImport from '../modals/Fileimport'

export default function ChatView() {
  const { messages, parseFile, isLoading } = useChat()

  return (
    <div className="h-full flex flex-col">
      <div className="bg-whatsapp-dark text-white p-4">
        <h1 className="text-xl font-semibold">Chat History</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        {messages.length > 0 ? (
          <List
            height={window.innerHeight - 128}
            itemCount={messages.length}
            itemSize={80}
            width="100%"
          >
            {({ index, style }) => (
              <div style={style}>
                <MessageBubble 
                  message={messages[index]} 
                  isUser={messages[index].isUser}
                />
              </div>
            )}
          </List>
        ) : (
          <FileImport onImport={parseFile} isLoading={isLoading} />
        )}
      </div>
    </div>
  )
}