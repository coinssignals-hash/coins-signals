import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';
import type { ProgressBarState, PulseState } from '../types';

const baseState: ProgressBarState = {
  position: 50,
  tp1Pos: 100,
  tp2Pos: null,
  tp3Pos: null,
  isAboveEntry: false,
  nearEntry: true,
  progressColor: 'hsl(45, 80%, 55%)',
  pipsFromEntry: 0,
  targetLabel: 'ENTRY',
  targetPercent: 0,
  hasLivePrice: true,
  displayPrice: 1.1,
  fillGradient: '',
  currentZone: 'entry',
  isJpy: false,
  hasMultipleTPs: false,
};

const noPulse: PulseState = { pulse: false, pulseColor: '', crossed: null };

describe('StatusBadge', () => {
  it('shows TP hit with pips when completed with tp_hit', () => {
    render(
      <StatusBadge state={{ ...baseState, targetLabel: 'TP1', targetPercent: 100, pipsFromEntry: 50 }} pulse={noPulse} isCompleted closedResult="tp_hit" />,
    );
    expect(screen.getByText('✅ TP1 100% · 50.0p')).toBeInTheDocument();
  });

  it('shows SL hit with pips when completed with sl_hit', () => {
    render(
      <StatusBadge state={{ ...baseState, targetLabel: 'SL', targetPercent: 100, pipsFromEntry: 30 }} pulse={noPulse} isCompleted closedResult="sl_hit" />,
    );
    expect(screen.getByText('❌ SL 100% · 30.0p')).toBeInTheDocument();
  });

  it('shows expired with pips when completed with other result', () => {
    render(
      <StatusBadge state={{ ...baseState, targetLabel: 'ENTRY', targetPercent: 10, pipsFromEntry: 5 }} pulse={noPulse} isCompleted closedResult="expired" />,
    );
    expect(screen.getByText('⏱ ENTRY 10% · 5.0p')).toBeInTheDocument();
  });

  it('shows progress text when not completed', () => {
    render(
      <StatusBadge
        state={{ ...baseState, targetLabel: 'TP1', targetPercent: 45.6, pipsFromEntry: 12.3 }}
        pulse={noPulse}
        isCompleted={false}
      />,
    );
    expect(screen.getByText('TP1 46% · 12.3p')).toBeInTheDocument();
  });
});
