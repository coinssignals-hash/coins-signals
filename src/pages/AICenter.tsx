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
      <div className="px-4 py-4 pb-24">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-3 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{t('nav_back')}</span>
        </button>

        <AICenterPanel onClose={() => navigate(-1)} />
      </div>
    </PageShell>
  );
}
