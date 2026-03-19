import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Brain, BarChart3, Target, FileText, Layers, Landmark,
  Play, Loader2, Sparkles, TrendingUp, AlertTriangle, Zap, ChevronDown } from
'lucide-react';
import { AIModelConfig, AIModelSettings } from './AIModelConfig';
import { AIModuleCard } from './AIModuleCard';
import { AIResultPanel } from './AIResultPanel';
import { AIChartPanel } from './AIChartPanel';
import { AISignalCreator } from './AISignalCreator';
import { AISymbolSearch, INSTRUMENT_TABS } from './AISymbolSearch';
import { useFavoriteSymbols } from '@/hooks/useFavoriteSymbols';
import { useForexData } from '@/hooks/useForexData';
import { useAIAnalysis, AIModule, DetailLevel } from '@/hooks/useAIAnalysis';
import { computeIndicators, type OHLCVCandle } from '@/lib/indicators';
import { detectCandlePatterns } from '@/lib/candle-patterns';
import { SignalStyleCard } from '@/components/ui/signal-style-card';
import { GlowCard } from '@/components/ui/glow-card';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  onClose: () => void;
}

const POPULAR_PAIRS = [
'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
'AUD/USD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY',
'GBP/JPY', 'XAU/USD'];


type ModuleStatus = 'idle' | 'running' | 'done' | 'error';

