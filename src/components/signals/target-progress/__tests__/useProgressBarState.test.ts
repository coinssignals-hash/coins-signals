import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProgressBarState } from '../useProgressBarState';
import type { TargetProgressBarProps } from '../types';

const baseBuy: TargetProgressBarProps = {
  entryPrice: 1.1000,
  takeProfit: 1.1050,
  stopLoss: 1.0950,
  currentPrice: null,
  action: 'BUY',
};

const baseSell: TargetProgressBarProps = {
  entryPrice: 1.1000,
  takeProfit: 1.0950,
  stopLoss: 1.1050,
  currentPrice: null,
  action: 'SELL',
};

describe('useProgressBarState', () => {
  it('returns hasRange=true when SL/TP differ from entry', () => {
    const { result } = renderHook(() => useProgressBarState(baseBuy));
    expect(result.current.hasRange).toBe(true);
  });

  it('returns hasRange=false when all prices are the same', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseBuy, entryPrice: 1, takeProfit: 1, stopLoss: 1 }),
    );
    expect(result.current.hasRange).toBe(false);
  });

  it('position is 50 when currentPrice is null', () => {
    const { result } = renderHook(() => useProgressBarState(baseBuy));
    expect(result.current.state.position).toBe(50);
    expect(result.current.state.hasLivePrice).toBe(false);
  });

  it('BUY: price at entry → position ~50, nearEntry=true', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseBuy, currentPrice: 1.1000 }),
    );
    expect(result.current.state.position).toBe(50);
    expect(result.current.state.nearEntry).toBe(true);
  });

  it('BUY: price at takeProfit → position 100', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseBuy, currentPrice: 1.1050 }),
    );
    expect(result.current.state.position).toBe(100);
    expect(result.current.state.isAboveEntry).toBe(true);
  });

  it('BUY: price at stopLoss → position 0', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseBuy, currentPrice: 1.0950 }),
    );
    expect(result.current.state.position).toBe(0);
    expect(result.current.state.isAboveEntry).toBe(false);
  });

  it('SELL: price at takeProfit → position 100', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseSell, currentPrice: 1.0950 }),
    );
    expect(result.current.state.position).toBe(100);
  });

  it('SELL: price at stopLoss → position 0', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseSell, currentPrice: 1.1050 }),
    );
    expect(result.current.state.position).toBe(0);
  });

  it('clamps position between 0 and 100 when price overshoots TP', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseBuy, currentPrice: 1.2000 }),
    );
    expect(result.current.state.position).toBe(100);
  });

  it('clamps position between 0 and 100 when price overshoots SL', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseBuy, currentPrice: 1.0800 }),
    );
    expect(result.current.state.position).toBe(0);
  });

  it('detects JPY pairs correctly', () => {
    const { result } = renderHook(() =>
      useProgressBarState({
        entryPrice: 150.000,
        takeProfit: 151.000,
        stopLoss: 149.000,
        currentPrice: 150.500,
        action: 'BUY',
      }),
    );
    expect(result.current.state.isJpy).toBe(true);
  });

  it('handles multiple take profits', () => {
    const { result } = renderHook(() =>
      useProgressBarState({
        ...baseBuy,
        takeProfit2: 1.1100,
        takeProfit3: 1.1150,
        currentPrice: 1.1000,
      }),
    );
    expect(result.current.state.hasMultipleTPs).toBe(true);
    expect(result.current.state.tp2Pos).not.toBeNull();
    expect(result.current.state.tp3Pos).toBe(100);
  });

  it('uses closedPrice when isCompleted', () => {
    const { result } = renderHook(() =>
      useProgressBarState({
        ...baseBuy,
        currentPrice: 1.1020,
        isCompleted: true,
        closedPrice: 1.1050,
      }),
    );
    expect(result.current.state.position).toBe(100);
  });

  it('progressColor is green when above entry', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseBuy, currentPrice: 1.1040 }),
    );
    expect(result.current.state.progressColor).toContain('142');
  });

  it('progressColor is red when below entry', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseBuy, currentPrice: 1.0960 }),
    );
    expect(result.current.state.progressColor).toContain('0, 70%');
  });

  it('targetLabel is TP1 when price is above entry', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseBuy, currentPrice: 1.1030 }),
    );
    expect(result.current.state.targetLabel).toBe('TP1');
  });

  it('targetLabel is SL when price is below entry', () => {
    const { result } = renderHook(() =>
      useProgressBarState({ ...baseBuy, currentPrice: 1.0960 }),
    );
    expect(result.current.state.targetLabel).toBe('SL');
  });
});
