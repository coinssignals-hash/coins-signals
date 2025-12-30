import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface AIRefreshOverlayProps {
  isRefreshing: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AIRefreshOverlay({ isRefreshing, children, className }: AIRefreshOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Animated border glow when refreshing */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg transition-all duration-500 pointer-events-none',
          isRefreshing && 'animate-pulse ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
        )}
      />
      
      {/* Content with fade effect */}
      <div
        className={cn(
          'transition-opacity duration-300',
          isRefreshing && 'opacity-60'
        )}
      >
        {children}
      </div>

      {/* Floating AI indicator */}
      {isRefreshing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-purple-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 animate-bounce shadow-lg">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Analizando con IA...</span>
          </div>
        </div>
      )}
    </div>
  );
}
