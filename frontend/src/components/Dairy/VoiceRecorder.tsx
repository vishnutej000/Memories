import React, { useEffect, useRef } from 'react';
import { BsMic, BsStop, BsPlayFill, BsPauseFill, BsTrash } from 'react-icons/bs';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import WaveSurfer from 'wavesurfer.js';

interface VoiceRecorderProps {
  chatId: string;
  date: string;
  onRecordingChange?: (hasRecording: boolean, duration: number) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  chatId, 
  date, 
  onRecordingChange 
}) => {
  const { 
    isRecording,
    recordingTime,
    audioUrl,
    audioBlob,
    isPlaying,
    error,
    startRecording,
    stopRecording,
    togglePlayback,
    deleteRecording,
    hasRecording
  } = useAudioRecorder(chatId, date);
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  // Initialize WaveSurfer
  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4ade80',
        progressColor: '#22c55e',
        cursorColor: '#ef4444',
        barWidth: 2,
        barGap: 1,
        barRadius: 3,
        height: 60,
        responsive: true,
      });
      
      wavesurferRef.current.on('finish', () => {
        togglePlayback();
      });
    }
    
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, []);
  
  // Load audio if available
  useEffect(() => {
    if (audioUrl && wavesurferRef.current) {
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);
  
  // Notify parent component about recording changes
  useEffect(() => {
    if (onRecordingChange) {
      onRecordingChange(hasRecording, recordingTime);
    }
  }, [hasRecording, recordingTime, onRecordingChange]);
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Voice Note</h3>
      
      <div className="flex items-center mb-4">
        {!isRecording && !hasRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            aria-label="Start recording"
          >
            <BsMic className="text-xl" />
          </button>
        ) : isRecording ? (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors animate-recording"
            aria-label="Stop recording"
          >
            <BsStop className="text-xl" />
          </button>
        ) : (
          <button
            onClick={togglePlayback}
            className="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <BsPauseFill className="text-xl" /> : <BsPlayFill className="text-xl" />}
          </button>
        )}
        
        <div className="ml-4 flex-1">
          {isRecording ? (
            <div className="text-red-500 font-semibold animate-pulse">
              Recording... {formatTime(recordingTime)}
            </div>
          ) : hasRecording ? (
            <div className="w-full" ref={waveformRef}></div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              Click the microphone to start recording
            </div>
          )}
        </div>
        
        {hasRecording && !isRecording && (
          <button
            onClick={deleteRecording}
            className="ml-2 text-red-500 hover:text-red-600 transition-colors"
            aria-label="Delete recording"
          >
            <BsTrash className="text-xl" />
          </button>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;