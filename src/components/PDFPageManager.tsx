import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { RotateCw, Trash2, MoveUp, MoveDown } from "lucide-react";

interface PDFPageManagerProps {
  numPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
  onPageRotate: (page: number) => void;
  onPageDelete: (page: number) => void;
  onPageMove: (page: number, direction: "up" | "down") => void;
}

export const PDFPageManager = ({
  numPages,
  currentPage,
  onPageSelect,
  onPageRotate,
  onPageDelete,
  onPageMove,
}: PDFPageManagerProps) => {
  return (
    <Card className="p-4 border-border bg-card shadow-card">
      <h3 className="font-semibold text-foreground mb-4 text-sm">Page Management</h3>
      
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
            <div
              key={page}
              className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer ${
                currentPage === page
                  ? "border-accent bg-accent/10"
                  : "border-border hover:bg-secondary/50"
              }`}
              onClick={() => onPageSelect(page)}
            >
              <span className="text-sm font-medium">Page {page}</span>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageMove(page, "up");
                  }}
                  disabled={page === 1}
                >
                  <MoveUp className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageMove(page, "down");
                  }}
                  disabled={page === numPages}
                >
                  <MoveDown className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageRotate(page);
                  }}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageDelete(page);
                  }}
                  disabled={numPages === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
