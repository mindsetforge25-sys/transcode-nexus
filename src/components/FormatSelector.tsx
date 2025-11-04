import { FileCategory } from "./CategorySelector";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface FormatSelectorProps {
  category: FileCategory;
  selectedFormat: string;
  onFormatChange: (format: string) => void;
}

const formatsByCategory: Record<FileCategory, string[]> = {
  image: ["PNG", "JPG", "JPEG", "WEBP", "GIF", "SVG", "AVIF", "BMP", "TIFF", "ICO", "HEIC", "PDF"],
  video: ["MP4", "AVI", "MOV", "MKV", "WEBM", "FLV", "WMV", "M4V", "3GP"],
  audio: ["MP3", "WAV", "OGG", "AAC", "FLAC", "M4A", "WMA", "AIFF"],
  document: ["PDF", "DOCX", "DOC", "TXT", "MD", "HTML", "RTF", "ODT", "EPUB"],
  compress: ["JPEG", "PDF"],
  merge: ["PDF"],
  split: ["PDF"],
  watermark: ["PNG", "JPG", "PDF"],
  "background-removal": ["PNG"],
};

export const FormatSelector = ({
  category,
  selectedFormat,
  onFormatChange,
}: FormatSelectorProps) => {
  const formats = formatsByCategory[category];

  return (
    <Card className="p-6 border-border bg-card shadow-card">
      <h3 className="font-semibold text-foreground mb-5">Output Format</h3>
      <RadioGroup value={selectedFormat} onValueChange={onFormatChange}>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
          {formats.map((format) => (
            <div key={format} className="flex items-center">
              <Label
                htmlFor={format}
                className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:border-accent hover:bg-accent/5 transition-all w-full has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary"
              >
                <RadioGroupItem value={format} id={format} className="sr-only" />
                <span className="text-sm font-medium">{format}</span>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </Card>
  );
};
