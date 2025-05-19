import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { ExportService } from '../api/export.service';
import { ExportOptions } from '../types/export.types';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorMessage from '../components/common/ErrorMessage';
import { BsFilePdf, BsDownload, BsEye, BsCheck2, BsX, BsFileZip } from 'react-icons/bs';

const ExportPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { metadata, loading: chatLoading, error: chatError } = useChat(chatId);
  
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadType, setDownloadType] = useState<'pdf' | 'zip'>('pdf');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    include_media: true,
    include_system_messages: false,
    redact_mode: false,
    redacted_users: [],
    start_date: '',
    end_date: '',
    style: 'whatsapp',
    page_size: 'a4',
    include_sentiment: true,
    include_qr_codes: true,
  });

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    setExportOptions(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const generatePreview = async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const previewHtml = await ExportService.previewPdf(chatId, exportOptions);
      
      // Create a blob and object URL for the preview
      const blob = new Blob([previewHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);
    } catch (err: any) {
      console.error('Error generating PDF preview:', err);
      setError(err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (downloadType === 'pdf') {
        const pdfBlob = await ExportService.exportToPdf(chatId, exportOptions);
        
        // Create download link and trigger download
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-export-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const zipBlob = await ExportService.exportSession(chatId);
        
        // Create download link and trigger download
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `memory-vault-${chatId}-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Error downloading export:', err);
      setError(err.message || 'Failed to download export');
    } finally {
      setLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            No chat selected
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Please select a chat from the sidebar or upload a new chat.
          </p>
        </div>
      </div>
    );
  }

  if (chatLoading) {
    return <LoadingScreen message="Loading export options..." />;
  }

  if (chatError) {
    return <ErrorMessage message={chatError} />;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Export Conversation
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create a PDF or backup your entire chat session
          </p>
          
          <div className="mt-4">
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
              <button
                onClick={() => setDownloadType('pdf')}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
                  downloadType === 'pdf'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <BsFilePdf />
                PDF Export
              </button>
              <button
                onClick={() => setDownloadType('zip')}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
                  downloadType === 'zip'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <BsFileZip />
                Backup (.zip)
              </button>
            </div>
          </div>
        </div>
        
        {downloadType === 'pdf' ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            {previewUrl ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                    Preview
                  </h3>
                  <button
                    onClick={closePreview}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                  >
                    <BsX className="text-xl" />
                  </button>
                </div>
                <iframe
                  src={previewUrl}
                  className="w-full h-96 border border-gray-200 dark:border-gray-700 rounded"
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                    Content Options
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include_media"
                        name="include_media"
                        checked={exportOptions.include_media}
                        onChange={handleOptionChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="include_media" className="ml-2 text-gray-700 dark:text-gray-300">
                        Include Media
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include_system_messages"
                        name="include_system_messages"
                        checked={exportOptions.include_system_messages}
                        onChange={handleOptionChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="include_system_messages" className="ml-2 text-gray-700 dark:text-gray-300">
                        Include System Messages
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include_sentiment"
                        name="include_sentiment"
                        checked={exportOptions.include_sentiment}
                        onChange={handleOptionChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="include_sentiment" className="ml-2 text-gray-700 dark:text-gray-300">
                        Include Sentiment Analysis
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include_qr_codes"
                        name="include_qr_codes"
                        checked={exportOptions.include_qr_codes}
                        onChange={handleOptionChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="include_qr_codes" className="ml-2 text-gray-700 dark:text-gray-300">
                        Include QR Codes for Audio Notes
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="redact_mode"
                        name="redact_mode"
                        checked={exportOptions.redact_mode}
                        onChange={handleOptionChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="redact_mode" className="ml-2 text-gray-700 dark:text-gray-300">
                        Enable Redaction Mode
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                    Formatting Options
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="style" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Style
                      </label>
                      <select
                        id="style"
                        name="style"
                        value={exportOptions.style}
                        onChange={handleOptionChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="whatsapp">WhatsApp Style</option>
                        <option value="minimal">Minimal</option>
                        <option value="print">Print-friendly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="page_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Page Size
                      </label>
                      <select
                        id="page_size"
                        name="page_size"
                        value={exportOptions.page_size}
                        onChange={handleOptionChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                        <option value="legal">Legal</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date (Optional)
                      </label>
                      <input
                        type="date"
                        id="start_date"
                        name="start_date"
                        value={exportOptions.start_date}
                        onChange={handleOptionChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        id="end_date"
                        name="end_date"
                        value={exportOptions.end_date}
                        onChange={handleOptionChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              {previewUrl ? (
                <button
                  onClick={downloadExport}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Downloading...' : (
                    <>
                      <BsDownload className="mr-2" />
                      Download PDF
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={generatePreview}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : (
                      <>
                        <BsEye className="mr-2" />
                        Preview
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={downloadExport}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Downloading...' : (
                      <>
                        <BsDownload className="mr-2" />
                        Download PDF
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
            <div className="text-6xl text-gray-300 dark:text-gray-600 mb-4">
              <BsFileZip className="mx-auto" />
            </div>
            
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              Download Complete Backup
            </h3>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This will download a ZIP file containing all chat messages, media, 
              diary entries, and voice notes for this conversation. You can use this 
              to restore your data later or transfer it to another device.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <button
              onClick={downloadExport}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Downloading...' : (
                <>
                  <BsDownload className="mr-2" />
                  Download Complete Backup
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportPage;