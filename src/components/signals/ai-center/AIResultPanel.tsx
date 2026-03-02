import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Copy, Check, FileText } from 'lucide-react';
import { AIAnalysisResult } from '@/hooks/useAIAnalysis';

interface Props {
  result: AIAnalysisResult;
  title: string;
}

export function AIResultPanel({ result, title }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const content = typeof result.data === 'string'
    ? result.data
    : JSON.stringify(result.data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Try to parse structured data for display
  const structured = typeof result.data === 'object' && result.data !== null ? result.data as Record<string, unknown> : null;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 hover:bg-secondary/30 transition-colors"
      >
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground flex-1 text-left">{title}</span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(result.timestamp).toLocaleTimeString()}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Quick stats if structured */}
          {structured && (
            <div className="grid grid-cols-2 gap-2 p-3 border-b border-border">
              {Object.entries(structured).slice(0, 4).map(([key, val]) => {
                if (typeof val === 'object') return null;
                return (
                  <div key={key} className="text-xs">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                    <span className="text-foreground font-medium">{String(val)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-bullish" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre className="p-3 text-xs text-muted-foreground font-mono overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
              {content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
