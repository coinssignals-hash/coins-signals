import { ContainerStats as ContainerStatsType } from '@/types/monitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ContainerStatsProps {
  stats: ContainerStatsType[];
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

export const ContainerStats = ({ stats }: ContainerStatsProps) => {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground">Container Resources</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Container</TableHead>
              <TableHead className="text-xs">CPU</TableHead>
              <TableHead className="text-xs">Memory</TableHead>
              <TableHead className="text-xs">Network I/O</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((container) => {
              const memoryPercent = (container.memoryUsage / container.memoryLimit) * 100;
              
              return (
                <TableRow key={container.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground capitalize py-3">
                    {container.name}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={container.cpu} 
                        className={cn(
                          'w-16 h-2',
                          container.cpu > 80 && '[&>div]:bg-destructive',
                          container.cpu > 50 && container.cpu <= 80 && '[&>div]:bg-yellow-500',
                          container.cpu <= 50 && '[&>div]:bg-green-500'
                        )}
                      />
                      <span className="text-xs text-muted-foreground w-12">
                        {container.cpu.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={memoryPercent} 
                        className={cn(
                          'w-16 h-2',
                          memoryPercent > 80 && '[&>div]:bg-destructive',
                          memoryPercent > 50 && memoryPercent <= 80 && '[&>div]:bg-yellow-500',
                          memoryPercent <= 50 && '[&>div]:bg-green-500'
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {container.memoryUsage}MB / {container.memoryLimit}MB
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    <span className="text-green-400">↓{formatBytes(container.networkRx)}</span>
                    {' / '}
                    <span className="text-orange-400">↑{formatBytes(container.networkTx)}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
