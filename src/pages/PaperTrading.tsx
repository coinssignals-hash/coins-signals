import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslation } from '@/i18n/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { PaperStatsRow } from '@/components/paper-trading/PaperStatsRow';
import { PaperTradePanel } from '@/components/paper-trading/PaperTradePanel';
import { PaperPositionsList } from '@/components/paper-trading/PaperPositionsList';
import { PaperTradeHistory } from '@/components/paper-trading/PaperTradeHistory';

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
      <div className="space-y-4 pb-24 px-4 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/tools')} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-bold text-foreground">{t('paper_trading_title') || 'Paper Trading'}</h1>
        </div>

        <PaperStatsRow balance={balance} totalPnl={totalPnl} winRate={winRate} />

        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
          {(['trade', 'positions', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {t === 'trade' ? 'Operar' : t === 'positions' ? `Posiciones (${positions.length})` : `Historial (${history.length})`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tab === 'trade' && (
              <PaperTradePanel pairs={pairs} prices={prices} onOpen={openPosition} onReset={resetAccount} />
            )}
            {tab === 'positions' && (
              <PaperPositionsList positions={positions} getPnl={getPositionPnl} onClose={closePosition} />
            )}
            {tab === 'history' && (
              <PaperTradeHistory history={history} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
