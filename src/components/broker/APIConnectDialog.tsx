import { useState } from 'react';
import {
  Eye, EyeOff, Loader2, Shield, Key, Hash, Zap, CheckCircle2, XCircle, ArrowRight,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { BrokerCatalogItem } from './BrokerCatalog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broker: BrokerCatalogItem | null;
  onTest: (data: {
    brokerCode: string;
    credentials: {
      api_key?: string;
      api_secret?: string;
      account_id?: string;
      access_token?: string;
    };
    environment: 'demo' | 'live';
  }) => Promise<{ success: boolean; message: string; account_info?: Record<string, unknown> }>;
  onSave: (data: {
    broker: BrokerCatalogItem;
    connectionName: string;
    environment: 'demo' | 'live';
    credentials: {
      api_key?: string;
      api_secret?: string;
      account_id?: string;
      access_token?: string;
    };
  }) => Promise<boolean>;
}

const BROKER_ACCENT: Record<string, string> = {
  oanda: '35 90% 55%',
  alpaca: '150 75% 50%',
  pepperstone: '0 80% 58%',
  avatrade: '220 85% 60%',
  ic_markets: '195 85% 55%',
  interactive_brokers: '25 85% 55%',
  tradestation: '235 80% 62%',
  tradovate: '45 90% 52%',
};

/** Which fields each broker needs */
type FieldConfig = {
  fields: Array<{
    key: 'api_key' | 'api_secret' | 'account_id' | 'access_token';
    label: string;
    placeholder: string;
    helpText?: string;
    isSecret?: boolean;
    inputMode?: 'text' | 'numeric';
  }>;
  helpUrl?: string;
  helpLabel?: string;
};

const BROKER_FIELDS: Record<string, FieldConfig> = {
  oanda: {
    fields: [
      {
        key: 'api_key', label: 'API Token', placeholder: 'Tu token de OANDA...',
        helpText: 'Genéralo en OANDA → Settings → API Management → Generate Token',
        isSecret: true,
      },
      {
        key: 'account_id', label: 'Account ID', placeholder: '101-001-12345678-001',
        helpText: 'Encuéntralo en OANDA → Manage Funds → tu número de cuenta',
      },
    ],
    helpUrl: 'https://www.oanda.com/account/login',
    helpLabel: 'Portal OANDA',
  },
  alpaca: {
    fields: [
      {
        key: 'api_key', label: 'API Key ID', placeholder: 'PK...',
        helpText: 'Ve a Alpaca Dashboard → Paper/Live → API Keys → Generate',
        isSecret: true,
      },
      {
        key: 'api_secret', label: 'Secret Key', placeholder: 'Tu secret key...',
        helpText: '⚠️ Solo se muestra una vez al generarla. Guárdala bien.',
        isSecret: true,
      },
    ],
    helpUrl: 'https://app.alpaca.markets',
    helpLabel: 'Dashboard Alpaca',
  },
  pepperstone: {
    fields: [
      {
        key: 'api_key', label: 'cTrader API Key', placeholder: 'Tu API key...',
        helpText: 'Solicita acceso API en tu área de cliente Pepperstone',
        isSecret: true,
      },
      {
        key: 'api_secret', label: 'API Secret', placeholder: 'Tu secret...',
        isSecret: true,
      },
    ],
  },
  avatrade: {
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'Tu API key...', isSecret: true },
      { key: 'api_secret', label: 'API Secret', placeholder: 'Tu secret...', isSecret: true },
    ],
  },
  ic_markets: {
    fields: [
      { key: 'api_key', label: 'cTrader Token', placeholder: 'Tu token...', isSecret: true },
      { key: 'api_secret', label: 'API Secret', placeholder: 'Tu secret...', isSecret: true },
    ],
  },
  interactive_brokers: {
    fields: [
      { key: 'api_key', label: 'Client ID', placeholder: 'Tu Client ID...' },
      { key: 'api_secret', label: 'API Secret', placeholder: 'Tu secret...', isSecret: true },
    ],
  },
  tradestation: {
    fields: [
      {
        key: 'access_token', label: 'Access Token (OAuth)', placeholder: 'Bearer token...',
        helpText: 'Obtén tu token desde developer.tradestation.com',
        isSecret: true,
      },
    ],
  },
  tradovate: {
    fields: [
      {
        key: 'api_key', label: 'Username', placeholder: 'Tu usuario API...',
      },
      {
        key: 'api_secret', label: 'Password', placeholder: 'Tu contraseña API...', isSecret: true,
      },
      {
        key: 'account_id', label: 'App ID (opcional)', placeholder: 'TradeSync',
      },
    ],
  },
};

