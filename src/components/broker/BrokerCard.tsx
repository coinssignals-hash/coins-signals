import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface BrokerData {
  id: string;
  name: string;
  logo?: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  central: string;
  coverage: string;
  depositoInicial: string;
  comision: string;
  spreads: string;
  plataforma: string[];
  apalancamiento: string[];
  regulaciones: string[];
  instrumentos: string[];
  rating: number;
  description?: string;
  pros?: string[];
  cons?: string[];
  regionPrincipal?: string;
  paisesOperacion?: string;
  organismos?: string[];
  mercados?: { name: string; items: string }[];
  plataformasOperacion?: { name: string; description: string }[];
  tiposCuenta?: { name: string; description: string }[];
}

interface BrokerCardProps {
  broker: BrokerData;
  onSelect: (broker: BrokerData) => void;
}

export function BrokerCard({ broker, onSelect }: BrokerCardProps) {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold text-foreground">{broker.name}</h3>
            <Badge variant="outline" className="text-primary border-primary">
              {broker.level}
            </Badge>
          </div>
          
          <div className="flex gap-4">
            {/* Logo placeholder */}
            <div className="w-24 h-20 bg-secondary rounded-lg flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
              {broker.name.substring(0, 2).toUpperCase()}
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>
                <span className="text-primary">Deposito inicial</span>
                <p className="text-accent font-medium">{broker.depositoInicial}</p>
              </div>
              <div>
                <span className="text-primary">Comision</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-primary">Spreads</span>
                <p>
                  <span className="text-accent font-medium">{broker.comision}</span>
                  <span className="text-muted-foreground ml-2">{broker.spreads}</span>
                </p>
              </div>
              <div>
                <span className="text-primary">Plataforma</span>
                <p className="text-muted-foreground">{broker.plataforma.join(', ')}</p>
              </div>
              <div>
                <span className="text-primary">Apalancamiento</span>
                <p className="text-muted-foreground">{broker.apalancamiento.join(', ')}</p>
              </div>
              <div>
                <span className="text-primary">Regulaciones</span>
                <p className="text-muted-foreground">{broker.regulaciones.slice(0, 3).join(', ')}{broker.regulaciones.length > 3 ? ' +' : ''}</p>
              </div>
              <div>
                <span className="text-primary">Instrumentos</span>
                <p className="text-muted-foreground">{broker.instrumentos.slice(0, 3).join(', ')}{broker.instrumentos.length > 3 ? ' +' : ''}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div>
              <span className="text-primary text-sm">Central: </span>
              <span className="text-accent text-sm">{broker.central}</span>
              <p className="text-xs text-muted-foreground">{broker.coverage}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${star <= Math.floor(broker.rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-1">{broker.rating}</span>
              </div>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => onSelect(broker)}
              >
                Abrir Cuenta
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
