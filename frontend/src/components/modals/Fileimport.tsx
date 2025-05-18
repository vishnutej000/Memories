interface FileImportProps {
  onImport: (file: File) => Promise<void>
  isLoading: boolean
}

export default function FileImport({ onImport, isLoading }: FileImportProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await onImport(file)
  }

  return (
    <div className="flex items-center justify-center h-full">
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mb-2 text-sm text-gray-500">
            {isLoading ? 'Processing...' : 'Click to upload WhatsApp export'}
          </p>
          <p className="text-xs text-gray-500">.txt file only</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".txt" 
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>
    </div>
  )
}