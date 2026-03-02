import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { ServiceCard } from '@/components/monitoring/ServiceCard';
import { ResourceChart } from '@/components/monitoring/ResourceChart';
import { LogsViewer } from '@/components/monitoring/LogsViewer';
import { ContainerStats } from '@/components/monitoring/ContainerStats';
import { CacheStatsPanel } from '@/components/monitoring/CacheStatsPanel';
import { mockServices, mockContainerStats, generateResourceHistory, generateMockLogs } from '@/data/mockMonitoring';
import { ResourceUsage, LogEntry } from '@/types/monitoring';
import { RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Monitoring = () => {
  const [resourceHistory, setResourceHistory] = useState<ResourceUsage[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    setResourceHistory(generateResourceHistory());
    setLogs(generateMockLogs(50));
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setResourceHistory((prev) => {
        const newData = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        newData.push({
          timestamp: new Date(),
          cpu: Math.max(0, Math.min(100, last.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.max(0, Math.min(100, last.memory + (Math.random() - 0.5) * 5)),
          network: {
            in: Math.random() * 100,
            out: Math.random() * 80,
          },
        });
        return newData;
      });
      
      // Add new log occasionally
      if (Math.random() > 0.7) {
        const newLogs = generateMockLogs(1);
        setLogs((prev) => [...newLogs, ...prev].slice(0, 100));
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setResourceHistory(generateResourceHistory());
      setLogs(generateMockLogs(50));
      setIsRefreshing(false);
    }, 1000);
  };
  
  const handleClearLogs = () => {
    setLogs([]);
  };
  
  return (
    <PageShell>
      <Header />
      
      <main className="py-4 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Docker Monitor</h1>
              <p className="text-sm text-muted-foreground">Real-time service monitoring</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* AI Cache Stats */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">AI Analysis Cache</h2>
          <CacheStatsPanel />
        </section>
        
        {/* Service Status Grid */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Services</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mockServices.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>
        </section>
        
        {/* Resource Charts */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Resource Usage (Last Hour)</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <ResourceChart data={resourceHistory} type="cpu" title="CPU Usage %" />
            <ResourceChart data={resourceHistory} type="memory" title="Memory Usage %" />
            <ResourceChart data={resourceHistory} type="network" title="Network I/O" />
          </div>
        </section>
        
        {/* Container Stats Table */}
        <ContainerStats stats={mockContainerStats} />
        
        {/* Logs Viewer */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Application Logs</h2>
          <LogsViewer logs={logs} onClear={handleClearLogs} />
        </section>
      </main>
    </PageShell>
  );
};

export default Monitoring;
