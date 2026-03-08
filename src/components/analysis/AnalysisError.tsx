import { AlertTriangle, RefreshCw, WifiOff, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';

interface AnalysisErrorProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  compact?: boolean;
}

export function AnalysisError({ 
  title,
  message,
  error,
  onRetry,
  compact = false
}: AnalysisErrorProps) {
  const { t } = useTranslation();
  // Determine error type for better messaging
  const getErrorDetails = () => {
    if (!error) {
      return {
        icon: AlertTriangle,
        defaultMessage: t('ae_default'),
        isNetwork: false,
      };
    }

    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
      return {
        icon: WifiOff,
        defaultMessage: t('ae_network'),
        isNetwork: true,
      };
    }
    
    if (errorMessage.includes('500') || errorMessage.includes('server')) {
      return {
        icon: Server,
        defaultMessage: t('ae_server'),
        isNetwork: false,
      };
    }
    
    if (errorMessage.includes('404')) {
      return {
        icon: AlertTriangle,
        defaultMessage: t('ae_not_found'),
        isNetwork: false,
      };
    }
    
    if (errorMessage.includes('timeout')) {
      return {
        icon: WifiOff,
        defaultMessage: t('ae_timeout'),
        isNetwork: true,
      };
    }

    return {
      icon: AlertTriangle,
      defaultMessage: t('ae_unexpected'),
      isNetwork: false,
    };
  };

  const { icon: Icon, defaultMessage, isNetwork } = getErrorDetails();
  const displayMessage = message || defaultMessage;

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <Icon className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-red-400 text-sm flex-1">{displayMessage}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/20"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#0a1a0a] border border-red-500/30 rounded-lg p-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-3 rounded-full ${isNetwork ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
          <Icon className={`w-6 h-6 ${isNetwork ? 'text-yellow-400' : 'text-red-400'}`} />
        </div>
        
        <div className="space-y-1">
          <h4 className="text-white font-semibold text-sm">{title || t('ae_title')}</h4>
          <p className="text-gray-400 text-sm max-w-xs">{displayMessage}</p>
        </div>
        
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        )}
        
        {error && import.meta.env.DEV && (
          <details className="mt-2 text-left w-full">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
              Detalles técnicos
            </summary>
            <pre className="mt-2 p-2 bg-black/50 rounded text-xs text-gray-500 overflow-auto max-h-20">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
