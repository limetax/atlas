import React from 'react';
import { Upload, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type FileUploadProps = {
  onFileSelect?: (file: File) => void;
};

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
        <Card className="border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200">
          <label className="flex items-center justify-center gap-2 px-4 py-3 cursor-pointer">
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Dokument hochladen (PDF, DOCX)</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
            />
          </label>
        </Card>
      ) : (
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="h-6 w-6 hover:bg-orange-100"
            >
              <X className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </Card>
      )}
      <p className="text-xs text-gray-400 mt-2">⚠️ Nur UI-Demo - keine tatsächliche Verarbeitung</p>
    </div>
  );
};
