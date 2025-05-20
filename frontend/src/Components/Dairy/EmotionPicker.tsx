import React from 'react';
import { Emotion } from '../../types';

interface EmotionPickerProps {
  emotion: Emotion;
  onChange: (emotion: Emotion) => void;
}

const EmotionPicker: React.FC<EmotionPickerProps> = ({ emotion, onChange }) => {
  const emotions = [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'loving', label: 'Loving', emoji: '❤️' },
    { id: 'surprised', label: 'Surprised', emoji: '😲' },
    { id: 'neutral', label: 'Neutral', emoji: '😐' },
    { id: 'sad', label: 'Sad', emoji: '😔' },
    { id: 'angry', label: 'Angry', emoji: '😠' },
    { id: 'fearful', label: 'Fearful', emoji: '😨' },
    { id: 'disgusted', label: 'Disgusted', emoji: '🤢' }
  ] as const;
  
  const intensityLevels = [
    { value: 1, label: 'Very Low' },
    { value: 2, label: 'Low' },
    { value: 3, label: 'Medium' },
    { value: 4, label: 'High' },
    { value: 5, label: 'Very High' }
  ] as const;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {emotions.map(em => (
          <button
            key={em.id}
            onClick={() => onChange({ ...emotion, primary: em.id as Emotion['primary'] })}
            className={`p-2 rounded-lg flex flex-col items-center transition-colors ${
              emotion.primary === em.id
                ? 'bg-whatsapp-dark text-white dark:bg-whatsapp-light dark:text-gray-900'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
            }`}
          >
            <span className="text-2xl mb-1">{em.emoji}</span>
            <span className="text-xs font-medium">{em.label}</span>
          </button>
        ))}
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Intensity: {intensityLevels.find(i => i.value === emotion.intensity)?.label}
        </label>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={emotion.intensity}
          onChange={e => onChange({ ...emotion, intensity: Number(e.target.value) as Emotion['intensity'] })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Very Low</span>
          <span>Medium</span>
          <span>Very High</span>
        </div>
      </div>
    </div>
  );
};

export default EmotionPicker;