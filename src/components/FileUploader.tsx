import { Upload, X, File as FileIcon, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

interface FileUploaderProps {
  onFilesSelect: (files: File[]) => void;
  acceptedTypes?: Record<string, string[]>;
}

export const FileUploader = ({ onFilesSelect, acceptedTypes }: FileUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const newFiles = [...selectedFiles, ...acceptedFiles];
      setSelectedFiles(newFiles);
      onFilesSelect(newFiles);
    }
  }, [onFilesSelect, selectedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelect(newFiles);
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    onFilesSelect([]);
  };

  const openFileDialog = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = Object.values(acceptedTypes || {}).flat().join(',');
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const newFiles = Array.from(target.files);
        const allFiles = [...selectedFiles, ...newFiles];
        setSelectedFiles(allFiles);
        onFilesSelect(allFiles);
      }
    };
    input.click();
  };

  return (
    <Card className="p-8 border-2 border-dashed transition-all duration-300 hover:shadow-card">
      {selectedFiles.length === 0 ? (
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
                {isDragActive ? "Drop your files here" : "Drag & drop your files"}
              </p>
              <p className="text-sm text-muted-foreground">or click to browse • Multiple files supported</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openFileDialog}
                className="hover:bg-primary/10 hover:text-primary hover:border-primary"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add More
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFiles}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
};
