import { useMemo } from 'react';
import { usePortfolioHistory } from '@/hooks/usePortfolioHistory';

interface EquitySparklineProps {
  width?: number;
  height?: number;
  className?: string;
}

export function EquitySparkline({ width = 80, height = 32, className = '' }: EquitySparklineProps) {
  const { snapshots, stats, loading } = usePortfolioHistory('1W');

  const { pathD, isPositive, gradientId } = useMemo(() => {
    if (snapshots.length < 2) {
      return { pathD: '', isPositive: true, gradientId: 'sparkline-gradient' };
    }

    const values = snapshots.map(s => s.total_equity);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = values.map((val, i) => {
      const x = padding + (i / (values.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((val - minVal) / range) * chartHeight;
      return { x, y };
    });

    const d = points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(' ');

    const change = values[values.length - 1] - values[0];
    
    return {
      pathD: d,
      isPositive: change >= 0,
      gradientId: `sparkline-${Math.random().toString(36).substr(2, 9)}`,
    };
  }, [snapshots, width, height]);

  if (loading || snapshots.length < 2) {
    return (
      <div 
        className={`animate-pulse bg-green-900/20 rounded ${className}`}
        style={{ width, height }}
      />
    );
  }

  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const fillColor = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  // Create area path (close the path for fill)
  const areaPath = pathD 
    ? `${pathD} L ${width - 2} ${height - 2} L 2 ${height - 2} Z`
    : '';

  return (
    <svg 
      width={width} 
      height={height} 
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />
      
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* End dot */}
      {snapshots.length > 0 && pathD && (
        <circle
          cx={width - 2}
          cy={pathD.split(' ').slice(-1)[0]}
          r="2"
          fill={strokeColor}
        />
      )}
    </svg>
  );
}