type Step = 'credentials' | 'testing' | 'result';

export function APIConnectDialog({ open, onOpenChange, broker, onTest, onSave }: Props) {
  const [step, setStep] = useState<Step>('credentials');
  const [isLive, setIsLive] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; account_info?: Record<string, unknown> } | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});

  const resetState = () => {
    setStep('credentials');
    setValues({});
    setShowSecrets({});
    setTestResult(null);
    setIsLive(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  if (!broker) return null;

  const accent = BROKER_ACCENT[broker.code] || '210 70% 55%';
  const config = BROKER_FIELDS[broker.code];
  if (!config) return null;

  const requiredFields = config.fields.filter(f => !f.label.includes('opcional'));
  const canTest = requiredFields.every(f => (values[f.key] || '').trim().length > 0);

  const buildCredentials = () => ({
    api_key: values.api_key || undefined,
    api_secret: values.api_secret || undefined,
    account_id: values.account_id || undefined,
    access_token: values.access_token || undefined,
  });

  const handleTest = async () => {
    if (!canTest) return;
    setStep('testing');
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest({
        brokerCode: broker.code,
        credentials: buildCredentials(),
        environment: isLive ? 'live' : 'demo',
      });
      setTestResult(result);
      setStep('result');
    } catch {
      setTestResult({ success: false, message: 'Error de red. Verifica tu conexión.' });
      setStep('result');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const ok = await onSave({
      broker,
      connectionName: `${broker.name} - ${isLive ? 'Live' : 'Demo'}`,
      environment: isLive ? 'live' : 'demo',
      credentials: buildCredentials(),
    });
    setIsSaving(false);
    if (ok) {
      resetState();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md border-0 p-0 overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(165deg, hsl(${accent} / 0.10) 0%, hsl(var(--card)) 35%, hsl(var(--background)) 100%)`,
          boxShadow: `0 0 60px -15px hsl(${accent} / 0.25), 0 25px 50px -12px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Top glow */}
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, hsl(${accent} / 0.8), transparent)` }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-40 rounded-full opacity-15 pointer-events-none" style={{ background: `radial-gradient(ellipse, hsl(${accent} / 0.5), transparent 70%)` }} />

        <div className="relative p-6">
          <DialogHeader className="mb-4">
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
              <div>
                <span>Conectar {broker.name}</span>
                <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Conexión vía API • {broker.regulation}</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Formulario de conexión API para {broker.name}</DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5">
            {(['credentials', 'testing', 'result'] as Step[]).map((s, i) => {
              const labels = ['Credenciales', 'Verificando', 'Resultado'];
              const isActive = step === s;
              const isDone = (step === 'testing' && i === 0) || (step === 'result' && i < 2);
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5 flex-1">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all',
                      )}
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, hsl(${accent}), hsl(${accent} / 0.7))`
                          : isDone
                          ? 'hsl(140 70% 45% / 0.2)'
                          : 'hsl(var(--secondary))',
                        color: isActive ? 'white' : isDone ? 'hsl(140 70% 50%)' : 'hsl(var(--muted-foreground))',
                        border: isActive ? `1px solid hsl(${accent} / 0.5)` : '1px solid transparent',
                        boxShadow: isActive ? `0 2px 8px hsl(${accent} / 0.3)` : 'none',
                      }}
                    >
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={cn('text-[9px] font-semibold uppercase tracking-wider', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                      {labels[i]}
                    </span>
                  </div>
                  {i < 2 && <ArrowRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Step: Credentials */}
          {step === 'credentials' && (
            <div className="space-y-4">
              {config.fields.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground tracking-wider uppercase font-medium">
                    {field.label}
                  </Label>
                  <div className="relative">
                    {field.isSecret ? (
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: `hsl(${accent} / 0.6)` }} />
                    ) : (
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: `hsl(${accent} / 0.6)` }} />
                    )}
                    <Input
                      type={field.isSecret && !showSecrets[field.key] ? 'password' : 'text'}
                      value={values[field.key] || ''}
                      onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="h-10 text-sm pl-9 pr-10 rounded-xl border-border/50 bg-secondary/30 focus:border-primary"
                      inputMode={field.inputMode}
                    />
                    {field.isSecret && (
                      <button
                        type="button"
                        onClick={() => setShowSecrets(s => ({ ...s, [field.key]: !s[field.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {field.helpText && (
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{field.helpText}</p>
                  )}
                </div>
              ))}

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
                  <span className={cn('text-xs font-semibold', isLive ? 'text-red-400' : 'text-emerald-400')}>
                    {isLive ? '🔴 Live' : '🟢 Demo'}
                  </span>
                  <Switch checked={isLive} onCheckedChange={setIsLive} className="data-[state=checked]:bg-red-600" />
                </div>
              </div>

              {isLive && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: 'hsl(45 80% 55% / 0.08)', border: '1px solid hsl(45 80% 55% / 0.2)' }}>
                  <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-400">Modo Live usa fondos reales. Asegúrate de que tus credenciales son correctas.</p>
                </div>
              )}

              {/* Test button */}
              <button
                onClick={handleTest}
                disabled={!canTest}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{
                  background: canTest
                    ? `linear-gradient(135deg, hsl(${accent}), hsl(${accent} / 0.7))`
                    : 'hsl(var(--secondary))',
                  boxShadow: canTest ? `0 6px 20px hsl(${accent} / 0.35)` : 'none',
                }}
              >
                Probar conexión
              </button>

              {/* Help link */}
              {config.helpUrl && (
                <a
                  href={config.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[10px] font-semibold transition-colors hover:underline"
                  style={{ color: `hsl(${accent})` }}
                >
                  ¿Necesitas ayuda? Abrir {config.helpLabel || 'documentación'} →
                </a>
              )}
            </div>
          )}

          {/* Step: Testing */}
          {step === 'testing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse"
                style={{
                  background: `linear-gradient(135deg, hsl(${accent} / 0.2), hsl(${accent} / 0.05))`,
                  border: `1px solid hsl(${accent} / 0.3)`,
                }}
              >
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: `hsl(${accent})` }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Verificando credenciales...</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Conectando con {broker.name} ({isLive ? 'Live' : 'Demo'})
                </p>
              </div>
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && testResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6 gap-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: testResult.success
                      ? 'linear-gradient(135deg, hsl(140 70% 45% / 0.2), hsl(140 70% 45% / 0.05))'
                      : 'linear-gradient(135deg, hsl(0 70% 50% / 0.2), hsl(0 70% 50% / 0.05))',
                    border: `1px solid ${testResult.success ? 'hsl(140 70% 45% / 0.3)' : 'hsl(0 70% 50% / 0.3)'}`,
                  }}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-rose-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className={cn('text-sm font-bold', testResult.success ? 'text-emerald-400' : 'text-rose-400')}>
                    {testResult.success ? '¡Conexión exitosa!' : 'Conexión fallida'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[280px]">{testResult.message}</p>
                </div>

                {/* Account info preview */}
                {testResult.success && testResult.account_info && (
                  <div
                    className="w-full rounded-xl p-3 space-y-1"
                    style={{
                      background: 'hsl(140 70% 45% / 0.05)',
                      border: '1px solid hsl(140 70% 45% / 0.15)',
                    }}
                  >
                    <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-400">Información de cuenta</p>
                    {Object.entries(testResult.account_info).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-[10px] text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-foreground font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setStep('credentials'); setTestResult(null); }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                  style={{
                    background: 'hsl(var(--secondary) / 0.5)',
                    border: '1px solid hsl(var(--border) / 0.5)',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  {testResult.success ? 'Modificar' : 'Reintentar'}
                </button>
                {testResult.success && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(135deg, hsl(140 70% 45%), hsl(140 70% 45% / 0.7))`,
                      boxShadow: '0 6px 20px hsl(140 70% 45% / 0.3)',
                    }}
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                      </span>
                    ) : (
                      'Guardar conexión'
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Security note — always visible */}
          <div
            className="flex items-start gap-2 p-3 rounded-xl mt-4"
            style={{
              background: `hsl(${accent} / 0.04)`,
              border: `1px solid hsl(${accent} / 0.08)`,
            }}
          >
            <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: `hsl(${accent} / 0.6)` }} />
            <p className="text-[9px] text-muted-foreground/70 leading-relaxed">
              Credenciales cifradas AES-256-GCM. Solo lectura — no ejecutamos órdenes. Almacenadas de forma segura en tu cuenta.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
