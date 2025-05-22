import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Spinner from '../UI/Spinner';
import Button from '../UI/Button';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  pdfUrl: string;
  onClose: () => void;
  onDownload: () => void;
  filename: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ pdfUrl, onClose, onDownload, filename }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Handle document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };
  
  // Handle document load error
  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  };
  
  // Navigation functions
  const previousPage = () => {
    setPageNumber(prevPage => Math.max(prevPage - 1, 1));
  };
  
  const nextPage = () => {
    setPageNumber(prevPage => Math.min(prevPage + 1, numPages || 1));
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            PDF Preview: {filename}
          </h3>
          
          <div className="flex space-x-2">
            <Button
              onClick={onDownload}
              variant="primary"
              size="small"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              Download
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="large" text="Loading PDF..." />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-800 dark:text-gray-200 mb-4">{error}</p>
            <Button onClick={onClose} variant="secondary">Close</Button>
          </div>
        ) : (
          <div className="pdf-document flex flex-col items-center">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<Spinner size="large" text="Loading page..." />}
              error={<div className="text-red-500">Failed to load document</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                className="pdf-page shadow-md mb-4"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        )}
      </div>
      
      {!isLoading && !error && numPages && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {pageNumber} of {numPages}
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={previousPage}
              disabled={pageNumber <= 1}
              variant="secondary"
              size="small"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            >
              Previous
            </Button>
            
            <Button
              onClick={nextPage}
              disabled={pageNumber >= (numPages || 1)}
              variant="secondary"
              size="small"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFPreview;