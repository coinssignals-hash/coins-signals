import { useState } from 'react';
import { Eye, EyeOff, Loader2, Shield, Server, Zap } from 'lucide-react';
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

const BROKER_ACCENT: Record<string, string> = {
  ic_markets: '195 85% 55%', oanda: '35 90% 55%', pepperstone: '0 80% 58%',
  xm: '140 75% 50%', exness: '200 85% 55%', fp_markets: '170 80% 48%',
  fusion_markets: '45 85% 52%', blackbull: '25 80% 50%', admirals: '220 75% 55%',
  fxopen: '310 70% 55%', avatrade: '220 85% 60%', hotforex: '15 85% 55%',
  fbs: '340 75% 55%', roboforex: '260 80% 60%', alpari: '210 70% 55%',
  thinkmarkets: '175 70% 50%', fxgt: '30 85% 55%', tickmill: '145 70% 50%',
  vantage: '280 75% 60%', fxtm: '195 75% 50%', octafx: '270 70% 55%',
  litefinance: '50 80% 52%', weltrade: '160 70% 48%', nordfx: '205 80% 60%',
  amarkets: '350 70% 55%',
};

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

  const accent = BROKER_ACCENT[broker.code] || '210 70% 55%';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border-0 p-0 overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(165deg, hsl(${accent} / 0.10) 0%, hsl(var(--card)) 35%, hsl(var(--background)) 100%)`,
          boxShadow: `0 0 60px -15px hsl(${accent} / 0.25), 0 25px 50px -12px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 inset-x-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, hsl(${accent} / 0.8), transparent)` }}
        />

        {/* Radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-40 rounded-full opacity-15 pointer-events-none"
          style={{ background: `radial-gradient(ellipse, hsl(${accent} / 0.5), transparent 70%)` }}
        />

        <div className="relative p-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="flex items-center gap-3 text-base">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{
                  background: `linear-gradient(135deg, hsl(${accent} / 0.25), hsl(${accent} / 0.08))`,
                  border: `1px solid hsl(${accent} / 0.3)`,
                }}
              >
                {broker.logoEmoji}
              </div>
              <span>Conectar {broker.name} vía MT4/MT5</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Ingresa tus credenciales de MetaTrader para sincronizar operaciones automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Platform selector */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: `hsl(${accent} / 0.05)`,
                border: `1px solid hsl(${accent} / 0.12)`,
              }}
            >
              <Label className="text-xs text-muted-foreground flex-1 tracking-wider uppercase font-medium">Plataforma</Label>
              <div className="flex gap-1">
                {(['mt4', 'mt5'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200',
                      platform === p
                        ? 'text-white shadow-lg'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    style={platform === p ? {
                      background: `linear-gradient(135deg, hsl(${accent}), hsl(${accent} / 0.7))`,
                      boxShadow: `0 4px 15px hsl(${accent} / 0.3)`,
                    } : {
                      background: 'hsl(var(--secondary) / 0.5)',
                    }}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Server */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground tracking-wider uppercase font-medium">Servidor</Label>
              <div className="relative">
                <Server
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: `hsl(${accent})` }}
                />
                <Input
                  value={server}
                  onChange={e => setServer(e.target.value)}
                  placeholder="ej: Exness-MT5Real6"
                  className="h-10 text-sm pl-9 rounded-xl border-border/50 bg-secondary/30 focus:border-primary"
                  style={{ '--tw-ring-color': `hsl(${accent} / 0.3)` } as React.CSSProperties}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                Encuéntralo en tu terminal MT{platform === 'mt5' ? '5' : '4'} → Archivo → Conectar → nombre del servidor.
              </p>
            </div>

            {/* Login */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground tracking-wider uppercase font-medium">Login (Número de cuenta)</Label>
              <Input
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="ej: 12345678"
                className="h-10 text-sm rounded-xl border-border/50 bg-secondary/30 focus:border-primary"
                inputMode="numeric"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground tracking-wider uppercase font-medium">
                Contraseña (Investor/Read-only recomendada)
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Tu contraseña MT5..."
                  className="h-10 text-sm pr-10 rounded-xl border-border/50 bg-secondary/30 focus:border-primary"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3" style={{ color: `hsl(42 90% 55%)` }} />
                <p className="text-[10px]" style={{ color: `hsl(42 90% 55%)` }}>
                  Usa la contraseña de solo lectura (Investor) para máxima seguridad.
                </p>
              </div>
            </div>

            {/* Environment */}
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{
                background: `hsl(${accent} / 0.05)`,
                border: `1px solid hsl(${accent} / 0.12)`,
              }}
            >
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-medium">Entorno</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-semibold",
                  isLive ? "text-red-400" : "text-emerald-400"
                )}>
                  {isLive ? '🔴 Live' : '🟢 Demo'}
                </span>
                <Switch checked={isLive} onCheckedChange={setIsLive} className="data-[state=checked]:bg-red-600" />
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canSave
                  ? `linear-gradient(135deg, hsl(${accent}), hsl(${accent} / 0.7))`
                  : 'hsl(var(--secondary))',
                boxShadow: canSave ? `0 6px 20px hsl(${accent} / 0.35)` : 'none',
              }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Conectando...
                </span>
              ) : (
                'Guardar y conectar'
              )}
            </button>

            {/* Security note */}
            <div
              className="flex items-start gap-2 p-3 rounded-xl"
              style={{
                background: `hsl(${accent} / 0.04)`,
                border: `1px solid hsl(${accent} / 0.08)`,
              }}
            >
              <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: `hsl(${accent} / 0.6)` }} />
              <p className="text-[9px] text-muted-foreground/70 leading-relaxed">
                Credenciales cifradas AES-256-GCM. Solo lectura — no ejecutamos órdenes. La sincronización se realiza vía MetaAPI de forma segura.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
