import { Search, TrendingUp, Briefcase, Gem, BarChart3, Bitcoin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';

interface BrokerSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onAdvancedSearch: () => void;
}

const categoryIcons = [
  { id: 'forex', nameKey: 'broker_cat_forex', subKey: 'broker_cat_forex_sub', icon: TrendingUp },
  { id: 'acciones', nameKey: 'broker_cat_stocks', subKey: 'broker_cat_stocks_sub', icon: Briefcase },
  { id: 'materias', nameKey: 'broker_cat_commodities', subKey: 'broker_cat_commodities_sub', icon: Gem },
  { id: 'bursatiles', nameKey: 'broker_cat_futures', subKey: 'broker_cat_futures_sub', icon: BarChart3 },
  { id: 'crypto', nameKey: 'broker_cat_crypto', icon: Bitcoin },
];

export function BrokerSearch({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onAdvancedSearch,
}: BrokerSearchProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{t('bk_search_broker')}</h3>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('bk_search_placeholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 justify-start bg-secondary border-border"
              onClick={onAdvancedSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              {t('bk_beginner_label')}
            </Button>
            <div className="text-xs text-muted-foreground flex-1">
              <p>{t('bk_broker_for_you')}</p>
              <p>{t('bk_broker_tip_text')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categoryIcons.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(isSelected ? null : cat.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg min-w-[80px] transition-colors ${
                isSelected
                  ? 'bg-primary/20 border border-primary'
                  : 'bg-secondary border border-transparent'
              }`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/30' : 'bg-card'}`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-[10px] text-center leading-tight ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                {t(cat.nameKey)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        {t('bk_popular_text')}
      </p>
    </div>
  );
}
