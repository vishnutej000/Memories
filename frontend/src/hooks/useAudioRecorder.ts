import { useState, useCallback } from 'react';

interface UseAudioRecorderReturn {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    audioBlob: Blob | null;
    error: string | null;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setAudioChunks((chunks) => [...chunks, event.data]);
                }
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                setAudioBlob(audioBlob);
                setAudioChunks([]);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setError(null);
        } catch (err) {
            setError('Error accessing microphone');
            console.error('Error starting recording:', err);
        }
    }, [audioChunks]);

    const stopRecording = useCallback(() => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    }, [mediaRecorder, isRecording]);

    return {
        isRecording,
        startRecording,
        stopRecording,
        audioBlob,
        error,
    };
};