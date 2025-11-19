import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');
  const label = language === 'en' ? 'EN' : 'AR';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={toggleLanguage}
            id="navbar-language-toggle"
            aria-label={label}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{language === 'en' ? 'Arabic' : 'English'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}