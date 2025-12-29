export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting';
  uptime: string;
  port: number;
  healthCheck: boolean;
}

export interface ResourceUsage {
  timestamp: Date;
  cpu: number;
  memory: number;
  network: {
    in: number;
    out: number;
  };
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface ContainerStats {
  id: string;
  name: string;
  cpu: number;
  memoryUsage: number;
  memoryLimit: number;
  networkRx: number;
  networkTx: number;
}
