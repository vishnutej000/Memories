import React from 'react';
import { Emotion } from '../../types/diary.types';
import { 
  BsEmojiSmile, 
  BsEmojiFrown, 
  BsEmojiAngry,
  BsEmojiNeutral,
  BsEmojiSurprised,
  BsEmojiFear,
  BsEmojiHeartEyes 
} from 'react-icons/bs';

interface EmotionSelectorProps {
  selectedEmotion: Emotion;
  onSelect: (emotion: Emotion) => void;
  disabled?: boolean;
}

const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onSelect,
  disabled = false
}) => {
  const emotions: Array<{ value: Emotion; icon: React.ReactNode; label: string }> = [
    { value: 'happy', icon: <BsEmojiSmile />, label: 'Happy' },
    { value: 'sad', icon: <BsEmojiFrown />, label: 'Sad' },
    { value: 'angry', icon: <BsEmojiAngry />, label: 'Angry' },
    { value: 'neutral', icon: <BsEmojiNeutral />, label: 'Neutral' },
    { value: 'surprised', icon: <BsEmojiSurprised />, label: 'Surprised' },
    { value: 'fearful', icon: <BsEmojiFear />, label: 'Fearful' },
    { value: 'loving', icon: <BsEmojiHeartEyes />, label: 'Loving' },
  ];
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        How did you feel?
      </label>
      
      <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
        {emotions.map((emotion) => (
          <button
            key={emotion.value}
            onClick={() => !disabled && onSelect(emotion.value)}
            className={`emotion-option ${
              selectedEmotion === emotion.value ? 'selected' : ''
            } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={disabled}
            title={emotion.label}
            type="button"
          >
            <span className="text-2xl mb-1">{emotion.icon}</span>
            <span className="text-xs">{emotion.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmotionSelector;