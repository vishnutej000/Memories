import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/usechat';
import { BsUpload, BsCloudUpload, BsFileEarmark, BsTrash, BsCheckCircle } from 'react-icons/bs';

const UploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [userIdentifier, setUserIdentifier] = useState<string>('You');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadChat, uploadProgress, loading } = useChat();
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFile = e.dataTransfer.files[0];
      validateAndSetFile(newFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFile = e.target.files[0];
      validateAndSetFile(newFile);
    }
  };

  const validateAndSetFile = (newFile: File) => {
    setUploadError(null);
    
    // Check file size (limit to 50MB)
    if (newFile.size > 50 * 1024 * 1024) {
      setUploadError('File size exceeds the maximum limit of 50MB.');
      return;
    }
    
    // Check file extension/type
    const validExtensions = ['.txt', '.json', '.csv', '.html'];
    const extension = newFile.name.substring(newFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      setUploadError(`Invalid file type. Please upload a ${validExtensions.join(', ')} file.`);
      return;
    }
    
    setFile(newFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }
    
    try {
      const result = await uploadChat(file, userIdentifier);
      
      // Redirect to the chat page after successful upload
      navigate(`/chat/${result.id}`);
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload file. Please try again.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        Upload WhatsApp Chat
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Name in the Chat (as appears in messages)
          </label>
          <input
            type="text"
            value={userIdentifier}
            onChange={(e) => setUserIdentifier(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g. You, John, etc."
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This helps identify your messages in the chat visualization
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            WhatsApp Chat Export File
          </label>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragActive 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                : file 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.json,.csv,.html"
            />
            
            {file ? (
              <div className="flex flex-col items-center">
                <BsCheckCircle className="text-green-500 text-3xl mb-2" />
                <div className="flex items-center">
                  <BsFileEarmark className="text-gray-400 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="mt-2 text-red-500 dark:text-red-400 text-sm flex items-center"
                >
                  <BsTrash className="mr-1" /> Remove
                </button>
              </div>
            ) : (
              <>
                <BsCloudUpload className="text-gray-400 dark:text-gray-500 text-4xl mb-3" />
                <p className="text-gray-700 dark:text-gray-300 text-center mb-1">
                  Drag and drop your WhatsApp chat file here
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  Or click to browse files
                </p>
              </>
            )}
          </div>
          
          {uploadError && (
            <div className="text-red-500 dark:text-red-400 text-sm mt-2">
              {uploadError}
            </div>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            How to export a WhatsApp chat: Open WhatsApp &gt; Open a chat &gt; Tap the three dots &gt; More &gt; Export chat &gt; Choose "Without Media"
          </p>
        </div>
        
        {loading && uploadProgress > 0 && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
              {uploadProgress < 100 ? 'Uploading...' : 'Processing chat...'}
              {uploadProgress}%
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!file || loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <BsUpload className="mr-2" />
            {loading ? 'Uploading...' : 'Upload Chat'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;