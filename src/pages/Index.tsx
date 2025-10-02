import { useState } from "react";
import { FileCategory, CategorySelector } from "@/components/CategorySelector";
import { FileUploader } from "@/components/FileUploader";
import { FormatSelector } from "@/components/FormatSelector";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>("image");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState("PNG");
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const acceptedTypesByCategory: Record<FileCategory, Record<string, string[]>> = {
    image: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".bmp", ".tiff", ".ico", ".heic"] },
    video: { "video/*": [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv", ".m4v", ".3gp"] },
    audio: { "audio/*": [".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a", ".wma", ".aiff"] },
    document: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc", ".docx"],
      "text/*": [".txt", ".md", ".html", ".rtf"],
      "application/vnd.oasis.opendocument.text": [".odt"],
      "application/epub+zip": [".epub"],
    },
  };

  const handleCategoryChange = (category: FileCategory) => {
    setSelectedCategory(category);
    setSelectedFiles([]);
    // Set default format for each category
    const defaultFormats: Record<FileCategory, string> = {
      image: "PNG",
      video: "MP4",
      audio: "MP3",
      document: "PDF",
    };
    setOutputFormat(defaultFormats[category]);
  };

  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to convert",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);

    try {
      // Placeholder for actual conversion logic
      // In a real app, this would call a backend service
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate converted files
      const convertedFiles: { name: string; data: Blob }[] = selectedFiles.map((file) => ({
        name: file.name.replace(/\.[^/.]+$/, `.${outputFormat.toLowerCase()}`),
        data: new Blob([file], { type: file.type }),
      }));

      // If multiple files, create a zip
      if (convertedFiles.length > 1) {
        const zip = new JSZip();
        convertedFiles.forEach((file) => {
          zip.file(file.name, file.data);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `converted_files_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Conversion complete!",
          description: `${selectedFiles.length} files converted and downloaded as ZIP`,
        });
      } else {
        // Single file download
        const url = URL.createObjectURL(convertedFiles[0].data);
        const link = document.createElement("a");
        link.href = url;
        link.download = convertedFiles[0].name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Conversion complete!",
          description: `File converted to ${outputFormat}`,
        });
      }
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: "An error occurred during conversion",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Fast & Secure</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Universal File Converter
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Convert images, videos, audio files, and documents instantly with our powerful
              online tool
            </p>
          </div>

          {/* Category Selection */}
          <div className="mb-8 animate-slide-up">
            <h2 className="text-2xl font-semibold mb-6 text-center">Choose File Type</h2>
            <CategorySelector
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Main Converter Area */}
          <div className="max-w-3xl mx-auto space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {/* File Upload */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Upload Files</h3>
              <FileUploader
                onFilesSelect={handleFilesSelect}
                acceptedTypes={acceptedTypesByCategory[selectedCategory]}
              />
            </div>

            {/* Format Selection */}
            {selectedFiles.length > 0 && (
              <div className="animate-scale-in">
                <FormatSelector
                  category={selectedCategory}
                  selectedFormat={outputFormat}
                  onFormatChange={setOutputFormat}
                />
              </div>
            )}

            {/* Convert Button */}
            {selectedFiles.length > 0 && (
              <div className="animate-scale-in space-y-3">
                {selectedFiles.length > 1 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <Package className="w-4 h-4 text-accent" />
                    <p className="text-sm font-medium text-accent">
                      Multiple files will be downloaded as a ZIP archive
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="flex-1 h-12 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
                  >
                    {isConverting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Converting {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Convert & Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl hover:shadow-card transition-shadow">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Convert files in seconds with our optimized processing
            </p>
          </div>
          <div className="text-center p-6 rounded-xl hover:shadow-card transition-shadow">
            <div className="w-12 h-12 bg-gradient-accent rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Multiple Formats</h3>
            <p className="text-sm text-muted-foreground">
              Support for all major file formats across categories
            </p>
          </div>
          <div className="text-center p-6 rounded-xl hover:shadow-card transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">
              Your files are processed securely and deleted after conversion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
