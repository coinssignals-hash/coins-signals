import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Target, ShieldAlert, BarChart3, Activity, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TradingSignal } from "@/hooks/useSignals";
import { useTranslation } from "@/i18n/LanguageContext";

interface SignalPerformanceStatsProps {
  signals: TradingSignal[];
}

export function SignalPerformanceStats({ signals }: SignalPerformanceStatsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    const completed = signals.filter((s) => s.status === "completed" && s.closedResult);
    const tpHit = completed.filter((s) => s.closedResult === "tp_hit");
    const slHit = completed.filter((s) => s.closedResult === "sl_hit");
    const active = signals.filter((s) => s.status === "active" || s.status === "pending");
    const total = signals.length;
    const winRate = completed.length > 0 ? (tpHit.length / completed.length) * 100 : 0;

    const totalPipsWon = tpHit.reduce((sum, s) => {
      const isBuy = s.action === "BUY";
      const isJpy = s.currencyPair.includes("JPY");
      const mult = isJpy ? 100 : 10000;
      const pips = isBuy
        ? (s.takeProfit - s.entryPrice) * mult
        : (s.entryPrice - s.takeProfit) * mult;
      return sum + Math.abs(pips);
    }, 0);

    const totalPipsLost = slHit.reduce((sum, s) => {
      const isBuy = s.action === "BUY";
      const isJpy = s.currencyPair.includes("JPY");
      const mult = isJpy ? 100 : 10000;
      const pips = isBuy
        ? (s.entryPrice - s.stopLoss) * mult
        : (s.stopLoss - s.entryPrice) * mult;
      return sum + Math.abs(pips);
    }, 0);

    return {
      total,
      completed: completed.length,
      tpCount: tpHit.length,
      slCount: slHit.length,
      activeCount: active.length,
      winRate,
      totalPipsWon,
      totalPipsLost,
      netPips: totalPipsWon - totalPipsLost,
    };
  }, [signals]);

  if (stats.total === 0) return null;

  const winRateColor =
    stats.winRate >= 60
      ? "text-emerald-400"
      : stats.winRate >= 40
        ? "text-amber-400"
        : "text-rose-400";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(205, 80%, 10%) 100%)",
        border: "1px solid hsla(200, 60%, 30%, 0.3)",
      }}
    >
      {/* Top glow */}
      <div
        className="h-[1px] mx-[15%]"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)",
        }}
      />

      {/* Collapsible Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <BarChart3 className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider flex-1 text-left">
          Rendimiento de Señales
        </span>
        <span className={cn("text-xs font-mono font-bold", winRateColor)}>
          {stats.winRate.toFixed(0)}% WR
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-cyan-300/50 transition-transform duration-300",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible Content with grid-rows animation */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            {/* Win Rate Circle + Stats Grid */}
            <div className="flex items-center gap-4 mb-4">
              {/* Win Rate Ring */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="hsl(225, 20%, 15%)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="url(#winRateGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${stats.winRate * 0.88} ${100 * 0.88}`}
                    className="transition-all duration-700"
                  />
                  <circle cx="18" cy="18" r="11" fill="hsl(225, 25%, 8%)" />
                  <defs>
                    <linearGradient id="winRateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      {stats.winRate >= 60 ? (
                        <>
                          <stop offset="0%" stopColor="hsl(160, 80%, 55%)" />
                          <stop offset="100%" stopColor="hsl(120, 70%, 40%)" />
                        </>
                      ) : stats.winRate >= 40 ? (
                        <>
                          <stop offset="0%" stopColor="hsl(45, 90%, 55%)" />
                          <stop offset="100%" stopColor="hsl(35, 80%, 45%)" />
                        </>
                      ) : (
                        <>
                          <stop offset="0%" stopColor="hsl(10, 80%, 60%)" />
                          <stop offset="100%" stopColor="hsl(350, 70%, 45%)" />
                        </>
                      )}
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("font-mono text-sm font-extrabold", winRateColor)}>
                    {stats.winRate.toFixed(0)}%
                  </span>
                  <span className="text-[8px] text-cyan-300/50">Win Rate</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                {/* TP Hit */}
                <div
                  className="rounded-lg p-2.5 space-y-1"
                  style={{
                    background: "hsla(135, 60%, 15%, 0.3)",
                    border: "1px solid hsla(135, 50%, 40%, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-300/70 font-medium">TP Hit</span>
                    <span className="ml-auto text-sm font-bold text-emerald-400">{stats.tpCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400/80 font-mono">+{stats.totalPipsWon.toFixed(1)} pips</span>
                    <span className="text-emerald-300/60 font-mono">
                      {stats.completed > 0 ? ((stats.tpCount / stats.completed) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>

                {/* SL Hit */}
                <div
                  className="rounded-lg p-2.5 space-y-1"
                  style={{
                    background: "hsla(0, 60%, 15%, 0.3)",
                    border: "1px solid hsla(0, 50%, 40%, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[10px] text-rose-300/70 font-medium">SL Hit</span>
                    <span className="ml-auto text-sm font-bold text-rose-400">{stats.slCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-rose-400/80 font-mono">-{stats.totalPipsLost.toFixed(1)} pips</span>
                    <span className="text-rose-300/60 font-mono">
                      {stats.completed > 0 ? ((stats.slCount / stats.completed) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>

                {/* Active */}
                <div
                  className="rounded-lg p-2 flex items-center gap-2"
                  style={{
                    background: "hsla(200, 60%, 15%, 0.3)",
                    border: "1px solid hsla(200, 50%, 40%, 0.2)",
                  }}
                >
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-lg font-bold text-cyan-300 leading-none">
                      {stats.activeCount}
                    </p>
                    <p className="text-[9px] text-cyan-300/60">Activas</p>
                  </div>
                </div>

                {/* Total */}
                <div
                  className="rounded-lg p-2 flex items-center gap-2"
                  style={{
                    background: "hsla(210, 40%, 15%, 0.3)",
                    border: "1px solid hsla(210, 30%, 40%, 0.2)",
                  }}
                >
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-lg font-bold text-slate-300 leading-none">
                      {stats.total}
                    </p>
                    <p className="text-[9px] text-slate-400/60">Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pips Summary Bar */}
            {stats.completed > 0 && (
              <div className="space-y-2">
                {/* Win/Loss bar */}
                <div className="flex rounded-full overflow-hidden h-2.5" style={{ background: "hsl(225, 20%, 12%)" }}>
                  {stats.tpCount > 0 && (
                    <div
                      className={cn("h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500")}
                      style={{ width: `${(stats.tpCount / stats.completed) * 100}%` }}
                    />
                  )}
                  {stats.slCount > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500"
                      style={{ width: `${(stats.slCount / stats.completed) * 100}%` }}
                    />
                  )}
                </div>

                {/* Pips row */}
                <div className="flex justify-between text-[10px]">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">
                      +{stats.totalPipsWon.toFixed(1)} pips
                    </span>
                  </div>
                  <div className={cn("font-bold", stats.netPips >= 0 ? "text-emerald-300" : "text-rose-300")}>
                    Neto: {stats.netPips >= 0 ? "+" : ""}{stats.netPips.toFixed(1)} pips
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                    <span className="text-rose-400 font-bold">
                      -{stats.totalPipsLost.toFixed(1)} pips
                    </span>
                  </div>
                </div>
              </div>
            )}

            {stats.completed === 0 && (
              <p className="text-[10px] text-cyan-300/40 text-center italic">
                Aún no hay señales cerradas. Las estadísticas se actualizarán cuando el precio alcance TP o SL.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}