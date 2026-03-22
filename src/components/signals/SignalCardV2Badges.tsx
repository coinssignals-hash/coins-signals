import { memo } from "react";
import { TrendingUp, TrendingDown, ShieldCheck, Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";

interface SignalCardV2BadgesProps {
  trend: string;
  probability: number;
  action: string;
  riskLoading: boolean;
  aiRisk: { score: number; level: string } | null;
  riskPercent: string;
}

export const SignalCardV2Badges = memo(function SignalCardV2Badges({
  trend, probability, action, riskLoading, aiRisk, riskPercent,
}: SignalCardV2BadgesProps) {
  const { t } = useTranslation();

  const badges = [
    {
      label: trend === "bullish" ? t('signal_bullish') : t('signal_bearish'),
      icon: trend === "bullish"
        ? <TrendingUp className="w-4 h-4 text-green-400" />
        : <TrendingDown className="w-4 h-4 text-red-400" />,
      value: `${probability}%`,
      valueClass: "text-cyan-200"
    },
    {
      label: action === "BUY" ? t('signal_buy') : t('signal_sell'),
      icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
      value: action === "BUY" ? t('signal_buy') : t('signal_sell'),
      valueClass: action === "BUY" ? "text-green-400" : "text-red-400"
    },
    {
      label: t('signal_risk'),
      icon: riskLoading
        ? <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
        : <Flame className="w-4 h-4 text-orange-400" />,
      value: riskLoading ? '...' : aiRisk ? `${aiRisk.score}%` : `${riskPercent}%`,
      valueClass: aiRisk
        ? aiRisk.level === 'low' ? 'text-green-400'
          : aiRisk.level === 'medium' ? 'text-yellow-400'
          : aiRisk.level === 'high' ? 'text-orange-400'
          : 'text-red-400'
        : 'text-cyan-200'
    }
  ];

  return (
    <div className="relative px-3 pb-2">
      <div className="flex gap-1.5">
        {badges.map((badge) => (
          <div
            key={badge.label}
            className="flex-1 relative rounded-lg overflow-hidden flex flex-col items-center justify-center py-1.5 gap-0 min-h-[44px]"
            style={{
              background: "linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)",
              border: "1px solid hsla(200, 60%, 35%, 0.3)"
            }}
          >
            <div
              className="absolute top-0 left-[15%] right-[15%] h-[1px]"
              style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }}
            />
            <span className="text-[8px] sm:text-[9px] text-cyan-300/60 uppercase tracking-wider">{badge.label}</span>
            <div className="flex items-center gap-1">
              {badge.icon}
              <span className={cn("font-bold text-xs sm:text-sm", badge.valueClass)}>{badge.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
