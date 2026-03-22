import { cn } from '@/lib/utils';
import * as React from 'react';

interface ToolCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  /** Accent color in HSL format e.g. "200 80% 55%" */
  accent?: string;
  /** Optional header label */
  header?: React.ReactNode;
}

/**
 * MarketSessions-style translucent card for tool pages.
 * Replaces GlowCard in tool sub-pages for visual consistency.
 */
export function ToolCard({ children, className, accent, header, ...props }: ToolCardProps) {
  const borderColor = accent
    ? `hsl(${accent} / 0.2)`
    : 'hsl(var(--border) / 0.5)';
  const headerBg = accent
    ? `hsl(${accent} / 0.08)`
    : 'hsl(var(--muted) / 0.3)';

  return (
    <div
      className={cn('rounded-xl border overflow-hidden', className)}
      style={{
        borderColor,
        background: 'hsl(var(--card) / 0.6)',
      }}
      {...props}
    >
      {header && (
        <div
          className="px-3 py-2 flex items-center gap-1.5"
          style={{ background: headerBg }}
        >
          {header}
        </div>
      )}
      {children}
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
