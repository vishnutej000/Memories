import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, MicrophoneIcon } from '@heroicons/react/24/solid';

interface ChatInputProps {
  onSend: (message: string) => void;
  onRecord: () => void;
  isRecording: boolean;
}

export default function ChatInput({ onSend, onRecord, isRecording }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <form 
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white p-3"
    >
      <div className="flex items-end rounded-lg border border-gray-300 bg-gray-50">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="max-h-32 flex-1 resize-none border-none bg-transparent p-3 text-gray-900 outline-none"
          rows={1}
        />
        
        <div className="flex items-center space-x-1 p-1">
          <button
            type="button"
            onClick={onRecord}
            className={`rounded-full p-2 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-gray-700'}`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="rounded-full bg-whatsapp-DEFAULT p-2 text-white disabled:opacity-50"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </form>
  );
}