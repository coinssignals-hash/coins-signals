import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { AICenter as AICenterPanel } from '@/components/signals/ai-center/AICenter';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

export default function AICenter() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <PageShell>
      <Header />
      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(165deg, hsl(200 80% 55% / 0.15) 0%, hsl(var(--background)) 50%)',
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: 'linear-gradient(90deg, transparent, hsl(200 80% 55% / 0.8), transparent)',
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full opacity-20 pointer-events-none" style={{
          background: 'radial-gradient(circle, hsl(200 80% 55% / 0.5), transparent 70%)',
        }} />
        <div className="relative px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90"
              style={{ background: 'hsl(200 80% 55% / 0.1)', border: '1px solid hsl(200 80% 55% / 0.2)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'hsl(200 80% 55%)' }} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(165deg, hsl(200 80% 55% / 0.25), hsl(200 80% 55% / 0.08))',
                border: '1px solid hsl(200 80% 55% / 0.3)',
                boxShadow: '0 0 20px hsl(200 80% 55% / 0.15)',
              }}>
                <Brain className="w-5 h-5" style={{ color: 'hsl(200 80% 55%)' }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">{t('drawer_ai_center') || 'Centro de IA'}</h1>
                <p className="text-[11px] text-muted-foreground">Análisis inteligente con IA</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-24">
        <AICenterPanel onClose={() => navigate(-1)} />
      </div>
    </PageShell>
  );
}
