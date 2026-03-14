import { useTranslation, LANGUAGE_FLAGS, LANGUAGE_LABELS, type Language } from '@/i18n/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LANGUAGES: Language[] = ['es', 'en', 'pt', 'fr', 'it', 'nl', 'de', 'ar', 'mt'];

export function LanguageQuickSelect() {
  const { language, setLanguage } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/80 hover:text-primary">
          <span className="text-base leading-none">{LANGUAGE_FLAGS[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              language === lang && 'bg-primary/10 text-primary font-medium'
            )}
          >
            <span className="text-base">{LANGUAGE_FLAGS[lang]}</span>
            <span className="text-sm">{LANGUAGE_LABELS[lang]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
