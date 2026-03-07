import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Globe, Users, ExternalLink } from 'lucide-react';
import type { StockProfile } from '@/hooks/useStockData';

interface StockProfileCardProps {
  profile: StockProfile | undefined;
  loading: boolean;
}

export function StockProfileCard({ profile, loading }: StockProfileCardProps) {
  if (loading) {
    return (
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4 space-y-3"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
        <Skeleton className="h-6 w-48 bg-slate-800/50" />
        <Skeleton className="h-20 w-full bg-slate-800/50" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
        <p className="text-sm text-slate-500 text-center py-4">Perfil no disponible</p>
      </div>
    );
  }

  const info = [
    { icon: Building2, label: 'Sector', value: profile.sector },
    { icon: Building2, label: 'Industria', value: profile.industry },
    { icon: Globe, label: 'País', value: profile.country },
    { icon: Users, label: 'CEO', value: profile.ceo },
    { icon: Users, label: 'Empleados', value: profile.fullTimeEmployees ? Number(profile.fullTimeEmployees).toLocaleString() : 'N/A' },
    { icon: Globe, label: 'Exchange', value: profile.exchange },
    { icon: Globe, label: 'IPO', value: profile.ipoDate },
    { icon: Building2, label: 'Beta', value: profile.beta?.toFixed(2) },
  ];

  return (
    <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
      
      <div className="absolute top-0 left-[15%] right-[15%] h-[1px]" style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />
      
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          {profile.image && (
            <img
              src={profile.image}
              alt={profile.companyName}
              className="w-10 h-10 rounded-lg bg-[hsl(210,40%,12%)] object-contain border border-cyan-800/20"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{profile.companyName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] border-cyan-800/30 text-cyan-300/60">{profile.symbol}</Badge>
              {profile.sector && <Badge className="text-[10px] bg-cyan-500/10 text-cyan-300 border-0">{profile.sector}</Badge>}
            </div>
          </div>
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[hsl(210,40%,12%)] border border-cyan-800/20 hover:border-cyan-600/40 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400/60" />
            </a>
          )}
        </div>

        {/* Description */}
        {profile.description && (
          <p className="text-xs text-cyan-200/50 leading-relaxed line-clamp-4">
            {profile.description}
          </p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          {info.map((item) => {
            const Icon = item.icon;
            return item.value ? (
              <div key={item.label} className="flex items-center gap-2 bg-[hsl(210,50%,10%)]/80 border border-cyan-800/15 rounded-lg p-2">
                <Icon className="w-3.5 h-3.5 text-cyan-400/60 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-cyan-300/40">{item.label}</p>
                  <p className="text-xs font-medium text-white truncate">{item.value}</p>
                </div>
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
