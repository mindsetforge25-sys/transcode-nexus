import { useState, useRef, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Trash2,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Save,
} from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  pageNumber: number;
}

interface ShapeAnnotation {
  id: string;
  type: "rectangle" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  pageNumber: number;
}

const PDFEditor = () => {
  const navigate = useNavigate();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  
  const [activeTool, setActiveTool] = useState<"text" | "rectangle" | "circle" | "select">("select");
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [shapeAnnotations, setShapeAnnotations] = useState<ShapeAnnotation[]>([]);
  
  const [newText, setNewText] = useState<string>("Sample Text");
  const [fontSize, setFontSize] = useState<number>(16);
  const [textColor, setTextColor] = useState<string>("#000000");
  const [shapeColor, setShapeColor] = useState<string>("#FF0000");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      toast.success("PDF loaded successfully!");
    } else {
      toast.error("Please upload a valid PDF file");
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === "select") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (activeTool === "text") {
      const newAnnotation: TextAnnotation = {
        id: Date.now().toString(),
        text: newText,
        x,
        y,
        fontSize,
        color: textColor,
        pageNumber: currentPage,
      };
      setTextAnnotations([...textAnnotations, newAnnotation]);
      toast.success("Text added to PDF");
    } else if (activeTool === "rectangle" || activeTool === "circle") {
      const newShape: ShapeAnnotation = {
        id: Date.now().toString(),
        type: activeTool,
        x,
        y,
        width: 100,
        height: 60,
        color: shapeColor,
        pageNumber: currentPage,
      };
      setShapeAnnotations([...shapeAnnotations, newShape]);
      toast.success(`${activeTool} added to PDF`);
    }
  };

  const handleDeleteAnnotation = (id: string, type: "text" | "shape") => {
    if (type === "text") {
      setTextAnnotations(textAnnotations.filter((a) => a.id !== id));
    } else {
      setShapeAnnotations(shapeAnnotations.filter((a) => a.id !== id));
    }
    toast.success("Annotation deleted");
  };

  const handleSavePDF = async () => {
    if (!pdfFile) {
      toast.error("No PDF file loaded");
      return;
    }

    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      // Add text annotations
      textAnnotations.forEach((annotation) => {
        const page = pages[annotation.pageNumber - 1];
        if (page) {
          const { height } = page.getSize();
          page.drawText(annotation.text, {
            x: annotation.x,
            y: height - annotation.y,
            size: annotation.fontSize,
            color: rgb(
              parseInt(annotation.color.slice(1, 3), 16) / 255,
              parseInt(annotation.color.slice(3, 5), 16) / 255,
              parseInt(annotation.color.slice(5, 7), 16) / 255
            ),
          });
        }
      });

      // Add shape annotations
      shapeAnnotations.forEach((annotation) => {
        const page = pages[annotation.pageNumber - 1];
        if (page) {
          const { height } = page.getSize();
          const color = rgb(
            parseInt(annotation.color.slice(1, 3), 16) / 255,
            parseInt(annotation.color.slice(3, 5), 16) / 255,
            parseInt(annotation.color.slice(5, 7), 16) / 255
          );

          if (annotation.type === "rectangle") {
            page.drawRectangle({
              x: annotation.x,
              y: height - annotation.y - annotation.height,
              width: annotation.width,
              height: annotation.height,
              borderColor: color,
              borderWidth: 2,
            });
          } else if (annotation.type === "circle") {
            page.drawEllipse({
              x: annotation.x + annotation.width / 2,
              y: height - annotation.y - annotation.height / 2,
              xScale: annotation.width / 2,
              yScale: annotation.height / 2,
              borderColor: color,
              borderWidth: 2,
            });
          }
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes) as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited-${pdfFile.name}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF saved successfully!");
    } catch (error) {
      console.error("Error saving PDF:", error);
      toast.error("Failed to save PDF");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border bg-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            PDF Editor
          </h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload PDF</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose PDF File
              </Button>
            </div>

            <Separator />

            {/* Tools */}
            <div className="space-y-2">
              <Label>Tools</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={activeTool === "text" ? "default" : "outline"}
                  onClick={() => setActiveTool("text")}
                  className="w-full"
                >
                  <Type className="mr-2 h-4 w-4" />
                  Text
                </Button>
                <Button
                  variant={activeTool === "rectangle" ? "default" : "outline"}
                  onClick={() => setActiveTool("rectangle")}
                  className="w-full"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Rectangle
                </Button>
                <Button
                  variant={activeTool === "circle" ? "default" : "outline"}
                  onClick={() => setActiveTool("circle")}
                  className="w-full"
                >
                  <Circle className="mr-2 h-4 w-4" />
                  Circle
                </Button>
                <Button
                  variant={activeTool === "select" ? "default" : "outline"}
                  onClick={() => setActiveTool("select")}
                  className="w-full"
                >
                  Select
                </Button>
              </div>
            </div>

            {/* Text Settings */}
            {activeTool === "text" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Text Content</Label>
                    <Textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Enter text..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Size: {fontSize}px</Label>
                    <Slider
                      value={[fontSize]}
                      onValueChange={(value) => setFontSize(value[0])}
                      min={8}
                      max={72}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Shape Settings */}
            {(activeTool === "rectangle" || activeTool === "circle") && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Shape Color</Label>
                  <Input
                    type="color"
                    value={shapeColor}
                    onChange={(e) => setShapeColor(e.target.value)}
                    className="h-12"
                  />
                </div>
              </>
            )}

            <Separator />

            {/* Annotations List */}
            <div className="space-y-2">
              <Label>Annotations ({textAnnotations.length + shapeAnnotations.length})</Label>
              <div className="space-y-2">
                {textAnnotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="flex items-center justify-between p-2 border border-border rounded bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      <span className="text-sm truncate">{annotation.text}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAnnotation(annotation.id, "text")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {shapeAnnotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="flex items-center justify-between p-2 border border-border rounded bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {annotation.type === "rectangle" ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <span className="text-sm capitalize">{annotation.type}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAnnotation(annotation.id, "shape")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Save Button */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleSavePDF}
            disabled={!pdfFile}
            className="w-full"
            size="lg"
          >
            <Download className="mr-2 h-4 w-4" />
            Save & Download PDF
          </Button>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col bg-muted/20">
        {/* Toolbar */}
        <div className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale(Math.min(2, scale + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRotation((rotation + 90) % 360)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {pdfFile && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage === numPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* PDF Canvas */}
        <ScrollArea className="flex-1">
          <div className="flex items-center justify-center p-8 min-h-full">
            {pdfUrl ? (
              <div
                className="relative border-2 border-border shadow-glow rounded bg-card"
                onClick={handlePageClick}
                style={{ cursor: activeTool === "select" ? "default" : "crosshair" }}
              >
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="relative"
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>

                {/* Overlay for annotations */}
                {textAnnotations
                  .filter((a) => a.pageNumber === currentPage)
                  .map((annotation) => (
                    <div
                      key={annotation.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: annotation.x * scale,
                        top: annotation.y * scale,
                        fontSize: annotation.fontSize * scale,
                        color: annotation.color,
                        whiteSpace: "pre-wrap",
                        fontWeight: "500",
                      }}
                    >
                      {annotation.text}
                    </div>
                  ))}

                {shapeAnnotations
                  .filter((a) => a.pageNumber === currentPage)
                  .map((annotation) => (
                    <div
                      key={annotation.id}
                      className="absolute pointer-events-none border-2"
                      style={{
                        left: annotation.x * scale,
                        top: annotation.y * scale,
                        width: annotation.width * scale,
                        height: annotation.height * scale,
                        borderColor: annotation.color,
                        borderRadius: annotation.type === "circle" ? "50%" : "0",
                      }}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
                  <Upload className="h-12 w-12 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No PDF Loaded</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a PDF file to start editing
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default PDFEditor;
