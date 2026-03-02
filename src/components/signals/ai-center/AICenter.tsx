import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Brain, BarChart3, Target, FileText, Layers, Search,
  Play, Loader2, ChevronLeft, Sparkles, TrendingUp, AlertTriangle, Zap
} from 'lucide-react';
import { AIModelConfig, AIModelSettings } from './AIModelConfig';
import { AIModuleCard } from './AIModuleCard';
import { AIResultPanel } from './AIResultPanel';
import { AIChartPanel } from './AIChartPanel';
import { AISignalCreator } from './AISignalCreator';
import { useForexData } from '@/hooks/useForexData';
import { useAIAnalysis, AIModule } from '@/hooks/useAIAnalysis';
import { computeIndicators, type OHLCVCandle } from '@/lib/indicators';
import { detectCandlePatterns } from '@/lib/candle-patterns';

interface Props {
  onClose: () => void;
}

const POPULAR_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
  'AUD/USD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY',
  'GBP/JPY', 'XAU/USD',
];

type ModuleStatus = 'idle' | 'running' | 'done' | 'error';

export function AICenter({ onClose }: Props) {
  const [symbol, setSymbol] = useState('EUR/USD');
  const [customSymbol, setCustomSymbol] = useState('');
  const [modelSettings, setModelSettings] = useState<AIModelSettings>({
    model: 'google/gemini-2.5-flash',
    temperature: 0.3,
    maxTokens: 4096,
  });
  const [moduleStatuses, setModuleStatuses] = useState<Record<string, ModuleStatus>>({});
  const [showConfig, setShowConfig] = useState(false);
  const [showSignalCreator, setShowSignalCreator] = useState(false);

  const { data: forexData, loading: forexLoading, error: forexError, fetchData } = useForexData();
  const { results, loading: aiLoading, error: aiError, runModule, runFullAnalysis } = useAIAnalysis();

  const activeSymbol = customSymbol || symbol;
  const yahooSymbol = activeSymbol.replace('/', '') + '=X';

  const handleFetchData = useCallback(async () => {
    await fetchData(yahooSymbol, '1d', '3mo');
  }, [fetchData, yahooSymbol]);

  const computeAllIndicators = useCallback(() => {
    if (!forexData?.candles) return null;
    const ohlcv: OHLCVCandle[] = forexData.candles.map(c => ({
      time: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume
    }));
    const indicators = computeIndicators(ohlcv, {
      ema20: true, ema50: true, ema200: true,
      sessionSydney: false, sessionTokyo: false, sessionLondon: false, sessionNewYork: false,
      kzLondonOpen: false, kzNewYorkOpen: false, kzLondonNYOverlap: false, kzAsianRange: false,
      kzHours: { ldnOpen: [7,9], nyOpen: [12,14], ldnNyOverlap: [12,16], asianRange: [0,4] },
    });
    const patterns = detectCandlePatterns(ohlcv);
    return { ...indicators, patterns };
  }, [forexData]);

  // Precomputed chart data with S/R, patterns, EMAs
  const chartData = useMemo(() => {
    if (!forexData?.candles) return null;
    const ohlcv: OHLCVCandle[] = forexData.candles.map(c => ({
      time: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume
    }));
    const ind = computeIndicators(ohlcv, {
      ema20: true, ema50: true, ema200: false,
      sessionSydney: false, sessionTokyo: false, sessionLondon: false, sessionNewYork: false,
      kzLondonOpen: false, kzNewYorkOpen: false, kzLondonNYOverlap: false, kzAsianRange: false,
      kzHours: { ldnOpen: [7,9], nyOpen: [12,14], ldnNyOverlap: [12,16], asianRange: [0,4] },
    });
    const patterns = detectCandlePatterns(ohlcv);
    const recent = ohlcv.slice(-24);
    const support = Math.min(...recent.map(c => c.low));
    const resistance = Math.max(...recent.map(c => c.high));
    return { ohlcv, patterns, support, resistance, ema20: ind.ema20, ema50: ind.ema50 };
  }, [forexData]);

  const handleRunModule = useCallback(async (module: AIModule) => {
    if (!forexData?.candles) {
      await handleFetchData();
    }
    setModuleStatuses(prev => ({ ...prev, [module]: 'running' }));
    const indicators = computeAllIndicators();
    const result = await runModule(module, {
      symbol: activeSymbol,
      candles: forexData?.candles || [],
      indicators,
      model: modelSettings.model,
      temperature: modelSettings.temperature,
    });
    setModuleStatuses(prev => ({
      ...prev,
      [module]: result ? 'done' : 'error'
    }));
  }, [forexData, handleFetchData, computeAllIndicators, runModule, activeSymbol, modelSettings]);

  const handleRunAll = useCallback(async () => {
    if (!forexData?.candles) {
      await handleFetchData();
    }
    const indicators = computeAllIndicators();
    const modules: AIModule[] = ['analyze-patterns', 'predict-signals', 'generate-report', 'synthesize-analysis'];
    for (const mod of modules) {
      setModuleStatuses(prev => ({ ...prev, [mod]: 'running' }));
    }
    const allResults = await runFullAnalysis(activeSymbol, forexData?.candles || [], indicators);
    const newStatuses: Record<string, ModuleStatus> = {};
    modules.forEach(mod => {
      newStatuses[mod] = allResults?.[mod] ? 'done' : 'error';
    });
    setModuleStatuses(prev => ({ ...prev, ...newStatuses }));
  }, [forexData, handleFetchData, computeAllIndicators, runFullAnalysis, activeSymbol]);

  const AI_MODULES: { id: AIModule; title: string; desc: string; icon: typeof Brain }[] = [
    { id: 'analyze-patterns', title: 'Análisis de Patrones', desc: 'Detecta formaciones y patrones de velas con IA', icon: BarChart3 },
    { id: 'predict-signals', title: 'Predicción de Señales', desc: 'Genera señales de trading inteligentes', icon: Target },
    { id: 'generate-report', title: 'Reporte Profesional', desc: 'Informe técnico detallado del mercado', icon: FileText },
    { id: 'synthesize-analysis', title: 'Síntesis Multi-Modelo', desc: 'Análisis combinado con múltiples perspectivas', icon: Layers },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Centro de Análisis IA
          </h2>
          <p className="text-xs text-muted-foreground">Análisis multi-modelo con indicadores técnicos</p>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            showConfig ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      {/* Model Config (collapsible) */}
      {showConfig && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <AIModelConfig settings={modelSettings} onChange={setModelSettings} />
        </div>
      )}

      {/* Symbol Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Par personalizado (ej: USD/CAD)"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleFetchData}
            disabled={forexLoading}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {forexLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            Datos
          </button>
        </div>

        {/* Quick pair chips */}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_PAIRS.map((pair) => (
            <button
              key={pair}
              onClick={() => { setSymbol(pair); setCustomSymbol(''); }}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                (activeSymbol === pair && !customSymbol)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {pair}
            </button>
          ))}
        </div>
      </div>

      {/* Data Status */}
      {forexData && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bullish/5 border border-bullish/20">
          <div className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
          <span className="text-xs text-foreground font-medium">{forexData.symbol}</span>
          <span className="text-xs text-muted-foreground">
            {forexData.candles.length} velas cargadas
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            Último: {forexData.candles[forexData.candles.length - 1]?.close.toFixed(5)}
          </span>
        </div>
      )}
      {forexError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-xs text-destructive">{forexError}</span>
        </div>
      )}

      {/* Interactive Candlestick Chart */}
      {chartData && (
        <AIChartPanel
          candles={chartData.ohlcv}
          patterns={chartData.patterns}
          support={chartData.support}
          resistance={chartData.resistance}
          ema20={chartData.ema20}
          ema50={chartData.ema50}
          symbol={activeSymbol}
        />
      )}

      {/* Run All Button */}
      <button
        onClick={handleRunAll}
        disabled={aiLoading || !forexData}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {aiLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Play className="w-5 h-5" />
        )}
        Ejecutar Análisis Completo
      </button>

      {/* AI Modules */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Módulos de Análisis</h3>
        <div className="grid gap-2">
          {AI_MODULES.map((mod) => (
            <AIModuleCard
              key={mod.id}
              title={mod.title}
              description={mod.desc}
              icon={mod.icon}
              status={moduleStatuses[mod.id] || 'idle'}
              onRun={() => handleRunModule(mod.id)}
              disabled={!forexData || aiLoading}
            />
          ))}
        </div>
      </div>

      {/* Error */}
      {aiError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-xs text-destructive">{aiError}</span>
        </div>
      )}

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resultados</h3>
          {Object.entries(results).map(([key, result]) => {
            const mod = AI_MODULES.find(m => m.id === key);
            return (
              <AIResultPanel
                key={key}
                result={result}
                title={mod?.title || key}
              />
            );
          })}
        </div>
      )}

      {/* Create Signal Button */}
      {chartData && !showSignalCreator && (
        <button
          onClick={() => setShowSignalCreator(true)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-bullish to-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Zap className="w-5 h-5" />
          Crear Señal desde Análisis IA
        </button>
      )}

      {/* Signal Creator Form */}
      {showSignalCreator && chartData && (
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
          }}
          onCreated={() => { setShowSignalCreator(false); onClose(); }}
          onCancel={() => setShowSignalCreator(false)}
        />
      )}
    </div>
  );
}
