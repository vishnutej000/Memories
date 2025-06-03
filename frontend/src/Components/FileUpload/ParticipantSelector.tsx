import React, { useState } from 'react';

interface ParticipantSelectorProps {
  participants: string[];
  onSelect: (selectedParticipant: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  participants,
  onSelect,
  onCancel,
  isLoading = false
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');

  const handleSubmit = () => {
    if (selectedParticipant) {
      onSelect(selectedParticipant);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Your Identity
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          We found {participants.length} participants in this chat. Please select which one is you:
        </p>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {participants.map((participant) => (
            <label 
              key={participant}
              className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <input
                type="radio"
                name="participant"
                value={participant}
                checked={selectedParticipant === participant}
                onChange={(e) => setSelectedParticipant(e.target.value)}
                className="mr-3 text-whatsapp-teal focus:ring-whatsapp-teal"
                disabled={isLoading}
              />
              <span className="text-gray-900 dark:text-white font-medium">
                {participant}
              </span>
            </label>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedParticipant || isLoading}
            className="flex-1 px-4 py-2 bg-whatsapp-teal hover:bg-whatsapp-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantSelector;
