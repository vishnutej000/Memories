import React from 'react';
import { JournalEntry } from '../../types';
import { formatDateTime } from '../../utils/date.Utils';
import Button from '../UI/Button';

interface JournalEntryProps {
  entry: JournalEntry;
  onEdit: () => void;
}

const JournalEntryComponent: React.FC<JournalEntryProps> = ({ entry, onEdit }) => {
  // Emotion mapping
  const emotionEmojis: Record<string, string> = {
    happy: '😊',
    sad: '😔',
    angry: '😠',
    surprised: '😲',
    fearful: '😨',
    disgusted: '🤢',
    loving: '❤️',
    neutral: '😐'
  };
  
  // Format intensity stars
  const formatIntensity = (intensity: number) => {
    return '★'.repeat(intensity) + '☆'.repeat(5 - intensity);
  };
  
  return (
    <div className="space-y-6">
      {/* Header with metadata */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Journal Entry
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated {formatDateTime(entry.updatedAt)}
          </p>
        </div>
        
        <Button
          onClick={onEdit}
          variant="outline"
          size="small"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          }
        >
          Edit
        </Button>
      </div>
      
      {/* Emotion display */}
      <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-4xl mr-4">
          {emotionEmojis[entry.emotion.primary] || '😐'}
        </div>
        <div>
          <div className="font-medium text-gray-800 dark:text-white">
            {entry.emotion.primary.charAt(0).toUpperCase() + entry.emotion.primary.slice(1)}
          </div>
          <div className="text-sm text-whatsapp-dark dark:text-whatsapp-light">
            {formatIntensity(entry.emotion.intensity)}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="prose prose-sm sm:prose max-w-none dark:prose-invert">
        {entry.text.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      
      {/* Audio note */}
      {entry.audioNoteUrl && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Audio Note
          </h3>
          <audio controls className="w-full">
            <source src={entry.audioNoteUrl} type="audio/webm" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      
      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map(tag => (
            <span 
              key={tag} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-whatsapp-light/10 text-whatsapp-dark dark:bg-whatsapp-dark/20 dark:text-whatsapp-light"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalEntryComponent;