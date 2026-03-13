/** Blinking cursor shown while streaming blocks */
export function StreamingCursor() {
  return (
    <div className="flex items-center gap-2 pl-3 py-2">
      <div className="flex gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: 'hsl(200, 90%, 55%)', animationDelay: '0ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: 'hsl(270, 70%, 55%)', animationDelay: '150ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: 'hsl(160, 70%, 50%)', animationDelay: '300ms' }}
        />
      </div>
      <span className="text-[10px] text-slate-500 italic">Generando análisis…</span>
    </div>
  );
}
