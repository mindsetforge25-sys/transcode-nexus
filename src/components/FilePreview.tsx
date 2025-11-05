import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { FileIcon } from "lucide-react";

interface FilePreviewProps {
  file: File | null;
  open: boolean;
  onClose: () => void;
}

export const FilePreview = ({ file, open, onClose }: FilePreviewProps) => {
  if (!file) return null;

  const isImage = file.type.startsWith("image/");
  const isPDF = file.type === "application/pdf";
  const fileUrl = URL.createObjectURL(file);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            {file.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {(file.size / 1024).toFixed(2)} KB
          </p>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] w-full rounded-lg border border-border">
          <div className="p-4 flex items-center justify-center min-h-full bg-secondary/20">
            {isImage && (
              <img
                src={fileUrl}
                alt={file.name}
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            )}
            {isPDF && (
              <iframe
                src={fileUrl}
                className="w-full h-[60vh] rounded-lg"
                title={file.name}
              />
            )}
            {!isImage && !isPDF && (
              <div className="text-center space-y-3 p-8">
                <FileIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Preview not available for this file type
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
