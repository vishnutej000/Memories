import React, { useState } from 'react';
import { WhatsAppChat, ExportOptions as ExportOptionsType } from '../../types';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../UI/Button';
import Spinner from '../UI/Spinner';
import { formatDate } from '../../utils/date.Utils';

// Mock function for actual export logic (would be implemented in service)
const exportChat = async (chat: WhatsAppChat, options: ExportOptionsType): Promise<{ url: string; filename: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filename = `${chat.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.${options.format}`;
      const url = URL.createObjectURL(new Blob(['Mock export content'], { type: 'text/plain' }));
      resolve({ url, filename });
    }, 1500);
  });
};

interface ExportOptionsProps {
  chat: WhatsAppChat;
  onClose: () => void;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ chat, onClose }) => {
  const { darkMode } = useTheme();
  const [format, setFormat] = useState<ExportOptionsType['format']>('html');
  const [includeMedia, setIncludeMedia] = useState(false);
  const [includeJournalEntries, setIncludeJournalEntries] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: chat.startDate.split('T')[0],
    end: chat.endDate.split('T')[0]
  });
  const [redactedMode, setRedactedMode] = useState(false);
  const [redactedSenders, setRedactedSenders] = useState<string[]>([]);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ url: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Handle format change
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value as ExportOptionsType['format']);
  };
  
  // Handle redacted senders change
  const handleSenderToggle = (sender: string) => {
    setRedactedSenders(prev => {
      if (prev.includes(sender)) {
        return prev.filter(s => s !== sender);
      } else {
        return [...prev, sender];
      }
    });
  };
  
  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      
      const options: ExportOptionsType = {
        chatId: chat.id,
        format,
        includeMedia,
        dateRange,
        includeJournalEntries,
        redactedMode,
        redactedSenders,
        theme: darkMode ? 'dark' : 'light'
      };
      
      const result = await exportChat(chat, options);
      setExportResult(result);
    } catch (err) {
      console.error('Error exporting chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to export chat');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div>
      {exportResult ? (
        // Export success screen
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Export Ready
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your export is ready for download. Click the button below to download the file.
          </p>
          
          <a
            href={exportResult.url}
            download={exportResult.filename}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-whatsapp-dark hover:bg-whatsapp-teal focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp-dark"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download {exportResult.filename}
          </a>
          
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Note: This link will only be valid until you close this dialog.
          </p>
        </div>
      ) : (
        // Export options form
        <form className="space-y-4">
          {/* Export format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Export Format
            </label>
            <select
              value={format}
              onChange={handleFormatChange}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-whatsapp-dark focus:border-whatsapp-dark text-gray-900 dark:text-white"
            >
              <option value="html">HTML (.html)</option>
              <option value="txt">Plain Text (.txt)</option>
              <option value="pdf">PDF Document (.pdf)</option>
              <option value="zip">ZIP Archive with Media (.zip)</option>
            </select>
          </div>
          
          {/* Date range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  min={chat.startDate.split('T')[0]}
                  max={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-whatsapp-dark focus:border-whatsapp-dark text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  min={dateRange.start}
                  max={chat.endDate.split('T')[0]}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-whatsapp-dark focus:border-whatsapp-dark text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Selected range: {formatDate(dateRange.start)} to {formatDate(dateRange.end)}
            </p>
          </div>
          
          {/* Include options */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="include-media"
                type="checkbox"
                checked={includeMedia}
                onChange={() => setIncludeMedia(!includeMedia)}
                className="h-4 w-4 text-whatsapp-dark focus:ring-whatsapp-dark border-gray-300 rounded"
                disabled={format !== 'zip'}
              />
              <label htmlFor="include-media" className={`ml-2 block text-sm text-gray-700 dark:text-gray-300 ${format !== 'zip' ? 'opacity-50' : ''}`}>
                Include media files (only available for ZIP format)
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="include-journal"
                type="checkbox"
                checked={includeJournalEntries}
                onChange={() => setIncludeJournalEntries(!includeJournalEntries)}
                className="h-4 w-4 text-whatsapp-dark focus:ring-whatsapp-dark border-gray-300 rounded"
              />
              <label htmlFor="include-journal" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Include journal entries
              </label>
            </div>
          </div>
          
          {/* Privacy options */}
          <div>
            <div className="flex items-center mb-2">
              <input
                id="redacted-mode"
                type="checkbox"
                checked={redactedMode}
                onChange={() => setRedactedMode(!redactedMode)}
                className="h-4 w-4 text-whatsapp-dark focus:ring-whatsapp-dark border-gray-300 rounded"
              />
              <label htmlFor="redacted-mode" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Redacted Mode (anonymize participants)
              </label>
            </div>
            
            {redactedMode && (
              <div className="mt-2 ml-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Select participants to anonymize:
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {chat.participants.map(participant => (
                    <div key={participant} className="flex items-center">
                      <input
                        id={`sender-${participant}`}
                        type="checkbox"
                        checked={redactedSenders.includes(participant)}
                        onChange={() => handleSenderToggle(participant)}
                        className="h-4 w-4 text-whatsapp-dark focus:ring-whatsapp-dark border-gray-300 rounded"
                      />
                      <label htmlFor={`sender-${participant}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {participant}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="text-red-500 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end pt-2 space-x-3">
            <Button
              onClick={onClose}
              variant="secondary"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="primary"
              icon={isExporting ? <Spinner size="small" color="white" /> : undefined}
            >
              {isExporting ? 'Exporting...' : 'Export Chat'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ExportOptions;