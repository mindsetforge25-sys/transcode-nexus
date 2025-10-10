import { Moon, Sun, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Haryorofficial File Converter
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/pdf-editor")}
            className="gap-2"
          >
            <FileEdit className="h-4 w-4" />
            PDF Editor
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};
