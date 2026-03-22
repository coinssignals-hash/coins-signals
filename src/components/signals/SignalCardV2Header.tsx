import { memo } from "react";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";

interface SignalCardV2HeaderProps {
  baseCurrency: string;
  quoteCurrency: string;
  baseFlag: string;
  quoteFlag: string;
  displayPair: string;
  action: string;
  source?: string;
}

export const SignalCardV2Header = memo(function SignalCardV2Header({
  baseCurrency, quoteCurrency, baseFlag, quoteFlag, displayPair, action, source,
}: SignalCardV2HeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2.5 relative z-10">
      <div className="relative w-20 h-14 flex-shrink-0">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-20">
          <img src={`https://flagcdn.com/w160/${baseFlag}.png`} alt={baseCurrency} className="w-full h-full object-cover" />
        </div>
        <div className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-10">
          <img src={`https://flagcdn.com/w160/${quoteFlag}.png`} alt={quoteCurrency} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-lg sm:text-xl font-bold text-white tracking-wide">{displayPair}</span>
        <div className="flex items-center gap-1">
          <div className={cn(
            "inline-flex items-center gap-0.5 px-1 py-px rounded text-[8px] font-bold uppercase tracking-wider w-fit",
            action === "BUY"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
          )}>
            {action === "BUY" ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {action === "BUY" ? t('signal_long') : t('signal_short')}
          </div>
          {source === 'ai-center' && (
            <div className="inline-flex items-center gap-0.5 px-1 py-px rounded text-[8px] font-bold uppercase tracking-wider w-fit"
              style={{
                background: 'hsla(270, 80%, 55%, 0.15)',
                color: 'hsl(270, 80%, 70%)',
                border: '1px solid hsla(270, 60%, 55%, 0.3)',
              }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
