import { X, Star, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { BrokerData } from './BrokerCard';

interface BrokerCompareProps {
  brokers: BrokerData[];
  onRemove: (brokerId: string) => void;
  onClose: () => void;
}

export function BrokerCompare({ brokers, onRemove, onClose }: BrokerCompareProps) {
  if (brokers.length === 0) {
    return null;
  }

  const comparisonRows = [
    { label: 'Nivel', key: 'level', render: (b: BrokerData) => b.level },
    { label: 'Depósito Inicial', key: 'deposit', render: (b: BrokerData) => b.depositoInicial },
    { label: 'Comisión', key: 'comision', render: (b: BrokerData) => b.comision },
    { label: 'Spreads', key: 'spreads', render: (b: BrokerData) => b.spreads },
    { label: 'Plataformas', key: 'plataforma', render: (b: BrokerData) => b.plataforma.join(', ') },
    { label: 'Apalancamiento', key: 'apalancamiento', render: (b: BrokerData) => b.apalancamiento.join(', ') },
    { label: 'Regulaciones', key: 'regulaciones', render: (b: BrokerData) => b.regulaciones.join(', ') },
    { label: 'Instrumentos', key: 'instrumentos', render: (b: BrokerData) => b.instrumentos.join(', ') },
    { label: 'Central', key: 'central', render: (b: BrokerData) => b.central },
    { label: 'Cobertura', key: 'coverage', render: (b: BrokerData) => b.coverage },
    { label: 'Rating', key: 'rating', render: (b: BrokerData) => (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${star <= Math.floor(b.rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
          />
        ))}
        <span className="ml-1">{b.rating}</span>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          Comparar Brokers ({brokers.length})
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4 mr-1" />
          Cerrar
        </Button>
      </div>

      <ScrollArea className="w-full">
        <div className="min-w-max">
          {/* Broker Headers */}
          <div className="flex border-b border-border">
            <div className="w-32 shrink-0 p-3 bg-secondary/50">
              <span className="text-sm font-medium text-muted-foreground">Característica</span>
            </div>
            {brokers.map((broker) => (
              <div key={broker.id} className="w-48 shrink-0 p-3 bg-card border-l border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">{broker.name}</h3>
                    <span className="text-xs text-primary">{broker.level}</span>
                  </div>
                  <button
                    onClick={() => onRemove(broker.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Rows */}
          {comparisonRows.map((row, idx) => (
            <div key={row.key} className={`flex border-b border-border ${idx % 2 === 0 ? 'bg-secondary/20' : ''}`}>
              <div className="w-32 shrink-0 p-3">
                <span className="text-sm font-medium text-primary">{row.label}</span>
              </div>
              {brokers.map((broker) => (
                <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                  <span className="text-sm text-foreground">{row.render(broker)}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Pros */}
          <div className="flex border-b border-border bg-secondary/20">
            <div className="w-32 shrink-0 p-3">
              <span className="text-sm font-medium text-primary">Pros</span>
            </div>
            {brokers.map((broker) => (
              <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                <ul className="space-y-1">
                  {(broker.pros || []).slice(0, 3).map((pro, i) => (
                    <li key={i} className="flex items-start gap-1 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Cons */}
          <div className="flex border-b border-border">
            <div className="w-32 shrink-0 p-3">
              <span className="text-sm font-medium text-destructive">Cons</span>
            </div>
            {brokers.map((broker) => (
              <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                <ul className="space-y-1">
                  {(broker.cons || []).slice(0, 2).map((con, i) => (
                    <li key={i} className="flex items-start gap-1 text-xs">
                      <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                      <span className="text-foreground">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex">
            <div className="w-32 shrink-0 p-3"></div>
            {brokers.map((broker) => (
              <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                  Abrir Cuenta
                </Button>
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
