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
import "./PDFEditor.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TextEdit {
  id: string;
  originalText: string;
  newText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
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
  
  const [textEdits, setTextEdits] = useState<TextEdit[]>([]);
  const [selectedTextEdit, setSelectedTextEdit] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  

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

  const handleTextClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const parentRect = target.closest('.react-pdf__Page')?.getBoundingClientRect();
    
    if (!parentRect) return;

    const originalText = target.textContent || "";
    const computedStyle = window.getComputedStyle(target);
    const fontSize = parseFloat(computedStyle.fontSize) / scale;

    const newEdit: TextEdit = {
      id: Date.now().toString(),
      originalText,
      newText: originalText,
      x: (rect.left - parentRect.left) / scale,
      y: (rect.top - parentRect.top) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
      fontSize,
      pageNumber: currentPage,
    };

    setTextEdits([...textEdits, newEdit]);
    setSelectedTextEdit(newEdit.id);
    setEditingText(originalText);
    toast.success("Text selected for editing");
  };

  const handleUpdateText = () => {
    if (!selectedTextEdit) return;

    setTextEdits(textEdits.map(edit => 
      edit.id === selectedTextEdit 
        ? { ...edit, newText: editingText }
        : edit
    ));
    toast.success("Text updated");
  };

  const handleDeleteEdit = (id: string) => {
    setTextEdits(textEdits.filter((e) => e.id !== id));
    if (selectedTextEdit === id) {
      setSelectedTextEdit(null);
      setEditingText("");
    }
    toast.success("Edit removed");
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

      // Apply text edits
      textEdits.forEach((edit) => {
        const page = pages[edit.pageNumber - 1];
        if (page && edit.originalText !== edit.newText) {
          const { height } = page.getSize();
          
          // Cover original text with white rectangle
          page.drawRectangle({
            x: edit.x,
            y: height - edit.y - edit.height,
            width: edit.width,
            height: edit.height,
            color: rgb(1, 1, 1),
          });

          // Draw new text
          page.drawText(edit.newText, {
            x: edit.x,
            y: height - edit.y - edit.height + 2,
            size: edit.fontSize,
            color: rgb(0, 0, 0),
          });
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
    toast.success("PDF loaded - click on any text to edit it");
  };

  useEffect(() => {
    // Add click handlers to text layer after PDF loads
    const addTextClickHandlers = () => {
      const textLayer = document.querySelector('.react-pdf__Page__textContent');
      if (textLayer) {
        const textSpans = textLayer.querySelectorAll('span');
        textSpans.forEach((span) => {
          span.addEventListener('click', handleTextClick as any);
        });
      }
    };

    const timer = setTimeout(addTextClickHandlers, 500);
    return () => clearTimeout(timer);
  }, [currentPage, pdfUrl, scale]);

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
            PDF Text Editor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Click on any text to edit it</p>
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

            {/* Edit Selected Text */}
            {selectedTextEdit && (
              <div className="space-y-4">
                <Label>Edit Selected Text</Label>
                <Textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  placeholder="Enter new text..."
                  rows={4}
                />
                <Button
                  onClick={handleUpdateText}
                  className="w-full"
                  size="sm"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Update Text
                </Button>
              </div>
            )}

            <Separator />

            {/* Text Edits List */}
            <div className="space-y-2">
              <Label>Text Edits ({textEdits.length})</Label>
              {textEdits.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Click on any text in the PDF to edit it
                </p>
              )}
              <div className="space-y-2">
                {textEdits.map((edit) => (
                  <div
                    key={edit.id}
                    className={`flex items-start justify-between p-2 border rounded cursor-pointer transition-colors ${
                      selectedTextEdit === edit.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/50 hover:bg-muted"
                    }`}
                    onClick={() => {
                      setSelectedTextEdit(edit.id);
                      setEditingText(edit.newText);
                    }}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Type className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">Original:</span>
                      </div>
                      <p className="text-sm line-through opacity-60 truncate">
                        {edit.originalText}
                      </p>
                      <p className="text-sm font-medium truncate">
                        {edit.newText}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEdit(edit.id);
                      }}
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
              <div className="relative border-2 border-border shadow-glow rounded bg-card">
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
                    className="pdf-page-editable"
                  />
                </Document>

                {/* Overlay for edited text highlights */}
                {textEdits
                  .filter((e) => e.pageNumber === currentPage)
                  .map((edit) => (
                    <div
                      key={edit.id}
                      className={`absolute border-2 pointer-events-none ${
                        selectedTextEdit === edit.id
                          ? "border-primary bg-primary/20"
                          : "border-yellow-500 bg-yellow-500/10"
                      }`}
                      style={{
                        left: edit.x * scale,
                        top: edit.y * scale,
                        width: edit.width * scale,
                        height: edit.height * scale,
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
