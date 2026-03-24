import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
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
    pairs, openPosition, closePosition, resetAccount, getPositionPnl,
  } = usePaperTrading();

  return (
    <PageShell>
      <Header />
      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-4">
        <PaperStatsRow balance={balance} totalPnl={totalPnl} winRate={winRate} />

        {/* Tab bar */}
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
            {tab === 'trade' && <PaperTradePanel pairs={pairs} prices={prices} onOpen={openPosition} onReset={resetAccount} />}
            {tab === 'positions' && <PaperPositionsList positions={positions} getPnl={getPositionPnl} onClose={closePosition} />}
            {tab === 'history' && <PaperTradeHistory history={history} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
