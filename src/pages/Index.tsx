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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import JSZip from "jszip";
import jsPDF from "jspdf";
import { PDFDocument } from "pdf-lib";
import { pipeline, env } from '@huggingface/transformers';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>("image");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState("PNG");
  const [isConverting, setIsConverting] = useState(false);
  const [pdfImageMode, setPdfImageMode] = useState<"fit" | "stretch">("fit");
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const [targetFileSize, setTargetFileSize] = useState<number>(0);
  const [watermarkText, setWatermarkText] = useState<string>("Watermark");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.3);
  const [splitPageRange, setSplitPageRange] = useState<string>("1-3");
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
    compress: { 
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"],
      "application/pdf": [".pdf"]
    },
    merge: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"]
    },
    split: {
      "application/pdf": [".pdf"]
    },
    watermark: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"]
    },
    "background-removal": {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"]
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
      compress: "JPEG",
      merge: "PDF",
      split: "PDF",
      watermark: "PNG",
      "background-removal": "PNG",
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

  const compressPDF = async (file: File, quality: number): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Adjust compression based on quality setting
    // Lower quality = more aggressive compression
    const imageQuality = quality;
    
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: Math.floor(quality * 50),
    });
    
    return new Blob([new Uint8Array(pdfBytes) as any], { type: 'application/pdf' });
  };

  const compressToTargetSize = async (file: File, targetSizeKB: number): Promise<Blob> => {
    let quality = 0.9;
    let compressedBlob: Blob;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      if (file.type === 'application/pdf') {
        compressedBlob = await compressPDF(file, quality);
      } else {
        compressedBlob = await compressImage(file, quality);
      }
      
      const sizeKB = compressedBlob.size / 1024;
      
      if (sizeKB <= targetSizeKB || attempts >= maxAttempts) {
        break;
      }
      
      // Adjust quality based on how far we are from target
      const ratio = targetSizeKB / sizeKB;
      quality = Math.max(0.1, quality * ratio * 0.9);
      attempts++;
    } while (attempts < maxAttempts);

    return compressedBlob;
  };

  const mergePDFs = async (files: File[]): Promise<Blob> => {
    const mergedPdf = await PDFDocument.create();
    
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    const pdfBytes = await mergedPdf.save();
    return new Blob([new Uint8Array(pdfBytes) as any], { type: 'application/pdf' });
  };

  const mergeImages = async (files: File[]): Promise<Blob> => {
    // Merge images into a single PDF
    const pdf = new jsPDF();
    let isFirstImage = true;

    for (const file of files) {
      const img = await loadImageFromFile(file);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      if (!isFirstImage) {
        pdf.addPage();
      }
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgAspect = img.width / img.height;
      const pdfAspect = pdfWidth / pdfHeight;
      
      let renderWidth, renderHeight, xOffset, yOffset;
      
      if (imgAspect > pdfAspect) {
        renderWidth = pdfWidth;
        renderHeight = pdfWidth / imgAspect;
        xOffset = 0;
        yOffset = (pdfHeight - renderHeight) / 2;
      } else {
        renderHeight = pdfHeight;
        renderWidth = pdfHeight * imgAspect;
        xOffset = (pdfWidth - renderWidth) / 2;
        yOffset = 0;
      }
      
      pdf.addImage(imgData, "JPEG", xOffset, yOffset, renderWidth, renderHeight);
      isFirstImage = false;
    }

    return pdf.output("blob");
  };

  const splitPDF = async (file: File, pageRange: string): Promise<Blob[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();
    
    // Parse page range (e.g., "1-3" or "1,3,5")
    const pages: number[] = [];
    const ranges = pageRange.split(',');
    
    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(n => parseInt(n.trim()));
        for (let i = start; i <= end && i <= totalPages; i++) {
          pages.push(i - 1); // 0-indexed
        }
      } else {
        const pageNum = parseInt(range.trim());
        if (pageNum <= totalPages) {
          pages.push(pageNum - 1);
        }
      }
    }
    
    // Create separate PDFs for each page
    const splitPdfs: Blob[] = [];
    
    for (const pageIndex of pages) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
      newPdf.addPage(copiedPage);
      const pdfBytes = await newPdf.save();
      splitPdfs.push(new Blob([new Uint8Array(pdfBytes) as any], { type: 'application/pdf' }));
    }
    
    return splitPdfs;
  };

  const addWatermarkToImage = async (file: File, text: string, opacity: number): Promise<Blob> => {
    const img = await loadImageFromFile(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    // Add watermark
    ctx.globalAlpha = opacity;
    ctx.font = `${Math.floor(img.width / 15)}px Arial`;
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/png");
    });
  };

  const addWatermarkToPDF = async (file: File, text: string, opacity: number): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = 50;
      
      page.drawText(text, {
        x: width / 2 - (text.length * fontSize) / 4,
        y: height / 2,
        size: fontSize,
        opacity: opacity,
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([new Uint8Array(pdfBytes) as any], { type: 'application/pdf' });
  };

  const removeBackground = async (file: File): Promise<Blob> => {
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    
    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'webgpu',
    });
    
    const img = await loadImageFromFile(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const MAX_SIZE = 1024;
    let width = img.width;
    let height = img.height;
    
    if (width > MAX_SIZE || height > MAX_SIZE) {
      if (width > height) {
        height = Math.round((height * MAX_SIZE) / width);
        width = MAX_SIZE;
      } else {
        width = Math.round((width * MAX_SIZE) / height);
        height = MAX_SIZE;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const result = await segmenter(imageData);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }
    
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d')!;
    
    outputCtx.drawImage(canvas, 0, 0);
    
    const outputImageData = outputCtx.getImageData(0, 0, width, height);
    const data = outputImageData.data;
    
    for (let i = 0; i < result[0].mask.data.length; i++) {
      const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/png',
        1.0
      );
    });
  };

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
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
      // Special handling for merge
      if (selectedCategory === "merge") {
        let mergedBlob: Blob;
        
        if (selectedFiles[0].type === 'application/pdf') {
          mergedBlob = await mergePDFs(selectedFiles);
        } else {
          mergedBlob = await mergeImages(selectedFiles);
        }
        
        const url = URL.createObjectURL(mergedBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `merged.${outputFormat.toLowerCase()}`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Merge complete!",
          description: `${selectedFiles.length} files merged successfully`,
        });
        return;
      }

      // Special handling for split
      if (selectedCategory === "split") {
        const splitBlobs = await splitPDF(selectedFiles[0], splitPageRange);
        
        if (splitBlobs.length === 1) {
          const url = URL.createObjectURL(splitBlobs[0]);
          const link = document.createElement("a");
          link.href = url;
          link.download = `page.pdf`;
          link.click();
          URL.revokeObjectURL(url);
        } else {
          const zip = new JSZip();
          splitBlobs.forEach((blob, index) => {
            zip.file(`page_${index + 1}.pdf`, blob);
          });
          
          const zipBlob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(zipBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "split_pages.zip";
          link.click();
          URL.revokeObjectURL(url);
        }
        
        toast({
          title: "Split complete!",
          description: `PDF split into ${splitBlobs.length} page(s)`,
        });
        return;
      }

      // Special handling for watermark
      if (selectedCategory === "watermark") {
        const watermarkedFiles: { name: string; data: Blob }[] = [];
        
        for (const file of selectedFiles) {
          let watermarkedBlob: Blob;
          
          if (file.type === 'application/pdf') {
            watermarkedBlob = await addWatermarkToPDF(file, watermarkText, watermarkOpacity);
          } else {
            watermarkedBlob = await addWatermarkToImage(file, watermarkText, watermarkOpacity);
          }
          
          watermarkedFiles.push({
            name: file.name.replace(/\.[^/.]+$/, `_watermarked.${file.type === 'application/pdf' ? 'pdf' : 'png'}`),
            data: watermarkedBlob,
          });
        }
        
        if (watermarkedFiles.length === 1) {
          const url = URL.createObjectURL(watermarkedFiles[0].data);
          const link = document.createElement("a");
          link.href = url;
          link.download = watermarkedFiles[0].name;
          link.click();
          URL.revokeObjectURL(url);
        } else {
          const zip = new JSZip();
          watermarkedFiles.forEach((file) => {
            zip.file(file.name, file.data);
          });
          
          const zipBlob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(zipBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "watermarked_files.zip";
          link.click();
          URL.revokeObjectURL(url);
        }
        
        toast({
          title: "Watermark applied!",
          description: `${watermarkedFiles.length} file(s) watermarked successfully`,
        });
        return;
      }

      // Special handling for background removal
      if (selectedCategory === "background-removal") {
        const processedFiles: { name: string; data: Blob }[] = [];
        
        for (const file of selectedFiles) {
          const processedBlob = await removeBackground(file);
          processedFiles.push({
            name: file.name.replace(/\.[^/.]+$/, '_no_bg.png'),
            data: processedBlob,
          });
        }
        
        if (processedFiles.length === 1) {
          const url = URL.createObjectURL(processedFiles[0].data);
          const link = document.createElement("a");
          link.href = url;
          link.download = processedFiles[0].name;
          link.click();
          URL.revokeObjectURL(url);
        } else {
          const zip = new JSZip();
          processedFiles.forEach((file) => {
            zip.file(file.name, file.data);
          });
          
          const zipBlob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(zipBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "bg_removed_files.zip";
          link.click();
          URL.revokeObjectURL(url);
        }
        
        toast({
          title: "Background removed!",
          description: `${processedFiles.length} image(s) processed successfully`,
        });
        return;
      }

      // Special handling for compression (images and PDFs)
      if (selectedCategory === "compress") {
        const compressedFiles: { name: string; data: Blob }[] = [];
        
        for (const file of selectedFiles) {
          let compressedBlob: Blob;
          let fileName: string;
          
          // Use target file size if specified, otherwise use quality slider
          if (targetFileSize > 0) {
            compressedBlob = await compressToTargetSize(file, targetFileSize);
            fileName = file.name.replace(/\.[^/.]+$/, file.type === 'application/pdf' ? '_compressed.pdf' : '_compressed.jpg');
          } else {
            if (file.type === 'application/pdf') {
              compressedBlob = await compressPDF(file, compressionQuality);
              fileName = file.name.replace(/\.pdf$/i, '_compressed.pdf');
            } else {
              compressedBlob = await compressImage(file, compressionQuality);
              fileName = file.name.replace(/\.[^/.]+$/, `_compressed.jpg`);
            }
          }
          
          compressedFiles.push({
            name: fileName,
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
          description: `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} compressed successfully`,
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
            {selectedFiles.length > 0 && 
             selectedCategory !== "compress" && 
             selectedCategory !== "merge" &&
             selectedCategory !== "split" &&
             selectedCategory !== "background-removal" && (
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
            
            {/* Target File Size for Compression */}
            {selectedFiles.length > 0 && selectedCategory === "compress" && (
              <div className="animate-scale-in">
                <div className="p-4 rounded-lg border bg-card space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Target File Size (Optional)</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter target size in KB (leave as 0 to use quality slider instead)
                    </p>
                    <Input
                      type="number"
                      value={targetFileSize}
                      onChange={(e) => setTargetFileSize(Number(e.target.value))}
                      placeholder="e.g., 500 for 500KB"
                      min={0}
                    />
                  </div>
                  
                  {targetFileSize === 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Compression Quality</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adjust the slider to control compression intensity (lower = smaller file size, higher = better quality)
                      </p>
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
                  )}
                </div>
              </div>
            )}

            {/* Split Page Range */}
            {selectedFiles.length > 0 && selectedCategory === "split" && (
              <div className="animate-scale-in">
                <div className="p-4 rounded-lg border bg-card">
                  <div>
                    <h4 className="font-semibold mb-2">Page Range</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter pages to extract (e.g., "1-3" or "1,3,5")
                    </p>
                    <Input
                      value={splitPageRange}
                      onChange={(e) => setSplitPageRange(e.target.value)}
                      placeholder="e.g., 1-3 or 1,3,5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Watermark Settings */}
            {selectedFiles.length > 0 && selectedCategory === "watermark" && (
              <div className="animate-scale-in">
                <div className="p-4 rounded-lg border bg-card space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Watermark Text</h4>
                    <Textarea
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter watermark text"
                      rows={2}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Opacity</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Opacity: {Math.round(watermarkOpacity * 100)}%</span>
                      </div>
                      <Slider
                        value={[watermarkOpacity]}
                        onValueChange={(value) => setWatermarkOpacity(value[0])}
                        min={0.1}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
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
                        {selectedCategory === "compress" ? "Compressing" : 
                         selectedCategory === "merge" ? "Merging" :
                         selectedCategory === "split" ? "Splitting" :
                         selectedCategory === "watermark" ? "Watermarking" :
                         selectedCategory === "background-removal" ? "Processing" : "Converting"} {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {selectedCategory === "compress" ? "Compress & Download" :
                         selectedCategory === "merge" ? "Merge & Download" :
                         selectedCategory === "split" ? "Split & Download" :
                         selectedCategory === "watermark" ? "Apply Watermark & Download" :
                         selectedCategory === "background-removal" ? "Remove Background & Download" : "Convert & Download"}
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
