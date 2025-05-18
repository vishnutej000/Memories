import React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';

interface FileImportProps {
  isOpen: boolean;
  onClose: () => void;
  onFileImport: (file: File, userName: string) => Promise<void>;
  isProcessing: boolean;
  error?: string;
}

const FileImport: React.FC<FileImportProps> = ({
  isOpen,
  onClose,
  onFileImport,
  isProcessing,
  error
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [detectedParticipants, setDetectedParticipants] = useState<string[]>([]);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [step, setStep] = useState<'select-file' | 'select-user'>('select-file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setDetectedParticipants([]);
      setSelectedUserName('');
      setStep('select-file');
    }
  }, [isOpen]);
  
  // Extract participants from file (simplified mock implementation)
  const extractParticipantsFromFile = useCallback(async (selectedFile: File): Promise<string[]> => {
    // In a real app, this would actually read and parse the WhatsApp chat file
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock detected participants
        resolve(["You", "Alice", "Bob", "Charlie", "Group"]);
      }, 500);
    });
  }, []);
  
  // Handle file selection
  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    try {
      const participants = await extractParticipantsFromFile(selectedFile);
      setDetectedParticipants(participants);
      setStep('select-user');
    } catch (err) {
      console.error("Error parsing file participants:", err);
      // Handle error
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (file && selectedUserName) {
      try {
        await onFileImport(file, selectedUserName);
      } catch (err) {
        console.error("Error importing file:", err);
      }
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Import WhatsApp Chat
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isProcessing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {step === 'select-file' ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                dragActive ? 'border-whatsapp-teal bg-whatsapp-green-light' : 'border-gray-300 hover:border-whatsapp-teal'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {file ? file.name : 'Drop your WhatsApp chat export file'}
              </h3>
              
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Export your chat from WhatsApp by going to:<br />
                  Chat options {'>'}  More {'>'}  Export chat
                </p>
              </div>
              
              <div className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-whatsapp-teal hover:bg-opacity-90 focus:outline-none"
                  disabled={isProcessing}
                >
                  Select .txt file
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select who you are in this chat:
                </label>
                
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                  {detectedParticipants.map((participant) => (
                    <label 
                      key={participant} 
                      className={`flex items-center p-2 rounded-md cursor-pointer ${
                        selectedUserName === participant 
                          ? 'bg-whatsapp-green-light' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="participant"
                        value={participant}
                        checked={selectedUserName === participant}
                        onChange={() => setSelectedUserName(participant)}
                        className="h-4 w-4 text-whatsapp-teal focus:ring-whatsapp-teal border-gray-300"
                      />
                      <span className="ml-2 block text-sm text-gray-900">
                        {participant}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep('select-file')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  disabled={isProcessing}
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-whatsapp-teal hover:bg-opacity-90 focus:outline-none disabled:opacity-50"
                  disabled={!selectedUserName || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Import Chat'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileImport;