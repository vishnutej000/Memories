import React, { useState, useCallback } from 'react';
import { WhatsAppChat } from '../../types';
import { uploadChatFile } from '../../services/whatsappServices';
import Button from '../UI/Button';
import Spinner from '../UI/Spinner';

interface WhatsAppUploaderProps {
  onUploadComplete: (chat: WhatsAppChat) => void;
  onError?: (error: string) => void;
}

const WhatsAppUploader: React.FC<WhatsAppUploaderProps> = ({
  onUploadComplete,
  onError
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['.txt', '.zip'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      const error = 'Invalid file type. Please upload a WhatsApp export (.txt) or archive (.zip) file.';
      onError?.(error);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload and parse the chat file
      const chat = await uploadChatFile(file, (progress) => {
        setUploadProgress(progress);
      });

      // Call completion callback
      onUploadComplete(chat);
      
      // Reset state
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete, onError]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  if (isUploading) {
    return (
      <div className="text-center p-8">
        <Spinner size="large" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Uploading and processing your chat...
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
          <div 
            className="bg-whatsapp-teal h-2 rounded-full transition-all duration-300" 
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {uploadProgress}% complete
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-whatsapp-teal bg-whatsapp-teal/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-whatsapp-teal/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Upload WhatsApp Chat Export
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Drag and drop your WhatsApp export file here, or click to select
        </p>
        
        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <p>Supported formats: .txt, .zip</p>
          <p>Maximum file size: 100MB</p>
        </div>

        <input
          type="file"
          accept=".txt,.zip"
          onChange={handleInputChange}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
          <label htmlFor="file-upload">
          <Button
            variant="primary"
            size="medium"
            disabled={isUploading}
            className="cursor-pointer"
          >
            Choose File
          </Button>
        </label>
        
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p>
            To export your WhatsApp chat: Open WhatsApp → Chat → Menu → More → Export Chat
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppUploader;
