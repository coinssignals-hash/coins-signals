import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarTrack } from '../BarTrack';
import type { ProgressBarState, PulseState } from '../types';

const baseState: ProgressBarState = {
  position: 75,
  tp1Pos: 80,
  tp2Pos: 90,
  tp3Pos: 100,
  isAboveEntry: true,
  nearEntry: false,
  progressColor: 'hsl(142, 70%, 50%)',
  pipsFromEntry: 25,
  targetLabel: 'TP1',
  targetPercent: 60,
  hasLivePrice: true,
  displayPrice: 1.1025,
  fillGradient: 'linear-gradient(90deg, red, green)',
  currentZone: 'tp',
  isJpy: false,
  hasMultipleTPs: true,
};

const noPulse: PulseState = { pulse: false, pulseColor: '', crossed: null };

describe('BarTrack', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BarTrack state={baseState} pulse={noPulse} takeProfit2={1.11} takeProfit3={1.115} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders TP markers when hasMultipleTPs', () => {
    const { container } = render(
      <BarTrack state={baseState} pulse={noPulse} takeProfit2={1.11} takeProfit3={1.115} />,
    );
    // Should have marker divs at tp1Pos, tp2Pos, tp3Pos positions
    const markers = container.querySelectorAll('.bg-emerald-400\\/50, .bg-emerald-300\\/40, .bg-emerald-200\\/30');
    expect(markers.length).toBeGreaterThan(0);
  });

  it('shows price label when hasLivePrice', () => {
    const { container } = render(
      <BarTrack state={baseState} pulse={noPulse} />,
    );
    // The floating price label should exist
    const priceLabel = container.querySelector('.font-mono.tabular-nums');
    expect(priceLabel).toBeTruthy();
  });

  it('renders crossed flash overlay when crossed=profit', () => {
    const { container } = render(
      <BarTrack state={baseState} pulse={{ ...noPulse, crossed: 'profit' }} />,
    );
    const flash = container.querySelector('.animate-\\[zone-cross-flash_1\\.4s_ease-out_forwards\\]');
    expect(flash).toBeTruthy();
  });
});
