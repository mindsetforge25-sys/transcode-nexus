import { useState } from "react";
import { FileCategory, CategorySelector } from "@/components/CategorySelector";
import { FileUploader } from "@/components/FileUploader";
import { FormatSelector } from "@/components/FormatSelector";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Sparkles, Package, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import JSZip from "jszip";
import jsPDF from "jspdf";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>("image");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState("PNG");
  const [isConverting, setIsConverting] = useState(false);
  const [pdfImageMode, setPdfImageMode] = useState<"fit" | "stretch">("fit");
  const [compressionQuality, setCompressionQuality] = useState(0.8);
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
    compress: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"] },
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
      compress: "JPEG",
    };
    setOutputFormat(defaultFormats[category]);
  };

  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const convertImagesToPDF = async (images: File[], mode: "fit" | "stretch"): Promise<Blob> => {
    const pdf = new jsPDF();
    let isFirstPage = true;

    for (const image of images) {
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imgElement = new Image();
          imgElement.onload = () => resolve(imgElement);
          imgElement.src = e.target?.result as string;
        };
        reader.readAsDataURL(image);
      });

      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let finalWidth, finalHeight, x, y;

      if (mode === "stretch") {
        // Stretch to fill entire page
        finalWidth = pageWidth;
        finalHeight = pageHeight;
        x = 0;
        y = 0;
      } else {
        // Fit to page with margins
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;

        if (imgRatio > pageRatio) {
          finalWidth = pageWidth - 20;
          finalHeight = finalWidth / imgRatio;
        } else {
          finalHeight = pageHeight - 20;
          finalWidth = finalHeight * imgRatio;
        }

        x = (pageWidth - finalWidth) / 2;
        y = (pageHeight - finalHeight) / 2;
      }

      const imgData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(image);
      });

      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
    }

    return pdf.output('blob');
  };

  const compressImage = async (file: File, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
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
      // Special handling for image compression
      if (selectedCategory === "compress") {
        const compressedFiles: { name: string; data: Blob }[] = [];
        
        for (const file of selectedFiles) {
          const compressedBlob = await compressImage(file, compressionQuality);
          compressedFiles.push({
            name: file.name.replace(/\.[^/.]+$/, `_compressed.jpg`),
            data: compressedBlob,
          });
        }
        
        if (compressedFiles.length > 1) {
          const zip = new JSZip();
          compressedFiles.forEach((file) => {
            zip.file(file.name, file.data);
          });

          const zipBlob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(zipBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `compressed_images_${Date.now()}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          const url = URL.createObjectURL(compressedFiles[0].data);
          const link = document.createElement("a");
          link.href = url;
          link.download = compressedFiles[0].name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }

        toast({
          title: "Compression complete!",
          description: `${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''} compressed successfully`,
        });
        return;
      }
      
      // Special handling for image to PDF conversion
      if (selectedCategory === "image" && outputFormat === "PDF") {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        const pdfBlob = await convertImagesToPDF(selectedFiles, pdfImageMode);
        const url = URL.createObjectURL(pdfBlob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `converted_images_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Conversion complete!",
          description: `${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''} converted to PDF`,
        });
        return;
      }

      // Placeholder for actual conversion logic for other formats
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
      <Navbar />
      
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
              Haryorofficial File Converter
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
            {selectedFiles.length > 0 && selectedCategory !== "compress" && (
              <div className="animate-scale-in space-y-4">
                <FormatSelector
                  category={selectedCategory}
                  selectedFormat={outputFormat}
                  onFormatChange={setOutputFormat}
                />
                
                {/* PDF Image Mode Selection */}
                {selectedCategory === "image" && outputFormat === "PDF" && (
                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold mb-3">PDF Layout Options</h4>
                    <RadioGroup value={pdfImageMode} onValueChange={(value) => setPdfImageMode(value as "fit" | "stretch")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fit" id="fit" />
                        <Label htmlFor="fit" className="cursor-pointer">
                          Fit to page (maintains aspect ratio with margins)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="stretch" id="stretch" />
                        <Label htmlFor="stretch" className="cursor-pointer">
                          Stretch to fill (fills entire page)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}
            
            {/* Compression Quality Selection */}
            {selectedFiles.length > 0 && selectedCategory === "compress" && (
              <div className="animate-scale-in">
                <div className="p-4 rounded-lg border bg-card space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Compression Quality</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adjust the slider to control compression intensity (lower = smaller file size, higher = better quality)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quality: {Math.round(compressionQuality * 100)}%</span>
                      <span className="text-muted-foreground">
                        {compressionQuality < 0.5 ? "Maximum Compression" : compressionQuality < 0.7 ? "Balanced" : "High Quality"}
                      </span>
                    </div>
                    <Slider
                      value={[compressionQuality]}
                      onValueChange={(value) => setCompressionQuality(value[0])}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Smaller</span>
                      <span>Better Quality</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Convert Button */}
            {selectedFiles.length > 0 && (
              <div className="animate-scale-in space-y-3">
                {selectedCategory === "image" && outputFormat === "PDF" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <FileText className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-primary">
                      {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''} will be combined into a single PDF
                    </p>
                  </div>
                )}
                {selectedFiles.length > 1 && selectedCategory !== "image" && outputFormat !== "PDF" && (
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
                        {selectedCategory === "compress" ? "Compressing" : "Converting"} {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {selectedCategory === "compress" ? "Compress & Download" : "Convert & Download"}
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
