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

  it('renders nothing when all prices are equal', () => {
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
    // SL appears in header + price labels = multiple matches
    expect(screen.getAllByText('SL').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('TP').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the full bar for a valid SELL signal', () => {
    render(
      <TargetProgressBar
        entryPrice={1.1000} takeProfit={1.0950} stopLoss={1.1050}
        action="SELL" currentPrice={1.0970}
      />,
    );
    expect(screen.getAllByText('SL').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('TP').length).toBeGreaterThanOrEqual(1);
  });

  it('renders with currentPrice=null (no live dot)', () => {
    const { container } = render(
      <TargetProgressBar {...baseBuy} currentPrice={null} />,
    );
    expect(container.firstChild).toBeTruthy();
    expect(screen.getByText('Entry')).toBeInTheDocument();
  });

  it('shows ✅ badge with pips when completed with tp_hit', () => {
    render(
      <TargetProgressBar {...baseBuy} currentPrice={1.1050} isCompleted closedResult="tp_hit" closedPrice={1.1050} />,
    );
    expect(screen.getByText(/✅.*TP1.*100\.0%/)).toBeInTheDocument();
  });

  it('shows ❌ badge with pips when completed with sl_hit', () => {
    render(
      <TargetProgressBar {...baseBuy} currentPrice={1.0950} isCompleted closedResult="sl_hit" closedPrice={1.0950} />,
    );
    expect(screen.getByText(/❌.*SL.*100%/)).toBeInTheDocument();
  });

  it('shows ⏱ badge with pips when completed with expired', () => {
    render(
      <TargetProgressBar {...baseBuy} currentPrice={1.1010} isCompleted closedResult="expired" closedPrice={1.1010} />,
    );
    expect(screen.getByText(/⏱/)).toBeInTheDocument();
  });

  it('renders TP1, TP2, TP3 labels when multiple TPs provided', () => {
    render(
      <TargetProgressBar {...baseBuy} takeProfit2={1.1100} takeProfit3={1.1150} currentPrice={1.1020} />,
    );
    expect(screen.getByText('TP1')).toBeInTheDocument();
    expect(screen.getByText('TP2')).toBeInTheDocument();
    expect(screen.getByText('TP3')).toBeInTheDocument();
  });

  it('does not render TP1/TP2/TP3 when single TP', () => {
    render(<TargetProgressBar {...baseBuy} currentPrice={1.1020} />);
    expect(screen.queryByText('TP1')).not.toBeInTheDocument();
    expect(screen.queryByText('TP2')).not.toBeInTheDocument();
    expect(screen.queryByText('TP3')).not.toBeInTheDocument();
  });

  it('renders compact version when compact=true', () => {
    const { container } = render(
      <TargetProgressBar {...baseBuy} currentPrice={1.1020} compact />,
    );
    expect(container.querySelector('.h-1\\.5')).toBeTruthy();
  });

  it('compact mode does NOT render Entry label', () => {
    render(<TargetProgressBar {...baseBuy} currentPrice={1.1020} compact />);
    expect(screen.queryByText('Entry')).not.toBeInTheDocument();
  });

  it('formats JPY prices and renders structure', () => {
    const { container } = render(
      <TargetProgressBar entryPrice={150} takeProfit={151} stopLoss={149} action="BUY" currentPrice={150.5} />,
    );
    expect(container.firstChild).toBeTruthy();
    expect(screen.getByText('Entry')).toBeInTheDocument();
  });

  it('shows near-entry status when price equals entry', () => {
    render(<TargetProgressBar {...baseBuy} currentPrice={1.1000} />);
    // Near entry: badge shows yellow styling with 0% progress
    expect(screen.getByText(/0\.0% · 0\.00p/)).toBeInTheDocument();
  });

  it('displays entry price in labels', () => {
    render(<TargetProgressBar {...baseBuy} currentPrice={1.1020} />);
    expect(screen.getByText('1.10000')).toBeInTheDocument();
  });

  it('displays SL and TP prices in labels', () => {
    render(<TargetProgressBar {...baseBuy} currentPrice={1.1020} />);
    expect(screen.getByText('1.09500')).toBeInTheDocument();
    expect(screen.getByText('1.10500')).toBeInTheDocument();
  });
});
