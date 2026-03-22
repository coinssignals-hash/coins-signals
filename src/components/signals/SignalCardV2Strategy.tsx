import { memo } from "react";
import { Loader2, Info } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import pinbarPattern from "@/assets/pinbar-pattern.png";

interface StrategyData {
  duration: { value: string; explanation: string };
  approach: { value: string; explanation: string };
  session: { value: string; explanation: string };
  bestTime: { value: string; explanation: string };
  confirmationCandle: { value: string; explanation: string };
}

interface Props {
  currencyPair: string;
  strategy: StrategyData | null;
  loading: boolean;
}

function StrategyCell({ label, icon, value, explanation, infoLabel }: {
  label: string; icon: string; value: string; explanation: string; infoLabel?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className="rounded-lg p-2.5 cursor-pointer relative overflow-hidden group active:scale-95 transition-transform"
          style={{
            background: "linear-gradient(135deg, hsla(210, 80%, 12%, 0.8) 0%, hsla(200, 60%, 15%, 0.6) 100%)",
            border: "1px solid hsla(200, 60%, 35%, 0.2)"
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">{label}</span>
            <Info className="w-2.5 h-2.5 text-cyan-400/40 group-hover:text-cyan-300 transition-colors" />
          </div>
          <span className="text-xs font-bold text-cyan-100">{value}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-[260px] bg-[hsl(225,25%,10%)] border-cyan-500/20 text-[11px] text-cyan-100 p-3 shadow-xl shadow-black/40">
        <p className="font-bold text-yellow-400 mb-1.5 text-xs">{icon} {value}</p>
        <p className="leading-relaxed">{explanation}</p>
        {infoLabel && (
          <div className="mt-2 pt-2 border-t border-cyan-500/10 text-[10px] text-cyan-300/50">{infoLabel}</div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export const SignalCardV2Strategy = memo(function SignalCardV2Strategy({ currencyPair, strategy, loading }: Props) {
  const { t } = useTranslation();

  const s = strategy;

  return (
    <div
      className="mx-2 sm:mx-3 mb-3 rounded-lg relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, hsl(210, 100%, 6%) 0%, hsl(205, 80%, 10%) 100%)",
        border: "1px solid hsla(200, 60%, 35%, 0.3)"
      }}
    >
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }}
      />

      <div className="p-3">
        <div className="flex items-center justify-center gap-2 mb-3">
          <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider text-center">
            {t('signal_strategy')}
          </p>
          {loading && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
          {s && !loading && <span className="text-[8px] text-emerald-400/70 uppercase tracking-wider">IA</span>}
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          <StrategyCell
            label={t('signal_strategy_duration')}
            icon="📊"
            value={s?.duration.value ?? "Intradía"}
            explanation={s?.duration.explanation ?? "Operaciones que se abren y cierran dentro del mismo día de trading."}
            infoLabel={`${t('signal_analysis_for')} ${currencyPair}`}
          />
          <StrategyCell
            label={t('signal_strategy_approach')}
            icon="🏦"
            value={s?.approach.value ?? "Smart Money"}
            explanation={s?.approach.explanation ?? "Estrategia basada en seguir el flujo de capital institucional."}
            infoLabel={t('signal_market_structure')}
          />
          <StrategyCell
            label={t('signal_strategy_session')}
            icon="🕐"
            value={s?.session.value ?? "New York"}
            explanation={s?.session.explanation ?? "Sesión con mayor volumen y liquidez para este par."}
          />
          <StrategyCell
            label={t('signal_strategy_best_time')}
            icon="⏰"
            value={s?.bestTime.value ?? "10:00 – 14:00"}
            explanation={s?.bestTime.explanation ?? "Rango horario con mayor actividad y mejores oportunidades."}
          />
        </div>

        {/* Candle confirmation */}
        <Popover>
          <PopoverTrigger asChild>
            <div
              className="rounded-lg p-3 cursor-pointer relative overflow-hidden group active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(135deg, hsla(210, 80%, 10%, 0.9) 0%, hsla(200, 60%, 14%, 0.7) 100%)",
                border: "1px solid hsla(200, 60%, 35%, 0.25)"
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">{t('signal_strategy_candle')}</span>
                    <Info className="w-2.5 h-2.5 text-cyan-400/40 group-hover:text-cyan-300 transition-colors" />
                  </div>
                  <span className="text-xs font-bold text-cyan-100 block">{s?.confirmationCandle.value ?? "Pin Bar"}</span>
                  <span className="text-[9px] text-cyan-300/40 mt-0.5 block">{t('signal_tap_diagram')}</span>
                </div>
                <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0" style={{ border: "1px solid hsla(200, 60%, 35%, 0.2)" }}>
                  <img src={pinbarPattern} alt={s?.confirmationCandle.value ?? "Pin Bar"} className="w-full h-full object-cover" draggable={false} />
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent side="top" className="max-w-[280px] bg-[hsl(225,25%,10%)] border-cyan-500/20 text-[11px] text-cyan-100 p-3 shadow-xl shadow-black/40">
            <p className="font-bold text-yellow-400 mb-1.5 text-xs">🕯️ {s?.confirmationCandle.value ?? "Pin Bar"}</p>
            <p className="leading-relaxed mb-2">{s?.confirmationCandle.explanation ?? "Vela con mecha larga y cuerpo pequeño que indica rechazo del precio."}</p>
            <img src={pinbarPattern} alt={t('signal_candle_pattern')} className="w-full rounded-md border border-cyan-500/20 mb-1.5" draggable={false} />
            <div className="text-[10px] text-cyan-300/50 text-center">{t('signal_sr_confluence')}</div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
});
