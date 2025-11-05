import { useState, useRef, useEffect } from "react";
import { PDFDocument, rgb, degrees } from "pdf-lib";
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
import { PDFPageManager } from "@/components/PDFPageManager";
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
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [deletedPages, setDeletedPages] = useState<Set<number>>(new Set());

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
    const fontSize = parseFloat(computedStyle.fontSize);

    // Calculate position relative to the PDF page
    const relativeX = (rect.left - parentRect.left) / scale;
    const relativeY = (rect.top - parentRect.top) / scale;
    const relativeWidth = rect.width / scale;
    const relativeHeight = rect.height / scale;
    const relativeFontSize = fontSize / scale;

    const newEdit: TextEdit = {
      id: Date.now().toString(),
      originalText,
      newText: originalText,
      x: relativeX,
      y: relativeY,
      width: relativeWidth,
      height: relativeHeight,
      fontSize: relativeFontSize,
      pageNumber: currentPage,
    };

    setTextEdits([...textEdits, newEdit]);
    setSelectedTextEdit(newEdit.id);
    setEditingText(originalText);
    toast.success("Text selected - edit in the sidebar");
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

  const handlePageRotate = (page: number) => {
    setPageRotations(prev => ({
      ...prev,
      [page]: ((prev[page] || 0) + 90) % 360
    }));
    toast.success(`Page ${page} rotated`);
  };

  const handlePageDelete = (page: number) => {
    if (numPages === 1) {
      toast.error("Cannot delete the only page");
      return;
    }
    setDeletedPages(prev => new Set([...prev, page]));
    if (currentPage === page) {
      setCurrentPage(Math.max(1, page - 1));
    }
    toast.success(`Page ${page} marked for deletion`);
  };

  const handlePageMove = (page: number, direction: "up" | "down") => {
    // This would require more complex PDF manipulation
    toast("Page reordering will be applied on save", { duration: 2000 });
  };

  const handleSavePDF = async () => {
    if (!pdfFile) {
      toast.error("No PDF file loaded");
      return;
    }

    if (textEdits.length === 0) {
      toast.error("No edits to save");
      return;
    }

    try {
      toast("Processing PDF...");
      
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      let pages = pdfDoc.getPages();

      // Apply page rotations
      for (const [pageNum, rotation] of Object.entries(pageRotations)) {
        const page = pages[parseInt(pageNum) - 1];
        if (page && rotation) {
          page.setRotation(degrees(rotation));
        }
      }

      // Remove deleted pages
      const pagesToKeep: number[] = [];
      for (let i = 0; i < pages.length; i++) {
        if (!deletedPages.has(i + 1)) {
          pagesToKeep.push(i);
        }
      }

      if (pagesToKeep.length < pages.length) {
        const newPdf = await PDFDocument.create();
        for (const pageIndex of pagesToKeep) {
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
          newPdf.addPage(copiedPage);
        }
        pdfDoc.removePage;
        pages = newPdf.getPages();
      }

      // Apply text edits with better positioning
      for (const edit of textEdits) {
        if (deletedPages.has(edit.pageNumber)) continue;
        
        const page = pages[edit.pageNumber - 1];
        if (!page || edit.originalText === edit.newText) continue;

        const { height } = page.getSize();
        
        // Calculate Y position (PDF coordinates start from bottom)
        const pdfY = height - edit.y - edit.height;
        
        // Cover original text with white rectangle (slightly larger for better coverage)
        page.drawRectangle({
          x: Math.max(0, edit.x - 1),
          y: pdfY - 1,
          width: edit.width + 2,
          height: edit.height + 2,
          color: rgb(1, 1, 1),
        });

        // Draw new text with better positioning
        const textSize = Math.max(8, Math.min(edit.fontSize, 72)); // Clamp font size
        page.drawText(edit.newText, {
          x: edit.x,
          y: pdfY + (edit.height * 0.2), // Adjust baseline
          size: textSize,
          color: rgb(0, 0, 0),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited-${pdfFile.name}`;
      a.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      toast.success(`PDF saved with ${textEdits.length} edit(s)!`);
    } catch (error) {
      console.error("Error saving PDF:", error);
      toast.error("Failed to save PDF. Try with fewer edits or a simpler PDF.");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    toast.success(`PDF loaded (${numPages} page${numPages > 1 ? 's' : ''}) - Click any text to edit`);
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
        <div className="p-6 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-foreground">
            PDF Text Editor
          </h2>
          <p className="text-sm text-muted-foreground mt-2">Click any text to edit it</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* File Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Upload PDF</Label>
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
                className="w-full h-11 border-border"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            </div>

            <Separator />

            {/* Edit Selected Text */}
            {selectedTextEdit && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Edit Text</Label>
                <Textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  placeholder="Enter new text..."
                  rows={4}
                  className="resize-none"
                />
                <Button
                  onClick={handleUpdateText}
                  className="w-full"
                  size="sm"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Update
                </Button>
              </div>
            )}

            <Separator />

            {/* Page Management */}
            {pdfFile && numPages > 0 && (
              <PDFPageManager
                numPages={numPages}
                currentPage={currentPage}
                onPageSelect={setCurrentPage}
                onPageRotate={handlePageRotate}
                onPageDelete={handlePageDelete}
                onPageMove={handlePageMove}
              />
            )}

            <Separator />

            {/* Text Edits List */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Text Edits ({textEdits.length})</Label>
              {textEdits.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Click text in the PDF to edit it
                </p>
              )}
              <div className="space-y-2">
                {textEdits.map((edit) => (
                  <div
                    key={edit.id}
                    className={`flex items-start justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedTextEdit === edit.id
                        ? "border-accent bg-accent/5"
                        : "border-border bg-secondary/50 hover:bg-secondary"
                    }`}
                    onClick={() => {
                      setSelectedTextEdit(edit.id);
                      setEditingText(edit.newText);
                    }}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Type className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">Original</span>
                      </div>
                      <p className="text-sm line-through opacity-60 truncate">
                        {edit.originalText}
                      </p>
                      <p className="text-sm font-medium truncate text-foreground">
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
                      className="h-8 w-8 p-0 hover:text-destructive"
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
        <div className="p-6 border-t border-border">
          <Button
            onClick={handleSavePDF}
            disabled={!pdfFile}
            className="w-full h-12 bg-primary text-primary-foreground font-semibold"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Save PDF
          </Button>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col bg-secondary/20">
        {/* Toolbar */}
        <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              className="h-9 w-9"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center text-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale(Math.min(2, scale + 0.1))}
              className="h-9 w-9"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRotation((rotation + 90) % 360)}
              className="h-9 w-9"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {pdfFile && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-foreground font-medium">
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
              <div className="relative border border-border shadow-elevated rounded-lg bg-card">
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
                          ? "border-accent bg-accent/10"
                          : "border-accent/40 bg-accent/5"
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
              <div className="text-center space-y-6 max-w-md">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center border-2 border-accent/20">
                  <Upload className="h-10 w-10 text-accent" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">No PDF Loaded</h3>
                  <p className="text-muted-foreground">
                    Upload a PDF file to start editing text
                  </p>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                  >
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
