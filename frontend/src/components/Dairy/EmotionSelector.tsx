import React, { useState } from 'react';
import { 
  BsEmojiSmile, 
  BsEmojiLaughing, 
  BsEmojiFrown, 
  BsEmojiAngry,
  BsEmojiNeutral,
  BsEmojiSunglasses,
  BsEmojiWink,
  BsEmojiDizzy,
  BsEmojiExpressionless
} from 'react-icons/bs';

// Current Date: 2025-05-19
// Current User: vishnutej000

interface EmotionSelectorProps {
  onSelect: (emotion: string) => void;
  selectedEmotion?: string;
}

type Emotion = {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
};

const EmotionSelector: React.FC<EmotionSelectorProps> = ({ onSelect, selectedEmotion }) => {
  const [isOpen, setIsOpen] = useState(false);

  const emotions: Emotion[] = [
    {
      id: 'happy',
      icon: <BsEmojiSmile />,
      label: 'Happy',
      color: 'text-yellow-500'
    },
    {
      id: 'excited',
      icon: <BsEmojiLaughing />,
      label: 'Excited',
      color: 'text-yellow-400'
    },
    {
      id: 'sad',
      icon: <BsEmojiFrown />,
      label: 'Sad',
      color: 'text-blue-500'
    },
    {
      id: 'angry',
      icon: <BsEmojiAngry />,
      label: 'Angry',
      color: 'text-red-500'
    },
    {
      id: 'neutral',
      icon: <BsEmojiNeutral />,
      label: 'Neutral',
      color: 'text-gray-500'
    },
    {
      id: 'cool',
      icon: <BsEmojiSunglasses />,
      label: 'Cool',
      color: 'text-purple-500'
    },
    {
      id: 'confused',
      icon: <BsEmojiDizzy />,
      label: 'Confused',
      color: 'text-green-500'
    },
    {
      id: 'tired',
      icon: <BsEmojiExpressionless />,
      label: 'Tired',
      color: 'text-gray-600'
    },
    {
      id: 'flirty',
      icon: <BsEmojiWink />,
      label: 'Flirty',
      color: 'text-pink-500'
    },
  ];

  const getSelectedEmotion = () => {
    return emotions.find(emotion => emotion.id === selectedEmotion) || emotions[0];
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (emotion: Emotion) => {
    onSelect(emotion.id);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className={`text-xl ${getSelectedEmotion().color}`}>
          {getSelectedEmotion().icon}
        </span>
      </button>

      {isOpen && (
        <div 
          className="absolute mt-1 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 border border-gray-200 dark:border-gray-700 w-64"
          style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="grid grid-cols-3 gap-2">
            {emotions.map(emotion => (
              <button
                key={emotion.id}
                onClick={() => handleSelect(emotion)}
                className={`flex flex-col items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none ${
                  selectedEmotion === emotion.id 
                    ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500' 
                    : ''
                }`}
              >
                <span className={`text-2xl ${emotion.color}`}>{emotion.icon}</span>
                <span className="text-xs text-gray-700 dark:text-gray-300 mt-1">{emotion.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionSelector;