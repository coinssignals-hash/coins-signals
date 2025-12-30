import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIRegenerateButtonProps {
  onClick: (e?: React.MouseEvent) => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showLabel?: boolean;
}

export function AIRegenerateButton({
  onClick,
  isLoading = false,
  disabled = false,
  size = 'sm',
  variant = 'outline',
  className,
  showLabel = true
}: AIRegenerateButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'gap-1.5 border-purple-500/50 hover:bg-purple-500/20 hover:border-purple-400',
        'text-purple-400 hover:text-purple-300',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      {showLabel && (
        <span className="text-xs">
          {isLoading ? 'Generando...' : 'IA'}
        </span>
      )}
    </Button>
  );
}
