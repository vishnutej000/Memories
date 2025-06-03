import React, { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { ChatMessage } from '../types';
import { useAudioRecorder } from '../Hooks/useAudioRecorder';
import { useSentimentAnalysis } from '../Hooks/useSentimentAnalysis';
import WaveSurfer from 'wavesurfer.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import MemoryLane from './MemoryLane';

interface DiaryModeProps {
    sessionId: string;
    messages: ChatMessage[];
    currentUser: string;
}

interface DiaryEntry {
    date: Date;
    content: string;
    mood: number;
    audioUrl?: string;
    tags: string[];
}

const DiaryMode: React.FC<DiaryModeProps> = ({
    sessionId,
    messages,
    currentUser,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [diaryEntry, setDiaryEntry] = useState<string>('');
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [mood, setMood] = useState<number>(0);
    const [tags, setTags] = useState<string[]>([]);
    const wavesurferRef = React.useRef<WaveSurfer | null>(null);
    const waveformRef = React.useRef<HTMLDivElement>(null);

    const { isRecording, startRecording, stopRecording, audioBlob } = useAudioRecorder();
    const { analyzeSentiment } = useSentimentAnalysis();

    useEffect(() => {
        // Load diary entries for the selected date
        const loadEntries = async () => {
            try {
                const response = await fetch(`/api/session/${sessionId}/diary?date=${format(selectedDate, 'yyyy-MM-dd')}`);
                const data = await response.json();
                setEntries(data);
            } catch (error) {
                console.error('Error loading diary entries:', error);
            }
        };
        loadEntries();
    }, [sessionId, selectedDate]);

    useEffect(() => {
        if (waveformRef.current && audioBlob) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#4CAF50',
                progressColor: '#2E7D32',
                cursorColor: '#1B5E20',
                barWidth: 2,
                barRadius: 3,
                height: 50,
            });

            wavesurferRef.current.loadBlob(audioBlob);
        }

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
            }
        };
    }, [audioBlob]);

    const handleSaveEntry = async () => {
        const entry: DiaryEntry = {
            date: selectedDate,
            content: diaryEntry,
            mood,
            tags,
            audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
        };

        try {
            await fetch(`/api/session/${sessionId}/diary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entry),
            });

            setEntries([...entries, entry]);
            setDiaryEntry('');
            setMood(0);
            setTags([]);
        } catch (error) {
            console.error('Error saving diary entry:', error);
        }
    };

    const getDayMessages = () => {
        return messages.filter(msg => isSameDay(new Date(msg.timestamp), selectedDate));
    };

    const getDaySentiment = () => {
        const dayMessages = getDayMessages();
        const sentimentScores = dayMessages
            .filter(msg => msg.sentiment_score !== null)
            .map(msg => msg.sentiment_score as number);
        
        if (sentimentScores.length === 0) return 0;
        return sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
    };

    return (
        <div className="flex h-full">
            <div className="w-1/4 border-r p-4">
                <h2 className="text-xl font-bold mb-4">Calendar</h2>                <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => date && setSelectedDate(date)}
                    inline
                />
            </div>
            <div className="flex-1 p-4">
                <MemoryLane messages={messages} today={selectedDate} />
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">
                        {format(selectedDate, 'MMMM d, yyyy')}
                    </h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Daily Mood:</span>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setMood(value)}
                                    className={`w-8 h-8 rounded-full ${
                                        mood === value
                                            ? 'bg-yellow-400'
                                            : 'bg-gray-200'
                                    }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Chat Summary</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">
                            {getDayMessages().length} messages
                        </p>
                        <p className="text-gray-700">
                            Overall sentiment: {getDaySentiment().toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Diary Entry</h2>
                    <textarea
                        value={diaryEntry}
                        onChange={(e) => setDiaryEntry(e.target.value)}
                        className="w-full h-32 p-2 border rounded-lg mb-2"
                        placeholder="Write your thoughts for today..."
                    />
                    <div className="mb-4">
                        <div ref={waveformRef} className="w-full" />
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`mt-2 p-2 rounded-full ${
                                isRecording ? 'bg-red-500' : 'bg-gray-200'
                            }`}
                        >
                            {isRecording ? '⏹️ Stop Recording' : '🎤 Record Voice Note'}
                        </button>
                    </div>
                    <button
                        onClick={handleSaveEntry}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg"
                    >
                        Save Entry
                    </button>
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-2">Previous Entries</h2>
                    {entries.map((entry, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow mb-4">
                            <p className="text-gray-700">{entry.content}</p>
                            {entry.audioUrl && (
                                <audio controls src={entry.audioUrl} className="mt-2" />
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                                {entry.tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="bg-gray-100 px-2 py-1 rounded-full text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DiaryMode; 