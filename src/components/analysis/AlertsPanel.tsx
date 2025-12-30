import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Bell, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface AlertConfig {
  rsiOverbought: number;
  rsiOversold: number;
  enableRSI: boolean;
  enableMACD: boolean;
  enableSMACross: boolean;
}

interface AlertsPanelProps {
  config: AlertConfig;
  onConfigChange: (config: AlertConfig) => void;
}

export function AlertsPanel({ config, onConfigChange }: AlertsPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (key: keyof AlertConfig, value: boolean | number) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Configuración de Alertas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* RSI Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-yellow-500" />
              <Label htmlFor="enableRSI" className="font-medium">Alertas RSI</Label>
            </div>
            <Switch
              id="enableRSI"
              checked={localConfig.enableRSI}
              onCheckedChange={(checked) => handleChange('enableRSI', checked)}
            />
          </div>
          
          {localConfig.enableRSI && (
            <div className="pl-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sobrecompra</span>
                  <span className="font-mono text-red-400">{localConfig.rsiOverbought}</span>
                </div>
                <Slider
                  value={[localConfig.rsiOverbought]}
                  onValueChange={([value]) => handleChange('rsiOverbought', value)}
                  min={60}
                  max={90}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sobreventa</span>
                  <span className="font-mono text-green-400">{localConfig.rsiOversold}</span>
                </div>
                <Slider
                  value={[localConfig.rsiOversold]}
                  onValueChange={([value]) => handleChange('rsiOversold', value)}
                  min={10}
                  max={40}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* MACD Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <Label htmlFor="enableMACD" className="font-medium">Cruces MACD</Label>
          </div>
          <Switch
            id="enableMACD"
            checked={localConfig.enableMACD}
            onCheckedChange={(checked) => handleChange('enableMACD', checked)}
          />
        </div>
        <p className="text-xs text-muted-foreground pl-6 -mt-2">
          Alertar cuando MACD cruce la línea de señal
        </p>

        {/* SMA Cross Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-purple-500" />
            <Label htmlFor="enableSMACross" className="font-medium">Cruces Precio/SMA</Label>
          </div>
          <Switch
            id="enableSMACross"
            checked={localConfig.enableSMACross}
            onCheckedChange={(checked) => handleChange('enableSMACross', checked)}
          />
        </div>
        <p className="text-xs text-muted-foreground pl-6 -mt-2">
          Alertar en Golden Cross, Death Cross y cruces de precio
        </p>

        {/* Info */}
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            Las alertas se enviarán como notificaciones push y como notificaciones dentro de la app cuando se detecten las condiciones configuradas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
