import React from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect?.(file);
    }
  };
  
  const handleRemove = () => {
    setSelectedFile(null);
  };
  
  return (
    <div className="w-full">
      {!selectedFile ? (
        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all duration-200">
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            Dokument hochladen (PDF, DOCX)
          </span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
          </div>
          <button
            onClick={handleRemove}
            className="p-1 hover:bg-orange-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">
        ⚠️ Nur UI-Demo - keine tatsächliche Verarbeitung
      </p>
    </div>
  );
};

