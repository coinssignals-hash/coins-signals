import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity } from 'lucide-react';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { PaperStatsRow } from '@/components/paper-trading/PaperStatsRow';
import { PaperTradePanel } from '@/components/paper-trading/PaperTradePanel';
import { PaperPositionsList } from '@/components/paper-trading/PaperPositionsList';
import { PaperTradeHistory } from '@/components/paper-trading/PaperTradeHistory';

const ACCENT = '270 70% 60%';

export default function PaperTrading() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'trade' | 'positions' | 'history'>('trade');
  const {
    balance, positions, history, prices, totalPnl, winRate,
    instruments, openPosition, closePosition, resetAccount, getPositionPnl,
  } = usePaperTrading();

  return (
    <PageShell>
      <Header />
      <div className="relative overflow-hidden" style={{
        background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15) 0%, hsl(var(--background)) 50%)`,
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.8), transparent)`,
        }} />
        <div className="relative px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90"
              style={{ background: `hsl(${ACCENT} / 0.1)`, border: `1px solid hsl(${ACCENT} / 0.2)` }}>
              <ArrowLeft className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: `linear-gradient(165deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.08))`,
                border: `1px solid hsl(${ACCENT} / 0.3)`,
                boxShadow: `0 0 20px hsl(${ACCENT} / 0.15)`,
              }}>
                <Activity className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">{t('paper_trading_title') || 'Paper Trading'}</h1>
                <p className="text-[11px] text-muted-foreground">Practica sin riesgo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-4">
        <PaperStatsRow balance={balance} totalPnl={totalPnl} winRate={winRate} />

        <div className="flex rounded-xl p-1" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.3)' }}>
          {(['trade', 'positions', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all"
              style={tab === t ? {
                background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
                color: 'white',
                boxShadow: `0 2px 8px hsl(${ACCENT} / 0.3)`,
              } : { color: 'hsl(var(--muted-foreground))' }}>
              {t === 'trade' ? 'Operar' : t === 'positions' ? `Posiciones (${positions.length})` : `Historial (${history.length})`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tab === 'trade' && <PaperTradePanel instruments={instruments} prices={prices} onOpen={openPosition} onReset={resetAccount} balance={balance} />}
            {tab === 'positions' && <PaperPositionsList positions={positions} getPnl={getPositionPnl} onClose={closePosition} />}
            {tab === 'history' && <PaperTradeHistory history={history} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
