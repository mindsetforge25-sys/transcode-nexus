import { Moon, Sun, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <nav className="border-b border-border/40 bg-background sticky top-0 z-50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FileEdit className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              FileFlow
            </h1>
            <p className="text-xs text-muted-foreground">Professional File Converter</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/pdf-editor")}
            className="gap-2 font-medium"
          >
            <FileEdit className="h-4 w-4" />
            PDF Editor
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
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
