import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { BsWhatsapp, BsUpload, BsCheck2 } from 'react-icons/bs';

const UploadPage: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [detectedUsers, setDetectedUsers] = useState<string[]>([]);
  const [parsingStep, setParsingStep] = useState<'upload' | 'select-user' | 'parsing'>('upload');
  const { uploadChat, uploadProgress, loading, error } = useChat();
  const navigate = useNavigate();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.txt')) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    setSelectedFile(file);
    
    // Quick pre-parse to detect users
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(0, 100); // Just check first 100 lines
      
      // Simple regex to extract user names
      const userSet = new Set<string>();
      const userRegex = /\[\d{2}\/\d{2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M\] ([^:]+):/;
      
      lines.forEach(line => {
        const match = line.match(userRegex);
        if (match && match[1]) {
          userSet.add(match[1].trim());
        }
      });
      
      setDetectedUsers(Array.from(userSet));
      setParsingStep('select-user');
    };
    
    reader.readAsText(file);
  };

  const handleUserSelect = (user: string) => {
    setSelectedUser(user);
  };

  const handleContinue = async () => {
    if (!selectedFile || !selectedUser) return;
    
    setParsingStep('parsing');
    try {
      const result = await uploadChat(selectedFile, selectedUser);
      navigate(`/chat/${result.id}`);
    } catch (err) {
      console.error('Error processing chat:', err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center">
          <BsWhatsapp className="text-green-500 text-5xl mb-4" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">WhatsApp Memory Vault</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Transform your WhatsApp chat into a beautiful, interactive diary
        </p>
      </div>

      {parsingStep === 'upload' && (
        <div 
          className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors
            ${isDragging ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <BsUpload className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
            Drag & drop your WhatsApp export file
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">
            or select a file from your computer
          </p>
          
          <input
            type="file"
            id="chat-file"
            accept=".txt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
          />
          <label 
            htmlFor="chat-file"
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 cursor-pointer transition-colors"
          >
            Select File
          </label>
          
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Supported format: .txt WhatsApp export file</p>
            <p>Your data stays on your device - nothing is uploaded to servers</p>
          </div>
        </div>
      )}

      {parsingStep === 'select-user' && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">
            Who are you in this conversation?
          </h3>
          
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {detectedUsers.map((user) => (
              <button
                key={user}
                onClick={() => handleUserSelect(user)}
                className={`p-3 text-left rounded-md transition-colors ${
                  selectedUser === user 
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {user}
                {selectedUser === user && (
                  <BsCheck2 className="ml-2 inline" />
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setParsingStep('upload')}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md"
            >
              Back
            </button>
            
            <button
              onClick={handleContinue}
              disabled={!selectedUser}
              className={`px-4 py-2 rounded-md ${
                selectedUser 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {parsingStep === 'parsing' && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">
            Processing your chat
          </h3>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-6">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 text-center">
            {uploadProgress < 30 && 'Analyzing chat structure...'}
            {uploadProgress >= 30 && uploadProgress < 60 && 'Parsing messages...'}
            {uploadProgress >= 60 && uploadProgress < 90 && 'Processing sentiment...'}
            {uploadProgress >= 90 && 'Finalizing...'}
          </p>
          
          {error && (
            <p className="text-red-500 mt-4 text-center">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadPage;