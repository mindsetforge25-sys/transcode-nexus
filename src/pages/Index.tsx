import { useState } from "react";
import { FileCategory, CategorySelector } from "@/components/CategorySelector";
import { FileUploader } from "@/components/FileUploader";
import { FormatSelector } from "@/components/FormatSelector";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState("PNG");
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const acceptedTypesByCategory: Record<FileCategory, Record<string, string[]>> = {
    image: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"] },
    video: { "video/*": [".mp4", ".avi", ".mov", ".mkv", ".webm"] },
    audio: { "audio/*": [".mp3", ".wav", ".ogg", ".aac", ".flac"] },
    document: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc", ".docx"],
      "text/*": [".txt", ".md", ".html"],
    },
  };

  const handleCategoryChange = (category: FileCategory) => {
    setSelectedCategory(category);
    setSelectedFile(null);
    // Set default format for each category
    const defaultFormats: Record<FileCategory, string> = {
      image: "PNG",
      video: "MP4",
      audio: "MP3",
      document: "PDF",
    };
    setOutputFormat(defaultFormats[category]);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to convert",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);

    try {
      // Placeholder for actual conversion logic
      // In a real app, this would call a backend service
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Conversion complete!",
        description: `Your file has been converted to ${outputFormat}`,
      });
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
              <h3 className="text-lg font-semibold mb-3">Upload File</h3>
              <FileUploader
                onFileSelect={handleFileSelect}
                acceptedTypes={acceptedTypesByCategory[selectedCategory]}
              />
            </div>

            {/* Format Selection */}
            {selectedFile && (
              <div className="animate-scale-in">
                <FormatSelector
                  category={selectedCategory}
                  selectedFormat={outputFormat}
                  onFormatChange={setOutputFormat}
                />
              </div>
            )}

            {/* Convert Button */}
            {selectedFile && (
              <div className="flex gap-3 animate-scale-in">
                <Button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="flex-1 h-12 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
                >
                  {isConverting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Convert File
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-6"
                  disabled={isConverting}
                >
                  <Download className="w-5 h-5" />
                </Button>
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
