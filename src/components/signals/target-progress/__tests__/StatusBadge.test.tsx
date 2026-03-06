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
  it('shows TP hit when completed with tp_hit', () => {
    render(
      <StatusBadge state={baseState} pulse={noPulse} isCompleted closedResult="tp_hit" />,
    );
    expect(screen.getByText('✅ TP')).toBeInTheDocument();
  });

  it('shows SL hit when completed with sl_hit', () => {
    render(
      <StatusBadge state={baseState} pulse={noPulse} isCompleted closedResult="sl_hit" />,
    );
    expect(screen.getByText('❌ SL')).toBeInTheDocument();
  });

  it('shows expired when completed with other result', () => {
    render(
      <StatusBadge state={baseState} pulse={noPulse} isCompleted closedResult="expired" />,
    );
    expect(screen.getByText('⏱ Exp')).toBeInTheDocument();
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
