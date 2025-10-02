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
  image: ["PNG", "JPG", "WEBP", "GIF", "SVG", "AVIF"],
  video: ["MP4", "AVI", "MOV", "MKV", "WEBM"],
  audio: ["MP3", "WAV", "OGG", "AAC", "FLAC"],
  document: ["PDF", "DOCX", "TXT", "MD", "HTML"],
};

export const FormatSelector = ({
  category,
  selectedFormat,
  onFormatChange,
}: FormatSelectorProps) => {
  const formats = formatsByCategory[category];

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Convert to:</h3>
      <RadioGroup value={selectedFormat} onValueChange={onFormatChange}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {formats.map((format) => (
            <div key={format} className="flex items-center space-x-2">
              <RadioGroupItem value={format} id={format} />
              <Label
                htmlFor={format}
                className="cursor-pointer font-medium hover:text-primary transition-colors"
              >
                {format}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </Card>
  );
};
