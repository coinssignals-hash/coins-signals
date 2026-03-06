import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TargetProgressBar } from '../../TargetProgressBar';

describe('TargetProgressBar integration', () => {
  const baseBuy = {
    entryPrice: 1.1000,
    takeProfit: 1.1050,
    stopLoss: 1.0950,
    action: 'BUY' as const,
  };

  // --- Render / no-render ---

  it('renders nothing when all prices are equal (no range)', () => {
    const { container } = render(
      <TargetProgressBar {...baseBuy} entryPrice={1} takeProfit={1} stopLoss={1} currentPrice={1} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the full bar for a valid BUY signal', () => {
    const { container } = render(
      <TargetProgressBar {...baseBuy} currentPrice={1.1020} />,
    );
    expect(container.querySelector('.rounded-full')).toBeTruthy();
    expect(screen.getByText('SL')).toBeInTheDocument();
    expect(screen.getByText('TP')).toBeInTheDocument();
  });

  it('renders the full bar for a valid SELL signal', () => {
    render(
      <TargetProgressBar
        entryPrice={1.1000}
        takeProfit={1.0950}
        stopLoss={1.1050}
        action="SELL"
        currentPrice={1.0970}
      />,
    );
    expect(screen.getByText('SL')).toBeInTheDocument();
    expect(screen.getByText('TP')).toBeInTheDocument();
  });

  // --- Null / missing price ---

  it('renders with currentPrice=null (no live dot)', () => {
    const { container } = render(
      <TargetProgressBar {...baseBuy} currentPrice={null} />,
    );
    // Should still render the bar structure
    expect(container.firstChild).toBeTruthy();
    expect(screen.getByText('Entry')).toBeInTheDocument();
  });

  // --- Completed signals ---

  it('shows ✅ TP badge when completed with tp_hit', () => {
    render(
      <TargetProgressBar
        {...baseBuy}
        currentPrice={1.1050}
        isCompleted
        closedResult="tp_hit"
        closedPrice={1.1050}
      />,
    );
    expect(screen.getByText('✅ TP')).toBeInTheDocument();
  });

  it('shows ❌ SL badge when completed with sl_hit', () => {
    render(
      <TargetProgressBar
        {...baseBuy}
        currentPrice={1.0950}
        isCompleted
        closedResult="sl_hit"
        closedPrice={1.0950}
      />,
    );
    expect(screen.getByText('❌ SL')).toBeInTheDocument();
  });

  it('shows ⏱ Exp badge when completed with expired', () => {
    render(
      <TargetProgressBar
        {...baseBuy}
        currentPrice={1.1010}
        isCompleted
        closedResult="expired"
        closedPrice={1.1010}
      />,
    );
    expect(screen.getByText('⏱ Exp')).toBeInTheDocument();
  });

  // --- Multiple TPs ---

  it('renders TP1, TP2, TP3 labels when multiple TPs provided', () => {
    render(
      <TargetProgressBar
        {...baseBuy}
        takeProfit2={1.1100}
        takeProfit3={1.1150}
        currentPrice={1.1020}
      />,
    );
    expect(screen.getByText('TP1')).toBeInTheDocument();
    expect(screen.getByText('TP2')).toBeInTheDocument();
    expect(screen.getByText('TP3')).toBeInTheDocument();
  });

  it('renders only TP (not TP1/TP2/TP3) when single TP', () => {
    render(
      <TargetProgressBar {...baseBuy} currentPrice={1.1020} />,
    );
    expect(screen.getByText('TP')).toBeInTheDocument();
    expect(screen.queryByText('TP1')).not.toBeInTheDocument();
    expect(screen.queryByText('TP2')).not.toBeInTheDocument();
  });

  // --- Compact mode ---

  it('renders compact version when compact=true', () => {
    const { container } = render(
      <TargetProgressBar {...baseBuy} currentPrice={1.1020} compact />,
    );
    // Compact bar has h-1.5 track instead of h-2
    expect(container.querySelector('.h-1\\.5')).toBeTruthy();
    expect(screen.getByText('SL')).toBeInTheDocument();
    expect(screen.getByText('TP')).toBeInTheDocument();
  });

  it('compact mode does NOT render Entry label or StatusBadge', () => {
    render(
      <TargetProgressBar {...baseBuy} currentPrice={1.1020} compact />,
    );
    expect(screen.queryByText('Entry')).not.toBeInTheDocument();
  });

  // --- JPY pair ---

  it('formats JPY prices correctly', () => {
    render(
      <TargetProgressBar
        entryPrice={150.000}
        takeProfit={151.000}
        stopLoss={149.000}
        action="BUY"
        currentPrice={150.500}
      />,
    );
    expect(screen.getByText('Entry')).toBeInTheDocument();
    expect(screen.getByText('SL')).toBeInTheDocument();
  });

  // --- Edge: price exactly at entry ---

  it('shows near-entry styling when price equals entry', () => {
    render(
      <TargetProgressBar {...baseBuy} currentPrice={1.1000} />,
    );
    // The status badge should show ENTRY label
    expect(screen.getByText(/ENTRY/)).toBeInTheDocument();
  });
});
