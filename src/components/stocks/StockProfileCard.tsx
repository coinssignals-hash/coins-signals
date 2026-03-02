import { Card } from '@/components/ui/card';
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
      <Card className="p-4 bg-card border-border space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-4 bg-card border-border">
        <p className="text-sm text-muted-foreground text-center py-4">Perfil no disponible</p>
      </Card>
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
    <Card className="p-4 bg-card border-border space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {profile.image && (
          <img
            src={profile.image}
            alt={profile.companyName}
            className="w-10 h-10 rounded-lg bg-secondary object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate">{profile.companyName}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px]">{profile.symbol}</Badge>
            {profile.sector && <Badge className="text-[10px] bg-primary/10 text-primary border-0">{profile.sector}</Badge>}
          </div>
        </div>
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        )}
      </div>

      {/* Description */}
      {profile.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
          {profile.description}
        </p>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2">
        {info.map((item) => {
          const Icon = item.icon;
          return item.value ? (
            <div key={item.label} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
              <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-xs font-medium text-foreground truncate">{item.value}</p>
              </div>
            </div>
          ) : null;
        })}
      </div>
    </Card>
  );
}
