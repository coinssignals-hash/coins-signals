import { cn } from '@/lib/utils';
import * as React from 'react';

interface ToolCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  /** Accent color in HSL format e.g. "200 80% 55%" */
  accent?: string;
  /** Optional header label */
  header?: React.ReactNode;
  /** Use the premium SessionCard-style gradient card (default: true) */
  premium?: boolean;
}

/**
 * MarketSessions-style premium card for tool pages.
 * Mimics the SessionCard gradient, top glow line and radial glow.
 */
export function ToolCard({ children, className, accent, header, premium = true, ...props }: ToolCardProps) {
  const color = accent || '210 70% 55%'; // default blue accent like sessions

  if (!premium) {
    // Simple translucent fallback
    return (
      <div
        className={cn('rounded-xl border overflow-hidden', className)}
        style={{
          borderColor: accent ? `hsl(${accent} / 0.2)` : 'hsl(var(--border) / 0.5)',
          background: 'hsl(var(--card) / 0.6)',
        }}
        {...props}
      >
        {header && (
          <div
            className="px-3 py-2 flex items-center gap-1.5"
            style={{ background: accent ? `hsl(${accent} / 0.08)` : 'hsl(var(--muted) / 0.3)' }}
          >
            {header}
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn('relative rounded-2xl overflow-hidden', className)}
      style={{
        background: `linear-gradient(165deg, hsl(${color} / 0.08) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
        border: `1px solid hsl(${color} / 0.2)`,
      }}
      {...props}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 inset-x-0 h-[2px] z-[1]"
        style={{
          background: `linear-gradient(90deg, transparent, hsl(${color} / 0.7), transparent)`,
        }}
      />

      {/* Subtle radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle, hsl(${color} / 0.4), transparent 70%)`,
        }}
      />

      {/* Header */}
      {header && (
        <div
          className="relative z-[2] px-3 py-2 flex items-center gap-1.5"
          style={{
            background: `hsl(${color} / 0.06)`,
            borderBottom: '1px solid hsl(var(--border) / 0.3)',
          }}
        >
          {header}
        </div>
      )}

      {/* Content */}
      <div className="relative z-[2]">
        {children}
      </div>
    </div>
  );
}

interface ToolHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
}

/**
 * Consistent back button + title for tool pages, matching MarketSessions style.
 */
export function ToolPageHeader({ icon, title, subtitle, accent }: ToolHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <a
        href="/tools"
        onClick={(e) => {
          e.preventDefault();
          window.history.back();
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm"
        style={{
          background: 'hsl(var(--card) / 0.85)',
          border: '1px solid hsl(var(--border) / 0.6)',
          boxShadow: '0 2px 8px hsl(0 0% 0% / 0.3)',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </a>
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <div className="min-w-0">
          <h1 className="text-base font-bold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * Inner section card matching the SessionCard stats style.
 */
interface ToolSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  accent?: string;
}

export function ToolSection({ children, accent, className, ...props }: ToolSectionProps) {
  const color = accent || '210 70% 55%';
  return (
    <div
      className={cn('rounded-xl p-3', className)}
      style={{
        background: 'hsl(var(--card) / 0.6)',
        border: '1px solid hsl(var(--border) / 0.5)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Accent-colored table/grid header matching SessionCard's live data headers.
 */
interface ToolTableHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  accent?: string;
}

export function ToolTableHeader({ children, accent, className, ...props }: ToolTableHeaderProps) {
  const color = accent || '210 70% 55%';
  return (
    <div
      className={cn('px-2.5 py-1 flex items-center justify-between', className)}
      style={{
        background: `hsl(${color} / 0.06)`,
        borderBottom: '1px solid hsl(var(--border) / 0.3)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}
