import { useState } from "react";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Lock, Unlock } from "lucide-react";

interface ImageResizeOptionsProps {
  onResize: (width: number | null, height: number | null) => void;
}

export const ImageResizeOptions = ({ onResize }: ImageResizeOptionsProps) => {
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [aspectRatioLocked, setAspectRatioLocked] = useState(true);
  const [originalRatio, setOriginalRatio] = useState<number | null>(null);

  const handleWidthChange = (value: string) => {
    setWidth(value);
    if (aspectRatioLocked && originalRatio && value) {
      const w = parseInt(value);
      if (!isNaN(w)) {
        setHeight(Math.round(w / originalRatio).toString());
      }
    }
    onResize(value ? parseInt(value) : null, height ? parseInt(height) : null);
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    if (aspectRatioLocked && originalRatio && value) {
      const h = parseInt(value);
      if (!isNaN(h)) {
        setWidth(Math.round(h * originalRatio).toString());
      }
    }
    onResize(width ? parseInt(width) : null, value ? parseInt(value) : null);
  };

  return (
    <Card className="p-6 border-border bg-card shadow-card">
      <h3 className="font-semibold text-foreground mb-5">Resize Options</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Width (px)</Label>
            <Input
              type="number"
              placeholder="Auto"
              value={width}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Height (px)</Label>
            <Input
              type="number"
              placeholder="Auto"
              value={height}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox
            id="aspect-ratio"
            checked={aspectRatioLocked}
            onCheckedChange={(checked) => setAspectRatioLocked(checked as boolean)}
          />
          <Label htmlFor="aspect-ratio" className="text-sm cursor-pointer flex items-center gap-2">
            {aspectRatioLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            Lock aspect ratio
          </Label>
        </div>

        <div className="pt-2 space-y-2">
          <Label className="text-xs text-muted-foreground">Quick presets</Label>
          <div className="flex gap-2 flex-wrap">
            {["1920x1080", "1280x720", "800x600"].map((preset) => {
              const [w, h] = preset.split("x");
              return (
                <button
                  key={preset}
                  onClick={() => {
                    setWidth(w);
                    setHeight(h);
                    onResize(parseInt(w), parseInt(h));
                  }}
                  className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent hover:border-accent transition-colors"
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};
