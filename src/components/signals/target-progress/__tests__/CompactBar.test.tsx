import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompactBar } from '../CompactBar';
import type { ProgressBarState, PulseState } from '../types';

const baseState: ProgressBarState = {
  position: 60,
  tp1Pos: 100,
  tp2Pos: null,
  tp3Pos: null,
  isAboveEntry: true,
  nearEntry: false,
  progressColor: 'hsl(142, 70%, 50%)',
  pipsFromEntry: 15.5,
  targetLabel: 'TP1',
  targetPercent: 40,
  hasLivePrice: true,
  displayPrice: 1.103,
  fillGradient: 'linear-gradient(90deg, red, green)',
  currentZone: 'tp',
  isActivated: true,
  isJpy: false,
  hasMultipleTPs: false,
};

const noPulse: PulseState = { pulse: false, pulseColor: '', crossed: null };

describe('CompactBar', () => {
  it('renders SL and TP labels', () => {
    render(<CompactBar state={baseState} pulse={noPulse} />);
    expect(screen.getByText('SL')).toBeInTheDocument();
    expect(screen.getByText('TP')).toBeInTheDocument();
  });

  it('shows progress info text', () => {
    render(<CompactBar state={baseState} pulse={noPulse} />);
    expect(screen.getByText('TP1 40% · 15.5p')).toBeInTheDocument();
  });
});
