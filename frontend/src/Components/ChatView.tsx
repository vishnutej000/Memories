import React, { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { format } from 'date-fns';
import { ChatMessage } from '../types';
import { useInfiniteScroll } from '../Hooks/useInfiniteScroll';
import { useAudioRecorder } from '../Hooks/useAudioRecorder';
import { useSentimentAnalysis } from '../Hooks/useSentimentAnalysis';

interface ChatViewProps {
    sessionId: string;
    messages: ChatMessage[];
    currentUser: string;
    onLoadMore: () => Promise<void>;
    hasMore: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({
    sessionId,
    messages,
    currentUser,
    onLoadMore,
    hasMore,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const listRef = useRef<List>(null);
    const { isRecording, startRecording, stopRecording, audioBlob } = useAudioRecorder();
    const { analyzeSentiment } = useSentimentAnalysis();

    const { containerRef, loading } = useInfiniteScroll({
        onLoadMore,
        hasMore,
    });

    const renderMessage = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const message = messages[index];
        const isCurrentUser = message.sender === currentUser;
        const showDate = index === 0 || 
            format(new Date(message.timestamp), 'yyyy-MM-dd') !== 
            format(new Date(messages[index - 1].timestamp), 'yyyy-MM-dd');

        return (
            <div style={style}>
                {showDate && (
                    <div className="flex justify-center my-4">
                        <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                            {format(new Date(message.timestamp), 'MMMM d, yyyy')}
                        </span>
                    </div>
                )}
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isCurrentUser
                                ? 'bg-green-100 ml-4'
                                : 'bg-white mr-4'
                        }`}
                    >
                        {!isCurrentUser && (
                            <div className="text-sm font-semibold text-gray-700 mb-1">
                                {message.sender}
                            </div>
                        )}
                        <div className="text-gray-800">{message.content}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(message.timestamp), 'HH:mm')}
                        </div>                        {message.sentimentScore !== undefined && message.sentimentScore !== null && (
                            <div className="mt-1">
                                <span
                                    className={`text-xs px-2 py-1 rounded ${
                                        message.sentimentScore! > 0
                                            ? 'bg-green-100 text-green-800'
                                            : message.sentimentScore! < 0
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    {message.sentimentScore! > 0
                                        ? '😊'
                                        : message.sentimentScore! < 0
                                        ? '😢'
                                        : '😐'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <div className="flex-1 overflow-hidden" ref={containerRef}>
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            ref={listRef}
                            height={height}
                            width={width}
                            itemCount={messages.length}
                            itemSize={100}
                        >
                            {renderMessage}
                        </List>
                    )}
                </AutoSizer>
            </div>
            <div className="bg-white p-4 border-t">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2 rounded-full ${
                            isRecording ? 'bg-red-500' : 'bg-gray-200'
                        }`}
                    >
                        {isRecording ? '⏹️' : '🎤'}
                    </button>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded-lg"
                    />
                    <button className="p-2 bg-green-500 text-white rounded-full">
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatView; 