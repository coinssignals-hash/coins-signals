import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Bell, TrendingUp, TrendingDown, Activity, Shield, Volume2, CandlestickChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playNotificationSound } from '@/utils/notificationSound';

interface AlertConfig {
  rsiOverbought: number;
  rsiOversold: number;
  enableRSI: boolean;
  enableMACD: boolean;
  enableSMACross: boolean;
  enableSupportResistance: boolean;
  srProximityPercent: number;
  srEnableSound: boolean;
  enablePatternAlerts: boolean;
  patternAlertTypes: {
    bullish: boolean;
    bearish: boolean;
    neutral: boolean;
  };
  patternEnableSound: boolean;
}

interface AlertsPanelProps {
  config: AlertConfig;
  onConfigChange: (config: AlertConfig) => void;
}

export function AlertsPanel({ config, onConfigChange }: AlertsPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (key: keyof AlertConfig, value: boolean | number | AlertConfig['patternAlertTypes']) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handlePatternTypeChange = (type: keyof AlertConfig['patternAlertTypes'], value: boolean) => {
    const newPatternTypes = { ...localConfig.patternAlertTypes, [type]: value };
    handleChange('patternAlertTypes', newPatternTypes);
  };

  const testPatternSound = (type: 'bullish' | 'bearish' | 'neutral') => {
    playNotificationSound(`pattern_${type}`);
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
        {/* Support/Resistance Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <Label htmlFor="enableSR" className="font-medium">Alertas Soporte/Resistencia</Label>
            </div>
            <Switch
              id="enableSR"
              checked={localConfig.enableSupportResistance}
              onCheckedChange={(checked) => handleChange('enableSupportResistance', checked)}
            />
          </div>
          
          {localConfig.enableSupportResistance && (
            <div className="pl-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Proximidad para alertar</span>
                  <span className="font-mono text-yellow-400">{localConfig.srProximityPercent}%</span>
                </div>
                <Slider
                  value={[localConfig.srProximityPercent]}
                  onValueChange={([value]) => handleChange('srProximityPercent', value)}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Alertar cuando el precio esté dentro del {localConfig.srProximityPercent}% del rango
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-blue-400" />
                  <Label htmlFor="srSound" className="text-sm">Sonido de alerta</Label>
                </div>
                <Switch
                  id="srSound"
                  checked={localConfig.srEnableSound}
                  onCheckedChange={(checked) => handleChange('srEnableSound', checked)}
                />
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground pl-6">
            Alertar cuando el precio se acerque al soporte o resistencia del día anterior
          </p>
        </div>

        <div className="border-t border-border/50 pt-4" />

        {/* Candlestick Pattern Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CandlestickChart className="h-4 w-4 text-amber-500" />
              <Label htmlFor="enablePatterns" className="font-medium">Alertas de Patrones de Velas</Label>
            </div>
            <Switch
              id="enablePatterns"
              checked={localConfig.enablePatternAlerts}
              onCheckedChange={(checked) => handleChange('enablePatternAlerts', checked)}
            />
          </div>
          
          {localConfig.enablePatternAlerts && (
            <div className="pl-6 space-y-4">
              {/* Pattern type toggles */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Tipos de patrones a detectar:</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">↑</span>
                    <Label htmlFor="patternBullish" className="text-sm">Patrones Alcistas</Label>
                    <span className="text-[10px] text-muted-foreground">(Hammer, Engulfing)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => testPatternSound('bullish')}
                    >
                      🔊
                    </Button>
                    <Switch
                      id="patternBullish"
                      checked={localConfig.patternAlertTypes.bullish}
                      onCheckedChange={(checked) => handlePatternTypeChange('bullish', checked)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">↓</span>
                    <Label htmlFor="patternBearish" className="text-sm">Patrones Bajistas</Label>
                    <span className="text-[10px] text-muted-foreground">(Bear Engulfing)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => testPatternSound('bearish')}
                    >
                      🔊
                    </Button>
                    <Switch
                      id="patternBearish"
                      checked={localConfig.patternAlertTypes.bearish}
                      onCheckedChange={(checked) => handlePatternTypeChange('bearish', checked)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">→</span>
                    <Label htmlFor="patternNeutral" className="text-sm">Patrones Neutrales</Label>
                    <span className="text-[10px] text-muted-foreground">(Doji)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => testPatternSound('neutral')}
                    >
                      🔊
                    </Button>
                    <Switch
                      id="patternNeutral"
                      checked={localConfig.patternAlertTypes.neutral}
                      onCheckedChange={(checked) => handlePatternTypeChange('neutral', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-blue-400" />
                  <Label htmlFor="patternSound" className="text-sm">Sonido de alerta</Label>
                </div>
                <Switch
                  id="patternSound"
                  checked={localConfig.patternEnableSound}
                  onCheckedChange={(checked) => handleChange('patternEnableSound', checked)}
                />
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground pl-6">
            Recibir alertas cuando se detecten patrones de velas japonesas en tiempo real
          </p>
        </div>

        <div className="border-t border-border/50 pt-4" />

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
