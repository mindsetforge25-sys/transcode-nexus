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
    <Card className="p-10 border border-border bg-card shadow-card transition-all duration-300 hover:shadow-elevated">
      {selectedFiles.length === 0 ? (
        <div
          {...getRootProps()}
          className={`cursor-pointer text-center transition-all duration-300 ${
            isDragActive ? "scale-[0.98]" : ""
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-6 py-12">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center border-2 border-accent/20">
              <Upload className="w-10 h-10 text-accent" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">
                {isDragActive ? "Drop files here" : "Upload your files"}
              </p>
              <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <p className="font-semibold text-foreground">{selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openFileDialog}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFiles}
                className="text-muted-foreground hover:text-destructive"
              >
                Clear
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[220px] pr-3">
            <div className="space-y-2.5">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-border/40">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/20">
                      <FileIcon className="w-5 h-5 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-foreground text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="hover:text-destructive flex-shrink-0 h-8 w-8"
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
