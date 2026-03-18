import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle,
  ChevronDown, Loader2, FileWarning, ArrowRight,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { parseCSV, ParseResult, BROKER_PARSERS } from '@/lib/csv-parsers';
import { useImportedTrades } from '@/hooks/useImportedTrades';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'preview' | 'result';

export function TradeImportModal({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { importTrades, importing } = useImportedTrades();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number; errors: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setStep('upload');
    setParseResult(null);
    setSelectedBrokerId(null);
    setFileName('');
    setImportResult(null);
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt') && !file.name.endsWith('.tsv')) {
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSV(text, selectedBrokerId || undefined);
      setParseResult(result);
      setStep('preview');
    };
    reader.readAsText(file);
  }, [selectedBrokerId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRetryWithBroker = (brokerId: string) => {
    setSelectedBrokerId(brokerId);
    if (fileRef.current?.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = parseCSV(e.target?.result as string, brokerId);
        setParseResult(result);
      };
      reader.readAsText(fileRef.current.files[0]);
    }
  };

  const handleImport = async () => {
    if (!parseResult?.trades.length || !parseResult.broker) return;
    const result = await importTrades(parseResult.trades, parseResult.broker.id);
    setImportResult(result);
    setStep('result');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md bg-card border-border p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-foreground text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {step === 'upload' ? 'Importar CSV' : step === 'preview' ? 'Vista previa' : 'Resultado'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pb-5 space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <Upload className={cn("w-10 h-10 mx-auto mb-3", isDragging ? "text-primary" : "text-muted-foreground")} />
                <p className="text-sm text-foreground font-medium">Arrastra tu archivo CSV aquí</p>
                <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                <p className="text-[10px] text-muted-foreground mt-3">
                  Formatos soportados: MT4/MT5, cTrader, OANDA, Alpaca, Binance, NinjaTrader
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>

              {/* Manual broker selector */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">¿El formato no se detecta? Selecciona tu broker:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {BROKER_PARSERS.map(bp => (
                    <button
                      key={bp.id}
                      onClick={() => setSelectedBrokerId(bp.id)}
                      className={cn(
                        "text-[10px] px-2 py-1.5 rounded-lg border transition-colors",
                        selectedBrokerId === bp.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {bp.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy notice */}
              <div className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Tus datos se almacenan de forma segura en tu cuenta. No compartimos tu información de trading con terceros.
                </p>
              </div>
            </motion.div>
          )}

          {step === 'preview' && parseResult && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pb-5 space-y-4">
              {/* File info */}
              <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground font-medium truncate">{fileName}</p>
                  <p className="text-[10px] text-muted-foreground">{parseResult.rowCount} filas</p>
                </div>
                {parseResult.broker ? (
                  <span className="text-[10px] px-2 py-0.5 bg-primary/15 text-primary rounded-full font-medium">
                    {parseResult.broker.name}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 bg-destructive/15 text-destructive rounded-full font-medium">
                    No detectado
                  </span>
                )}
              </div>

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg space-y-1">
                  {parseResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive flex items-center gap-1.5">
                      <FileWarning className="w-3 h-3 flex-shrink-0" /> {e}
                    </p>
                  ))}
                  {!parseResult.broker && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {BROKER_PARSERS.map(bp => (
                        <button
                          key={bp.id}
                          onClick={() => handleRetryWithBroker(bp.id)}
                          className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                        >
                          {bp.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Trade preview */}
              {parseResult.trades.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground font-medium">
                      {parseResult.trades.length} operaciones detectadas
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {parseResult.trades.filter(t => t.status === 'open').length} abiertas
                    </span>
                  </div>

                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      {parseResult.trades.slice(0, 20).map((trade, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                              trade.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                            )}>
                              {trade.side}
                            </span>
                            <span className="text-xs text-foreground font-medium">{trade.symbol}</span>
                            <span className="text-[10px] text-muted-foreground">{trade.quantity}</span>
                          </div>
                          <span className={cn(
                            "text-xs font-semibold tabular-nums",
                            trade.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                          )}>
                            {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {parseResult.trades.length > 20 && (
                        <p className="text-center text-[10px] text-muted-foreground py-2">
                          +{parseResult.trades.length - 20} operaciones más...
                        </p>
                      )}
                    </div>
                  </ScrollArea>

                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="w-full"
                  >
                    {importing ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Importando...</>
                    ) : (
                      <><ArrowRight className="w-4 h-4 mr-2" /> Importar {parseResult.trades.length} operaciones</>
                    )}
                  </Button>
                </>
              )}

              <Button variant="ghost" onClick={reset} className="w-full text-xs">
                ← Seleccionar otro archivo
              </Button>
            </motion.div>
          )}

          {step === 'result' && importResult && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-5 pb-5 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{importResult.imported} importadas</p>
                {importResult.duplicates > 0 && (
                  <p className="text-xs text-muted-foreground">{importResult.duplicates} duplicados omitidos</p>
                )}
                {importResult.errors > 0 && (
                  <p className="text-xs text-destructive">{importResult.errors} errores</p>
                )}
              </div>
              <Button onClick={() => { reset(); onOpenChange(false); }} className="w-full">
                Ver portafolio
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
