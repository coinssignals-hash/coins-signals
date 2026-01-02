import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { playNotificationSound } from '@/utils/notificationSound';

interface SupportResistanceAlertConfig {
  enabled: boolean;
  proximityPercent: number; // How close to S/R to trigger (e.g., 0.1 = 0.1%)
  enableSound: boolean;
}

interface Alert {
  id: string;
  type: 'support' | 'resistance';
  title: string;
  message: string;
  level: 'warning' | 'critical';
  timestamp: Date;
  symbol: string;
}

const DEFAULT_CONFIG: SupportResistanceAlertConfig = {
  enabled: true,
  proximityPercent: 0.1, // 0.1% of range
  enableSound: true,
};

export function useSupportResistanceAlerts(
  symbol: string,
  realtimePrice: number | null | undefined,
  support: number,
  resistance: number,
  config: Partial<SupportResistanceAlertConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const lastAlerts = useRef<Record<string, number>>({});
  const previousZone = useRef<'support' | 'resistance' | 'middle' | null>(null);

  const sendPushNotification = useCallback(async (alert: Alert) => {
    try {
      const response = await supabase.functions.invoke('indicator-alerts', {
        body: {
          title: alert.title,
          body: alert.message,
          type: alert.type,
          symbol: alert.symbol,
          level: alert.level,
        },
      });
      
      if (response.error) {
        console.error('Failed to send push notification:', response.error);
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }, []);

  const showToastAlert = useCallback((alert: Alert) => {
    const alertKey = `${alert.type}-${symbol}`;
    const now = Date.now();
    const lastTime = lastAlerts.current[alertKey] || 0;
    
    // Prevent duplicate alerts within 60 seconds
    if (now - lastTime < 60000) return;
    lastAlerts.current[alertKey] = now;

    const variant = alert.level === 'critical' ? 'destructive' : 'default';
    
    toast({
      title: alert.title,
      description: alert.message,
      variant,
    });

    // Play sound if enabled
    if (mergedConfig.enableSound) {
      const action = alert.type === 'resistance' ? 'sell' : 'buy';
      playNotificationSound(action);
    }
  }, [symbol, mergedConfig.enableSound]);

  const triggerAlert = useCallback((alert: Alert) => {
    showToastAlert(alert);
    sendPushNotification(alert);
  }, [showToastAlert, sendPushNotification]);

  const checkPriceProximity = useCallback(() => {
    if (!mergedConfig.enabled || !realtimePrice || support <= 0 || resistance <= 0) return;

    const range = resistance - support;
    if (range <= 0) return;

    const proximityThreshold = range * (mergedConfig.proximityPercent / 100);
    const distanceToResistance = resistance - realtimePrice;
    const distanceToSupport = realtimePrice - support;

    // Calculate percentage position in range
    const positionPercent = ((realtimePrice - support) / range) * 100;

    // Determine current zone
    let currentZone: 'support' | 'resistance' | 'middle' = 'middle';
    
    if (distanceToResistance <= proximityThreshold && distanceToResistance > 0) {
      currentZone = 'resistance';
    } else if (distanceToSupport <= proximityThreshold && distanceToSupport > 0) {
      currentZone = 'support';
    }

    // Only trigger alert when entering a new zone
    if (currentZone !== previousZone.current) {
      if (currentZone === 'resistance') {
        const isCritical = positionPercent >= 95;
        triggerAlert({
          id: `resistance-proximity-${Date.now()}`,
          type: 'resistance',
          title: isCritical ? `🚨 Tocando Resistencia - ${symbol}` : `⚠️ Cerca de Resistencia - ${symbol}`,
          message: `Precio ${realtimePrice.toFixed(5)} a ${distanceToResistance.toFixed(5)} de resistencia (${resistance.toFixed(5)}). ${isCritical ? 'Posible reversión o ruptura.' : 'Vigilar comportamiento.'}`,
          level: isCritical ? 'critical' : 'warning',
          timestamp: new Date(),
          symbol,
        });
      } else if (currentZone === 'support') {
        const isCritical = positionPercent <= 5;
        triggerAlert({
          id: `support-proximity-${Date.now()}`,
          type: 'support',
          title: isCritical ? `🚨 Tocando Soporte - ${symbol}` : `⚠️ Cerca de Soporte - ${symbol}`,
          message: `Precio ${realtimePrice.toFixed(5)} a ${distanceToSupport.toFixed(5)} de soporte (${support.toFixed(5)}). ${isCritical ? 'Posible rebote o ruptura.' : 'Vigilar comportamiento.'}`,
          level: isCritical ? 'critical' : 'warning',
          timestamp: new Date(),
          symbol,
        });
      }

      previousZone.current = currentZone;
    }

    // Check for breakouts (price outside S/R range)
    if (realtimePrice > resistance) {
      const breakoutKey = `breakout-resistance-${symbol}`;
      const now = Date.now();
      const lastTime = lastAlerts.current[breakoutKey] || 0;
      
      if (now - lastTime >= 120000) { // 2 minutes cooldown for breakouts
        lastAlerts.current[breakoutKey] = now;
        triggerAlert({
          id: `breakout-resistance-${Date.now()}`,
          type: 'resistance',
          title: `🚀 Ruptura de Resistencia - ${symbol}`,
          message: `Precio ${realtimePrice.toFixed(5)} rompió resistencia ${resistance.toFixed(5)}. Posible continuación alcista.`,
          level: 'critical',
          timestamp: new Date(),
          symbol,
        });
      }
    } else if (realtimePrice < support) {
      const breakoutKey = `breakout-support-${symbol}`;
      const now = Date.now();
      const lastTime = lastAlerts.current[breakoutKey] || 0;
      
      if (now - lastTime >= 120000) {
        lastAlerts.current[breakoutKey] = now;
        triggerAlert({
          id: `breakout-support-${Date.now()}`,
          type: 'support',
          title: `📉 Ruptura de Soporte - ${symbol}`,
          message: `Precio ${realtimePrice.toFixed(5)} rompió soporte ${support.toFixed(5)}. Posible continuación bajista.`,
          level: 'critical',
          timestamp: new Date(),
          symbol,
        });
      }
    }
  }, [mergedConfig, realtimePrice, support, resistance, symbol, triggerAlert]);

  // Reset zone when symbol changes
  useEffect(() => {
    previousZone.current = null;
    lastAlerts.current = {};
  }, [symbol]);

  // Check price proximity whenever price updates
  useEffect(() => {
    checkPriceProximity();
  }, [checkPriceProximity]);

  return {
    config: mergedConfig,
  };
}
