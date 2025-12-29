import { ServiceStatus, ResourceUsage, LogEntry, ContainerStats } from '@/types/monitoring';

export const mockServices: ServiceStatus[] = [
  { name: 'frontend', status: 'running', uptime: '2d 5h 32m', port: 3000, healthCheck: true },
  { name: 'backend', status: 'running', uptime: '2d 5h 30m', port: 8000, healthCheck: true },
  { name: 'mongodb', status: 'running', uptime: '2d 5h 35m', port: 27017, healthCheck: true },
  { name: 'redis', status: 'running', uptime: '2d 5h 34m', port: 6379, healthCheck: true },
];

export const mockContainerStats: ContainerStats[] = [
  { id: 'c1', name: 'frontend', cpu: 2.5, memoryUsage: 128, memoryLimit: 512, networkRx: 1024, networkTx: 512 },
  { id: 'c2', name: 'backend', cpu: 15.2, memoryUsage: 256, memoryLimit: 1024, networkRx: 2048, networkTx: 1536 },
  { id: 'c3', name: 'mongodb', cpu: 8.3, memoryUsage: 512, memoryLimit: 2048, networkRx: 4096, networkTx: 2048 },
  { id: 'c4', name: 'redis', cpu: 1.2, memoryUsage: 64, memoryLimit: 256, networkRx: 512, networkTx: 256 },
];

export const generateResourceHistory = (): ResourceUsage[] => {
  const history: ResourceUsage[] = [];
  const now = new Date();
  
  for (let i = 60; i >= 0; i--) {
    history.push({
      timestamp: new Date(now.getTime() - i * 60000),
      cpu: 20 + Math.random() * 30 + Math.sin(i / 10) * 10,
      memory: 40 + Math.random() * 20 + Math.cos(i / 15) * 5,
      network: {
        in: Math.random() * 100,
        out: Math.random() * 80,
      },
    });
  }
  
  return history;
};

const logMessages = [
  { service: 'backend', level: 'info' as const, message: 'Request processed: GET /api/news - 200 OK (45ms)' },
  { service: 'backend', level: 'info' as const, message: 'Cache hit for news data - key: news_2024_01_15' },
  { service: 'mongodb', level: 'info' as const, message: 'Query executed: db.news.find() - 12 documents' },
  { service: 'redis', level: 'debug' as const, message: 'SET cache:news:latest TTL=3600' },
  { service: 'frontend', level: 'info' as const, message: 'Static assets served - bundle.js (245KB)' },
  { service: 'backend', level: 'warn' as const, message: 'Rate limit approaching for IP: 192.168.1.100' },
  { service: 'backend', level: 'error' as const, message: 'Failed to fetch from source: timeout after 30s' },
  { service: 'mongodb', level: 'info' as const, message: 'Connection pool: 5/10 connections active' },
  { service: 'redis', level: 'info' as const, message: 'Memory usage: 64MB / 256MB' },
  { service: 'backend', level: 'info' as const, message: 'AI analysis completed for 5 articles' },
];

export const generateMockLogs = (count: number = 50): LogEntry[] => {
  const logs: LogEntry[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const template = logMessages[Math.floor(Math.random() * logMessages.length)];
    logs.push({
      id: `log-${i}`,
      timestamp: new Date(now.getTime() - i * (Math.random() * 5000 + 1000)),
      ...template,
    });
  }
  
  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};
