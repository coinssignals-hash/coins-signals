import { Link } from 'react-router-dom';
import { NewsListItem } from '@/types/news';
import { CurrencyBadgeList } from './CurrencyBadge';
import { CategoryBadge } from './CategoryBadge';
import { LivePriceCircle } from './LivePriceCircle';
import { cn } from '@/lib/utils';
import { Clock, ExternalLink } from 'lucide-react';

interface NewsCardProps {
  news: NewsListItem;
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
}

export function NewsCard({ news, variant = 'default', className }: NewsCardProps) {
  if (variant === 'featured') {
    return <FeaturedNewsCard news={news} className={className} />;
  }
  
  if (variant === 'compact') {
    return <CompactNewsCard news={news} className={className} />;
  }
  
  return (
    <Link
      to={`/news/${news.id}`}
      className={cn(
        'group block rounded-lg overflow-hidden bg-card border border-border',
        'transition-all duration-300 hover:border-primary/30 hover:shadow-lg',
        'news-card',
        className
      )}
    >
      {/* Image */}
      {news.image_url && (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={news.image_url}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2">
            <CategoryBadge category={news.category} />
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {news.title}
          </h3>
          <LivePriceCircle currencies={news.affected_currencies} size="sm" />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">{news.source}</span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {news.time_ago}
            </span>
          </div>
        </div>
        
        <CurrencyBadgeList currencies={news.affected_currencies} size="sm" />
      </div>
    </Link>
  );
}

function FeaturedNewsCard({ news, className }: { news: NewsListItem; className?: string }) {
  return (
    <Link
      to={`/news/${news.id}`}
      className={cn(
        'group block rounded-xl overflow-hidden bg-card border border-border',
        'transition-all duration-300 hover:border-primary/30',
        className
      )}
    >
      <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden">
        {news.image_url && (
          <img
            src={news.image_url}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 space-y-3">
          <CategoryBadge category={news.category} />
          
          <div className="flex items-start gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors flex-1">
              {news.title}
            </h2>
            <LivePriceCircle currencies={news.affected_currencies} size="md" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{news.source}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {news.time_ago}
              </span>
            </div>
            
            <CurrencyBadgeList currencies={news.affected_currencies} size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function CompactNewsCard({ news, className }: { news: NewsListItem; className?: string }) {
  return (
    <Link
      to={`/news/${news.id}`}
      className={cn(
        'group flex gap-3 p-3 rounded-lg bg-card border border-border',
        'transition-all duration-200 hover:border-primary/30 hover:bg-secondary/50',
        className
      )}
    >
      {news.image_url && (
        <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden">
          <img
            src={news.image_url}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start gap-2">
          <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {news.title}
          </h4>
          <LivePriceCircle currencies={news.affected_currencies} size="sm" />
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{news.source}</span>
          <span>•</span>
          <span>{news.time_ago}</span>
        </div>
        
        <CurrencyBadgeList currencies={news.affected_currencies} maxVisible={3} size="sm" />
      </div>
    </Link>
  );
}
