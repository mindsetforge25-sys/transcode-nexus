import { FileImage, FileVideo, FileAudio, FileText, Minimize2, Merge, Split, Droplet, Wand2 } from "lucide-react";
import { Card } from "./ui/card";

export type FileCategory = "image" | "video" | "audio" | "document" | "compress" | "merge" | "split" | "watermark" | "background-removal";

interface CategorySelectorProps {
  selectedCategory: FileCategory;
  onCategoryChange: (category: FileCategory) => void;
}

const categories = [
  {
    id: "image" as FileCategory,
    name: "Images",
    icon: FileImage,
  },
  {
    id: "video" as FileCategory,
    name: "Videos",
    icon: FileVideo,
  },
  {
    id: "audio" as FileCategory,
    name: "Audio",
    icon: FileAudio,
  },
  {
    id: "document" as FileCategory,
    name: "Documents",
    icon: FileText,
  },
  {
    id: "compress" as FileCategory,
    name: "Compress",
    icon: Minimize2,
  },
  {
    id: "merge" as FileCategory,
    name: "Merge",
    icon: Merge,
  },
  {
    id: "split" as FileCategory,
    name: "Split",
    icon: Split,
  },
  {
    id: "watermark" as FileCategory,
    name: "Watermark",
    icon: Droplet,
  },
  {
    id: "background-removal" as FileCategory,
    name: "Remove BG",
    icon: Wand2,
  },
];

export const CategorySelector = ({
  selectedCategory,
  onCategoryChange,
}: CategorySelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        
        return (
          <Card
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`p-5 cursor-pointer transition-all duration-200 border ${
              isSelected 
                ? "bg-primary text-primary-foreground border-primary shadow-elevated" 
                : "bg-card hover:bg-accent/5 border-border hover:border-accent/40"
            }`}
          >
            <div className="flex flex-col items-center gap-2.5 text-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isSelected ? "bg-primary-foreground/10" : "bg-accent/10"
              }`}>
                <Icon className={`w-6 h-6 ${isSelected ? "text-primary-foreground" : "text-accent"}`} />
              </div>
              <p className="font-medium text-sm">{category.name}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