export function AICenter({ onClose }: Props) {
  const { t } = useTranslation();
  const [symbol, setSymbol] = useState('EUR/USD');
  const [customSymbol, setCustomSymbol] = useState('');
  const [modelSettings, setModelSettings] = useState<AIModelSettings>({
    models: ['google/gemini-2.5-flash'],
    temperature: 0.3,
    maxTokens: 4096
  });
  const [moduleStatuses, setModuleStatuses] = useState<Record<string, ModuleStatus>>({});
  const [showConfig, setShowConfig] = useState(false);
  const [showSignalCreator, setShowSignalCreator] = useState(false);
  const [instrumentCategory, setInstrumentCategory] = useState('all');
  const { favorites } = useFavoriteSymbols();

  const { data: forexData, loading: forexLoading, error: forexError, fetchData } = useForexData();
  const { results, loading: aiLoading, error: aiError, runModule, runFullAnalysis, detailLevel, setDetailLevel } = useAIAnalysis();

  const activeSymbol = customSymbol || symbol;

  const handleFetchData = useCallback(async () => {
    await fetchData(activeSymbol, '1d', '3mo');
  }, [fetchData, activeSymbol]);

  const computeAllIndicators = useCallback(() => {
    if (!forexData?.candles) return null;
    const ohlcv: OHLCVCandle[] = forexData.candles.map((c) => ({
      time: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume
    }));
    const indicators = computeIndicators(ohlcv, {
      ema20: true, ema50: true, ema200: true,
      sessionSydney: false, sessionTokyo: false, sessionLondon: false, sessionNewYork: false,
      kzLondonOpen: false, kzNewYorkOpen: false, kzLondonNYOverlap: false, kzAsianRange: false,
      kzHours: { ldnOpen: [7, 9], nyOpen: [12, 14], ldnNyOverlap: [12, 16], asianRange: [0, 4] }
    });
    const patterns = detectCandlePatterns(ohlcv);
    return { ...indicators, patterns };
  }, [forexData]);

  // Precomputed chart data with S/R, patterns, EMAs
  const chartData = useMemo(() => {
    if (!forexData?.candles) return null;
    const ohlcv: OHLCVCandle[] = forexData.candles.map((c) => ({
      time: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume
    }));
    const ind = computeIndicators(ohlcv, {
      ema20: true, ema50: true, ema200: false,
      sessionSydney: false, sessionTokyo: false, sessionLondon: false, sessionNewYork: false,
      kzLondonOpen: false, kzNewYorkOpen: false, kzLondonNYOverlap: false, kzAsianRange: false,
      kzHours: { ldnOpen: [7, 9], nyOpen: [12, 14], ldnNyOverlap: [12, 16], asianRange: [0, 4] }
    });
    const patterns = detectCandlePatterns(ohlcv);
    const recent = ohlcv.slice(-24);
    const support = Math.min(...recent.map((c) => c.low));
    const resistance = Math.max(...recent.map((c) => c.high));
    return { ohlcv, patterns, support, resistance, ema20: ind.ema20, ema50: ind.ema50 };
  }, [forexData]);

  const handleRunModule = useCallback(async (module: AIModule) => {
    if (!forexData?.candles) {
      await handleFetchData();
    }
    setModuleStatuses((prev) => ({ ...prev, [module]: 'running' }));
    const indicators = computeAllIndicators();
    const result = await runModule(module, {
      symbol: activeSymbol,
      candles: forexData?.candles || [],
      indicators,
      model: modelSettings.models[0],
      models: modelSettings.models,
      temperature: modelSettings.temperature
    });
    setModuleStatuses((prev) => ({
      ...prev,
      [module]: result ? 'done' : 'error'
    }));
  }, [forexData, handleFetchData, computeAllIndicators, runModule, activeSymbol, modelSettings]);

  const handleRunAll = useCallback(async () => {
    if (!forexData?.candles) {
      await handleFetchData();
    }
    const indicators = computeAllIndicators();
    const modules: AIModule[] = ['analyze-patterns', 'predict-signals', 'generate-report', 'correlation-analysis', 'synthesize-analysis'];
    for (const mod of modules) {
      setModuleStatuses((prev) => ({ ...prev, [mod]: 'running' }));
    }
    const allResults = await runFullAnalysis(activeSymbol, forexData?.candles || [], indicators);
    const newStatuses: Record<string, ModuleStatus> = {};
    modules.forEach((mod) => {
      newStatuses[mod] = allResults?.[mod] ? 'done' : 'error';
    });
    setModuleStatuses((prev) => ({ ...prev, ...newStatuses }));
  }, [forexData, handleFetchData, computeAllIndicators, runFullAnalysis, activeSymbol]);

  const AI_MODULES: {id: AIModule;title: string;desc: string;icon: typeof Brain;accent: string;}[] = [
  { id: 'analyze-patterns', title: t('ai_center_pattern_analysis'), desc: t('ai_center_pattern_desc'), icon: BarChart3, accent: 'cyan' },
  { id: 'predict-signals', title: t('ai_center_signal_prediction'), desc: t('ai_center_signal_pred_desc'), icon: Target, accent: 'purple' },
  { id: 'generate-report', title: t('ai_center_pro_report'), desc: t('ai_center_pro_report_desc'), icon: FileText, accent: 'emerald' },
  { id: 'correlation-analysis', title: t('ai_center_correlation'), desc: t('ai_center_correlation_desc'), icon: Landmark, accent: 'rose' },
  { id: 'synthesize-analysis', title: t('ai_center_multi_synthesis'), desc: t('ai_center_multi_synth_desc'), icon: Layers, accent: 'amber' }];


  const completedModules = Object.values(moduleStatuses).filter((s) => s === 'done').length;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Hero Header Card */}
      <SignalStyleCard>
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(270, 80%, 55%), hsl(200, 90%, 50%))' }}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[hsl(205,100%,7%)]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">{t('ai_center_title')}</h1>
                <p className="text-[11px] text-cyan-300/60">{t('ai_center_subtitle')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200",
                showConfig ?
                "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_-3px_rgba(168,85,247,0.3)]" :
                "bg-white/5 text-cyan-300/60 hover:text-cyan-200 hover:bg-white/10 border border-white/10"
              )}>
              
              <Sparkles className="w-5 h-5" />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center py-2 rounded-lg bg-white/5 border border-white/10">
              <div className="text-[10px] text-cyan-300/50 uppercase tracking-wider">{t('ai_center_pair')}</div>
              <div className="text-sm font-bold text-white font-mono">{activeSymbol}</div>
            </div>
            <div className="text-center py-2 rounded-lg bg-white/5 border border-white/10">
              <div className="text-[10px] text-cyan-300/50 uppercase tracking-wider">{t('ai_center_candles')}</div>
              <div className="text-sm font-bold text-white font-mono">{forexData?.candles.length || '—'}</div>
            </div>
            <div className="text-center py-2 rounded-lg bg-white/5 border border-white/10">
              <div className="text-[10px] text-cyan-300/50 uppercase tracking-wider">{t('ai_center_modules')}</div>
              <div className="text-sm font-bold text-white font-mono">{completedModules}/5</div>
            </div>
          </div>
        </div>
      </SignalStyleCard>

      {/* Model Config (collapsible) */}
      {showConfig &&
      <div className="rounded-xl border border-cyan-800/30 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at top center, hsl(200,100%,12%) 0%, hsl(210,100%,6%) 100%)' }}>
          <div className="p-4">
            <AIModelConfig settings={modelSettings} onChange={setModelSettings} detailLevel={detailLevel} onDetailLevelChange={setDetailLevel} />
          </div>
        </div>
      }

      {/* Instrument Category Tabs */}
      <GlowCard color="210 70% 55%">
        <div className="flex items-center gap-1 px-2 py-2.5 overflow-x-auto scrollbar-none">
          {INSTRUMENT_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = instrumentCategory === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setInstrumentCategory(tab.key)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 min-w-[60px] py-2.5 px-2.5 rounded-xl transition-all duration-200 active:scale-95",
                  isActive
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-300"
                )}
                style={isActive ? {
                  background: `linear-gradient(180deg, ${tab.color}18, ${tab.color}06)`,
                  border: `1px solid ${tab.color}30`,
                  boxShadow: `0 4px 12px -4px ${tab.color}25`,
                } : {
                  border: '1px solid transparent',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                  style={isActive ? {
                    background: `linear-gradient(135deg, ${tab.color}30, ${tab.color}10)`,
                    boxShadow: `0 0 10px -3px ${tab.color}40`,
                  } : {
                    background: 'hsl(210, 30%, 10%)',
                  }}
                >
                  <TabIcon className="w-6 h-6" style={{ color: isActive ? tab.color : 'hsl(210, 20%, 40%)' }} />
                </div>
                <span className="text-[9px] font-bold leading-none whitespace-nowrap">
                  {tab.label}
                </span>
                {tab.key === 'favorites' && favorites.length > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-[7px] w-4 h-4 rounded-full font-black flex items-center justify-center"
                    style={{
                      background: 'hsl(45, 80%, 50%)',
                      color: 'hsl(45, 90%, 10%)',
                    }}
                  >
                    {favorites.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </GlowCard>

      {/* Symbol Search + Fetch */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <AISymbolSearch
            value={customSymbol}
            onChange={setCustomSymbol}
            onSelect={(s) => {setCustomSymbol(s);setSymbol(s);}}
            activeCategory={instrumentCategory} />
          
          <button
            onClick={handleFetchData}
            disabled={forexLoading}
            className="px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-40 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, hsl(200, 90%, 45%), hsl(190, 80%, 40%))',
              color: 'white',
              boxShadow: '0 0 16px -4px hsla(200, 90%, 50%, 0.3)'
            }}>
            {forexLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {t('ai_center_fetch_data')}
          </button>
        </div>
      </div>

      {/* Data Status */}
      {forexData &&
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
      style={{
        background: 'hsl(160, 60%, 8%)',
        border: '1px solid hsl(160, 50%, 20%)'
      }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <span className="text-xs text-white font-semibold font-mono">{forexData.symbol}</span>
          <span className="text-[11px] text-slate-400">
            {forexData.candles.length} {t('ai_center_candles_loaded')}
          </span>
          <span className="text-[11px] text-cyan-300/60 ml-auto font-mono">
            {t('ai_center_last')}: {forexData.candles[forexData.candles.length - 1]?.close.toFixed(5)}
          </span>
        </div>
      }
      {forexError &&
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
      style={{
        background: 'hsl(0, 60%, 8%)',
        border: '1px solid hsl(0, 50%, 25%)'
      }}>
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-300">{forexError}</span>
        </div>
      }

      {/* Interactive Candlestick Chart */}
      {chartData &&
      <AIChartPanel
        candles={chartData.ohlcv}
        patterns={chartData.patterns}
        support={chartData.support}
        resistance={chartData.resistance}
        ema20={chartData.ema20}
        ema50={chartData.ema50}
        symbol={activeSymbol} />

      }

      {/* Run All Button */}
      <button
        onClick={handleRunAll}
        disabled={aiLoading || !forexData}
        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-30 active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, hsl(270, 80%, 50%), hsl(200, 90%, 45%))',
          color: 'white',
          boxShadow: '0 4px 20px -4px hsla(270, 80%, 50%, 0.35)'
        }}>
        
        {aiLoading ?
        <Loader2 className="w-5 h-5 animate-spin" /> :

        <Play className="w-5 h-5" />
        }
        {t('ai_center_run_full')}
      </button>

      {/* AI Modules */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(to bottom, hsl(200, 90%, 50%), hsl(270, 80%, 55%))' }} />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('ai_center_modules_title')}</h3>
        </div>
        <div className="grid gap-2">
          {AI_MODULES.map((mod) =>
          <AIModuleCard
            key={mod.id}
            title={mod.title}
            description={mod.desc}
            icon={mod.icon}
            status={moduleStatuses[mod.id] || 'idle'}
            onRun={() => handleRunModule(mod.id)}
            disabled={!forexData || aiLoading} />

          )}
        </div>
      </div>

      {/* Error */}
      {aiError &&
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
      style={{
        background: 'hsl(0, 60%, 8%)',
        border: '1px solid hsl(0, 50%, 25%)'
      }}>
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-300">{aiError}</span>
        </div>
      }

      {/* Results */}
      {Object.keys(results).length > 0 &&
      <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(to bottom, hsl(160, 70%, 45%), hsl(200, 90%, 50%))' }} />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('ai_center_results_title')}</h3>
          </div>
          {Object.entries(results).map(([key, result]) => {
          const mod = AI_MODULES.find((m) => m.id === key);
          return (
            <AIResultPanel
              key={key}
              result={result}
              title={mod?.title || key} />);


        })}
        </div>
      }

      {/* Create Signal Button */}
      {chartData && !showSignalCreator &&
      <button
        onClick={() => setShowSignalCreator(true)}
        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, hsl(160, 70%, 40%), hsl(200, 90%, 45%))',
          color: 'white',
          boxShadow: '0 4px 20px -4px hsla(160, 70%, 45%, 0.35)'
        }}>
        
          <Zap className="w-5 h-5" />
          {t('ai_center_create_signal')}
        </button>
      }

      {/* Signal Creator Form */}
      {showSignalCreator && chartData &&
      <AISignalCreator
        draft={{
          currencyPair: activeSymbol.replace('/', ''),
          action: (() => {
            const last = chartData.ohlcv[chartData.ohlcv.length - 1];
            const prev = chartData.ohlcv[chartData.ohlcv.length - 2];
            return last && prev && last.close > prev.close ? 'BUY' : 'SELL';
          })(),
          entryPrice: chartData.ohlcv[chartData.ohlcv.length - 1]?.close || 0,
          takeProfit: (() => {
            const last = chartData.ohlcv[chartData.ohlcv.length - 1];
            const prev = chartData.ohlcv[chartData.ohlcv.length - 2];
            const isBuy = last && prev && last.close > prev.close;
            const entry = last?.close || 0;
            const range = chartData.resistance - chartData.support;
            return isBuy ? entry + range * 0.5 : entry - range * 0.5;
          })(),
          stopLoss: (() => {
            const last = chartData.ohlcv[chartData.ohlcv.length - 1];
            const prev = chartData.ohlcv[chartData.ohlcv.length - 2];
            const isBuy = last && prev && last.close > prev.close;
            const entry = last?.close || 0;
            const range = chartData.resistance - chartData.support;
            return isBuy ? entry - range * 0.3 : entry + range * 0.3;
          })(),
          support: chartData.support,
          resistance: chartData.resistance,
          probability: 65,
          trend: (() => {
            const last = chartData.ohlcv[chartData.ohlcv.length - 1];
            const prev = chartData.ohlcv[chartData.ohlcv.length - 2];
            return last && prev && last.close > prev.close ? 'bullish' : 'bearish';
          })(),
          notes: (() => {
            const parts: string[] = [];
            if (results['synthesize-analysis']?.data) {
              const syn = results['synthesize-analysis'].data as Record<string, unknown>;
              if (syn.summary) parts.push(String(syn.summary));
              if (syn.recommendation) parts.push(`Recomendación: ${syn.recommendation}`);
            }
            if (results['analyze-patterns']?.data) {
              const pat = results['analyze-patterns'].data as Record<string, unknown>;
              if (pat.patterns) parts.push(`Patrones: ${JSON.stringify(pat.patterns).slice(0, 300)}`);
            }
            if (results['predict-signals']?.data) {
              const pred = results['predict-signals'].data as Record<string, unknown>;
              if (pred.prediction) parts.push(`Predicción: ${JSON.stringify(pred.prediction).slice(0, 300)}`);
            }
            return parts.join('\n\n').slice(0, 2000) || '';
          })(),
        }}
        onCreated={() => {setShowSignalCreator(false);onClose();}}
        onCancel={() => setShowSignalCreator(false)} />

      }
    </div>);

}
