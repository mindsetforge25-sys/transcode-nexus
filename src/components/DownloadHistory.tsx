import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Download, Trash2, Clock } from "lucide-react";

interface HistoryItem {
  id: string;
  fileName: string;
  date: string;
  type: string;
}

export const DownloadHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("downloadHistory");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("downloadHistory");
    setHistory([]);
  };

  if (history.length === 0) return null;

  return (
    <Card className="p-6 border-border bg-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Recent Downloads</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="h-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Clear
        </Button>
      </div>
      
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.fileName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.type} • {new Date(item.date).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export const addToDownloadHistory = (fileName: string, type: string) => {
  const stored = localStorage.getItem("downloadHistory");
  const history: HistoryItem[] = stored ? JSON.parse(stored) : [];
  
  const newItem: HistoryItem = {
    id: Date.now().toString(),
    fileName,
    date: new Date().toISOString(),
    type,
  };
  
  const updated = [newItem, ...history].slice(0, 10); // Keep last 10
  localStorage.setItem("downloadHistory", JSON.stringify(updated));
};
