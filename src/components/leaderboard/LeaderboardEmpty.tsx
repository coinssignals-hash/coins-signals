import { Trophy } from 'lucide-react';
import { GlowSection } from '@/components/ui/glow-section';

interface Props {
  accent: string;
}

export function LeaderboardEmpty({ accent }: Props) {
  return (
    <GlowSection color={accent}>
      <div className="p-8 text-center space-y-2">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{
          background: `linear-gradient(165deg, hsl(${accent} / 0.15), hsl(var(--background)))`,
          border: `1px solid hsl(${accent} / 0.15)`,
        }}>
          <Trophy className="w-6 h-6" style={{ color: `hsl(${accent} / 0.5)` }} />
        </div>
        <p className="text-sm text-muted-foreground">No hay datos de trading aún</p>
        <p className="text-xs text-muted-foreground/70">Importa tus operaciones desde el Portfolio para aparecer en el ranking</p>
      </div>
    </GlowSection>
  );
}
