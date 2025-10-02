import { Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: Record<string, string[]>;
}

export const FileUploader = ({ onFileSelect, acceptedTypes }: FileUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    multiple: false,
  });

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card className="p-8 border-2 border-dashed transition-all duration-300 hover:shadow-card">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`cursor-pointer text-center transition-all duration-300 ${
            isDragActive ? "scale-105 opacity-80" : ""
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center animate-glow">
              <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold mb-1">
                {isDragActive ? "Drop your file here" : "Drag & drop your file"}
              </p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between py-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center">
              <Upload className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFile}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
    </Card>
  );
};
