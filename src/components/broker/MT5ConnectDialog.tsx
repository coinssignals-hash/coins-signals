import { useState } from 'react';
import { Eye, EyeOff, Loader2, Shield, Server } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { BrokerCatalogItem } from './BrokerCatalog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broker: BrokerCatalogItem | null;
  onSave: (data: {
    broker: BrokerCatalogItem;
    server: string;
    login: string;
    password: string;
    platform: 'mt4' | 'mt5';
    connectionName: string;
    environment: 'demo' | 'live';
  }) => Promise<void>;
}

export function MT5ConnectDialog({ open, onOpenChange, broker, onSave }: Props) {
  const [server, setServer] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [platform, setPlatform] = useState<'mt4' | 'mt5'>('mt5');
  const [isLive, setIsLive] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = server.trim() && login.trim() && password.trim();

  const handleSave = async () => {
    if (!broker || !canSave) return;
    setSaving(true);
    try {
      await onSave({
        broker,
        server: server.trim(),
        login: login.trim(),
        password,
        platform,
        connectionName: `${broker.name} - MT${platform === 'mt5' ? '5' : '4'} ${isLive ? 'Live' : 'Demo'}`,
        environment: isLive ? 'live' : 'demo',
      });
      setServer('');
      setLogin('');
      setPassword('');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!broker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{broker.logoEmoji}</span>
            Conectar {broker.name} vía MT4/MT5
          </DialogTitle>
          <DialogDescription>
            Ingresa tus credenciales de MetaTrader para sincronizar operaciones automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Platform selector */}
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <Label className="text-xs text-muted-foreground flex-1">Plataforma</Label>
            <div className="flex gap-1">
              {(['mt4', 'mt5'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                    platform === p
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Server */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Servidor</Label>
            <div className="relative">
              <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={server}
                onChange={e => setServer(e.target.value)}
                placeholder="ej: Exness-MT5Real6"
                className="h-9 text-sm pl-9"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Encuéntralo en tu terminal MT{platform === 'mt5' ? '5' : '4'} → Archivo → Conectar → nombre del servidor.
            </p>
          </div>

          {/* Login */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Login (Número de cuenta)</Label>
            <Input
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="ej: 12345678"
              className="h-9 text-sm"
              inputMode="numeric"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Contraseña (Investor/Read-only recomendada)</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña MT5..."
                className="h-9 text-sm pr-9"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-amber-400">
              💡 Usa la contraseña de solo lectura (Investor) para máxima seguridad.
            </p>
          </div>

          {/* Environment */}
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <span className="text-xs text-muted-foreground">Entorno</span>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs", isLive ? "text-amber-400 font-medium" : "text-muted-foreground")}>
                {isLive ? '🔴 Live' : '🟢 Demo'}
              </span>
              <Switch checked={isLive} onCheckedChange={setIsLive} className="data-[state=checked]:bg-amber-600" />
            </div>
          </div>

          {/* Actions */}
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Conectando...</>
            ) : (
              'Guardar y conectar'
            )}
          </Button>

          {/* Security note */}
          <div className="flex items-start gap-1.5">
            <Shield className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              Credenciales cifradas AES-256-GCM. Solo lectura — no ejecutamos órdenes. La sincronización se realiza vía MetaAPI de forma segura.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
