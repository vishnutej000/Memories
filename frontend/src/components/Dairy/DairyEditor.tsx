import React, { useState, useEffect } from 'react';
import { Emotion } from '../../types/diary.types';
import EmotionSelector from './EmotionSelector';

interface DiaryEditorProps {
  initialText: string;
  initialEmotion: Emotion;
  onSave: (text: string, emotion: Emotion) => void;
}

const DiaryEditor: React.FC<DiaryEditorProps> = ({
  initialText,
  initialEmotion,
  onSave
}) => {
  const [text, setText] = useState(initialText);
  const [emotion, setEmotion] = useState<Emotion>(initialEmotion);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Update local state when props change
  useEffect(() => {
    setText(initialText);
    setEmotion(initialEmotion);
  }, [initialText, initialEmotion]);
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(text, emotion);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving diary:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
        Diary Entry
      </h3>
      
      <div className="mb-4">
        <EmotionSelector 
          selectedEmotion={emotion} 
          onSelect={setEmotion}
          disabled={!isEditing && !!initialText}
        />
      </div>
      
      {isEditing || !initialText ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            placeholder="How did you feel about today's conversation? What were the highlights?"
          />
          
          <div className="flex justify-end mt-4 space-x-2">
            {initialText && (
              <button
                onClick={() => {
                  setText(initialText);
                  setEmotion(initialEmotion);
                  setIsEditing(false);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={isSaving}
              >
                Cancel
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-700 rounded-md p-4 min-h-[12rem] shadow-sm whitespace-pre-wrap">
            {text || <span className="text-gray-400 dark:text-gray-500">No entry for this date.</span>}
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Edit Entry
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DiaryEditor;