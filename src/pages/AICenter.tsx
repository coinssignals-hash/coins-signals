import { PageShell } from '@/components/layout/PageShell';
import { AICenter as AICenterPanel } from '@/components/signals/ai-center/AICenter';
import { useNavigate } from 'react-router-dom';

export default function AICenter() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <div className="px-4 py-4 pb-24">
        <AICenterPanel onClose={() => navigate(-1)} />
      </div>
    </PageShell>
  );
}
