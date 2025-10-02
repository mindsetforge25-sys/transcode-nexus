import { FileImage, FileVideo, FileAudio, FileText } from "lucide-react";
import { Card } from "./ui/card";

export type FileCategory = "image" | "video" | "audio" | "document";

interface CategorySelectorProps {
  selectedCategory: FileCategory;
  onCategoryChange: (category: FileCategory) => void;
}

const categories = [
  {
    id: "image" as FileCategory,
    name: "Images",
    icon: FileImage,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "video" as FileCategory,
    name: "Videos",
    icon: FileVideo,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "audio" as FileCategory,
    name: "Audio",
    icon: FileAudio,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "document" as FileCategory,
    name: "Documents",
    icon: FileText,
    gradient: "from-orange-500 to-red-500",
  },
];

export const CategorySelector = ({
  selectedCategory,
  onCategoryChange,
}: CategorySelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        
        return (
          <Card
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-card ${
              isSelected ? "ring-2 ring-primary shadow-glow" : ""
            }`}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center`}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <p className="font-semibold">{category.name}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
