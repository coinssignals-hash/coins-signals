import { useState, useEffect, useRef } from 'react';
import { LogEntry } from '@/types/monitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Pause, Play, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LogsViewerProps {
  logs: LogEntry[];
  onClear?: () => void;
}

const levelStyles = {
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  warn: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  debug: 'bg-muted text-muted-foreground border-border',
};

const serviceColors: Record<string, string> = {
  frontend: 'text-purple-400',
  backend: 'text-green-400',
  mongodb: 'text-emerald-400',
  redis: 'text-red-400',
};

export const LogsViewer = ({ logs, onClear }: LogsViewerProps) => {
  const [filter, setFilter] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set(['info', 'warn', 'error', 'debug']));
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const filteredLogs = logs.filter((log) => {
    if (!selectedLevels.has(log.level)) return false;
    if (!filter) return true;
    return (
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.service.toLowerCase().includes(filter.toLowerCase())
    );
  });
  
  const toggleLevel = (level: string) => {
    const newLevels = new Set(selectedLevels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    setSelectedLevels(newLevels);
  };
  
  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, isPaused]);
  
  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">Live Logs</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClear}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 h-9 bg-muted/50"
            />
          </div>
          <div className="flex gap-1">
            {(['info', 'warn', 'error', 'debug'] as const).map((level) => (
              <Badge
                key={level}
                variant="outline"
                className={cn(
                  'cursor-pointer transition-opacity uppercase text-xs',
                  levelStyles[level],
                  !selectedLevels.has(level) && 'opacity-30'
                )}
                onClick={() => toggleLevel(level)}
              >
                {level}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]" ref={scrollRef}>
          <div className="space-y-0.5 p-4 pt-0 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No logs matching filter</p>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <span className="text-muted-foreground shrink-0">
                    {format(log.timestamp, 'HH:mm:ss.SSS')}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 uppercase text-[10px] px-1.5', levelStyles[log.level])}
                  >
                    {log.level}
                  </Badge>
                  <span className={cn('shrink-0 w-16', serviceColors[log.service] || 'text-foreground')}>
                    [{log.service}]
                  </span>
                  <span className="text-foreground break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
