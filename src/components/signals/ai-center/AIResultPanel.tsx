import { useState, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronDown, Copy, Check, Sparkles,
  TrendingUp, AlertTriangle, Lightbulb, Target,
  Shield, BarChart3, ArrowRight, Wifi, WifiOff
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AIAnalysisResult } from '@/hooks/useAIAnalysis';
import { useTranslation } from '@/i18n/LanguageContext';
import { useStreamingBlocks } from './useStreamingBlocks';
import { StreamingCursor } from './StreamingCursor';

interface Props {
  result: AIAnalysisResult;
  title: string;
}

/* ── Extract live quote status from edge function response ── */
function extractLiveQuote(data: unknown): { hasLiveData: boolean; price?: number; timestamp?: string } {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const lq = obj.liveQuote as Record<string, unknown> | undefined;
    if (lq && typeof lq === 'object' && lq.price) {
      return { hasLiveData: true, price: lq.price as number, timestamp: lq.timestamp as string | undefined };
    }
  }
  return { hasLiveData: false };
}

/* ── Extract text content from edge function response ── */
function extractContent(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    // Known response keys from edge functions
    for (const key of ['analysis', 'prediction', 'report', 'synthesis', 'correlation', 'content', 'text', 'result']) {
      if (typeof obj[key] === 'string') return obj[key] as string;
    }
    // Fallback: find first string value that looks like content
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && (val as string).length > 50) return val as string;
    }
  }
  return JSON.stringify(data, null, 2);
}

/* ── Parsed block types ── */
interface ParsedBlock {
  type: 'heading' | 'subheading' | 'bullet' | 'numbered' | 'paragraph' | 'separator' | 'keyvalue' | 'emoji-heading';
  text: string;
  level?: number;
  label?: string;
  value?: string;
  emoji?: string;
}

function parseContent(raw: string): ParsedBlock[] {
  const lines = raw.split('\n');
  const blocks: ParsedBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ type: 'separator', text: '' });
      continue;
    }

    // Headings with emojis (e.g. "📊 Resumen del mercado" or "## 📊 Resumen")
    const emojiHeading = trimmed.match(/^#{1,3}\s*([\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}])\s*(.+)/u);
    if (emojiHeading) {
      blocks.push({ type: 'emoji-heading', text: emojiHeading[2].replace(/\*\*/g, ''), emoji: emojiHeading[1] });
      continue;
    }

    // Bold emoji heading (e.g. "**📊 Resumen:**")
    const boldEmojiHeading = trimmed.match(/^\*\*([\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}])\s*(.+?)\*\*:?\s*$/u);
    if (boldEmojiHeading) {
      blocks.push({ type: 'emoji-heading', text: boldEmojiHeading[2], emoji: boldEmojiHeading[1] });
      continue;
    }

    // Standalone emoji line as heading
    const standaloneEmoji = trimmed.match(/^([\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}])\s+(.{3,})/u);
    if (standaloneEmoji && !trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.match(/^\d/)) {
      blocks.push({ type: 'emoji-heading', text: standaloneEmoji[2].replace(/\*\*/g, ''), emoji: standaloneEmoji[1] });
      continue;
    }

    // H3
    const h3 = trimmed.match(/^###\s+(.+)/);
    if (h3) { blocks.push({ type: 'subheading', text: h3[1].replace(/\*\*/g, ''), level: 3 }); continue; }

    // H2
    const h2 = trimmed.match(/^##\s+(.+)/);
    if (h2) { blocks.push({ type: 'subheading', text: h2[1].replace(/\*\*/g, ''), level: 2 }); continue; }

    // H1
    const h1 = trimmed.match(/^#\s+(.+)/);
    if (h1) { blocks.push({ type: 'heading', text: h1[1].replace(/\*\*/g, ''), level: 1 }); continue; }

    // Bold-only line as subheading
    const boldLine = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (boldLine) { blocks.push({ type: 'subheading', text: boldLine[1], level: 2 }); continue; }

    // Key: Value (bold key)
    const kvBold = trimmed.match(/^\*\*(.+?)\*\*:\s*(.+)/);
    if (kvBold) { blocks.push({ type: 'keyvalue', text: trimmed, label: kvBold[1], value: kvBold[2] }); continue; }

    // Bullet
    const bullet = trimmed.match(/^[-*•]\s+(.+)/);
    if (bullet) { blocks.push({ type: 'bullet', text: bullet[1] }); continue; }

    // Numbered
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (numbered) { blocks.push({ type: 'numbered', text: numbered[1] }); continue; }

    // Paragraph
    blocks.push({ type: 'paragraph', text: trimmed });
  }

  return blocks;
}

/* ── Inline formatting with emoji support ── */
function renderInline(text: string) {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index} className="text-white font-semibold">{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={match.index} className="text-slate-300 italic">{match[4]}</em>);
    } else if (match[6]) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono"
          style={{
            background: 'hsl(200, 80%, 12%)',
            color: 'hsl(200, 90%, 70%)',
            border: '1px solid hsl(200, 50%, 22%)',
          }}
        >
          {match[6]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

/* ── Icon mapping ── */
function getHeadingIcon(text: string) {
  const t = text.toLowerCase();
  if (t.includes('señal') || t.includes('signal') || t.includes('predicción') || t.includes('prediccion'))
    return <Target className="w-3.5 h-3.5" />;
  if (t.includes('riesgo') || t.includes('risk') || t.includes('stop'))
    return <Shield className="w-3.5 h-3.5" />;
  if (t.includes('tendencia') || t.includes('trend') || t.includes('alcista') || t.includes('bajista'))
    return <TrendingUp className="w-3.5 h-3.5" />;
  if (t.includes('patrón') || t.includes('patron') || t.includes('pattern') || t.includes('técnic'))
    return <BarChart3 className="w-3.5 h-3.5" />;
  if (t.includes('recomend') || t.includes('conclus') || t.includes('resumen') || t.includes('síntesis'))
    return <Lightbulb className="w-3.5 h-3.5" />;
  if (t.includes('alerta') || t.includes('alert') || t.includes('precaución'))
    return <AlertTriangle className="w-3.5 h-3.5" />;
  return <ArrowRight className="w-3.5 h-3.5" />;
}

/* ── Block renderer ── */
function RenderBlock({ block, index }: { block: ParsedBlock; index: number }) {
  switch (block.type) {
    case 'heading':
      return (
        <div className="pt-5 pb-2 first:pt-1">
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, hsl(200, 80%, 10%), hsl(210, 60%, 8%))',
              border: '1px solid hsl(200, 50%, 20%)',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(200, 90%, 40%), hsl(200, 70%, 30%))' }}
            >
              {getHeadingIcon(block.text)}
            </div>
            <h3 className="text-[13px] font-bold text-white tracking-tight">{block.text}</h3>
          </div>
        </div>
      );

    case 'emoji-heading':
      return (
        <div className="pt-4 pb-2 first:pt-1">
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, hsl(270, 60%, 10%), hsl(210, 50%, 8%))',
              border: '1px solid hsl(270, 40%, 20%)',
            }}
          >
            <span className="text-lg flex-shrink-0">{block.emoji}</span>
            <h4 className="text-[12px] font-bold text-white tracking-tight">{block.text}</h4>
          </div>
        </div>
      );

    case 'subheading':
      return (
        <div className="pt-4 pb-1.5 first:pt-1">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-5 rounded-full flex-shrink-0"
              style={{
                background: block.level === 2
                  ? 'linear-gradient(to bottom, hsl(200, 90%, 50%), hsl(200, 70%, 35%))'
                  : 'linear-gradient(to bottom, hsl(270, 70%, 55%), hsl(270, 50%, 35%))',
              }}
            />
            <h4
              className={cn("font-semibold tracking-tight", block.level === 2 ? "text-[12px]" : "text-[11px]")}
              style={{ color: block.level === 2 ? 'hsl(200, 80%, 70%)' : 'hsl(210, 30%, 70%)' }}
            >
              {block.text}
            </h4>
          </div>
        </div>
      );

    case 'keyvalue':
      return (
        <div
          className="flex items-center justify-between px-3 py-2 ml-3 rounded-lg"
          style={{
            background: 'hsl(210, 60%, 7%)',
            borderLeft: '2px solid hsl(200, 60%, 30%)',
          }}
        >
          <span className="text-[11px] text-slate-400 font-medium">{block.label}</span>
          <span className="text-[12px] text-white font-bold font-mono">{block.value}</span>
        </div>
      );

    case 'bullet':
      return (
        <div className="flex gap-2.5 pl-3 py-1 group/bullet">
          <div
            className="w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0 transition-all group-hover/bullet:scale-125"
            style={{
              background: 'hsl(200, 90%, 55%)',
              boxShadow: '0 0 6px hsla(200, 90%, 55%, 0.4)',
            }}
          />
          <p className="text-[12px] text-slate-400 leading-[1.7] flex-1">{renderInline(block.text)}</p>
        </div>
      );

    case 'numbered':
      return (
        <div className="flex gap-2.5 pl-2 py-1.5">
          <span
            className="text-[10px] font-bold mt-[2px] flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(200, 80%, 15%), hsl(210, 60%, 12%))',
              color: 'hsl(200, 90%, 65%)',
              border: '1px solid hsl(200, 50%, 25%)',
            }}
          >
            {index + 1}
          </span>
          <p className="text-[12px] text-slate-400 leading-[1.7] flex-1">{renderInline(block.text)}</p>
        </div>
      );

    case 'separator':
      return (
        <div className="py-3">
          <div
            className="h-px"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(200, 50%, 22%), hsl(270, 40%, 22%), transparent)' }}
          />
        </div>
      );

    case 'paragraph':
      return (
        <p className="text-[12px] text-slate-400 leading-[1.8] py-0.5 pl-1">
          {renderInline(block.text)}
        </p>
      );

    default:
      return null;
  }
}

/* ── Main Panel ── */
export function AIResultPanel({ result, title }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rawContent = useMemo(() => extractContent(result.data), [result.data]);
  const liveQuoteInfo = useMemo(() => extractLiveQuote(result.data), [result.data]);
  const blocks = useMemo(() => parseContent(rawContent), [rawContent]);
  const isStructured = blocks.some(b =>
    b.type === 'heading' || b.type === 'subheading' || b.type === 'bullet' || b.type === 'emoji-heading'
  );

  // Unique ID for this result to avoid re-animating
  const resultId = `${result.module}-${result.timestamp}`;

  // Streaming reveal
  const { visibleCount, isStreaming } = useStreamingBlocks(blocks.length, resultId, 55);

  // Track numbered items sequentially
  const numberedIndices = useMemo(() => {
    let counter = 0;
    return blocks.map(b => b.type === 'numbered' ? counter++ : -1);
  }, [blocks]);

  // Auto-scroll to bottom as blocks appear
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible defaultOpen>
      <div
        className="rounded-2xl overflow-hidden transition-all"
        style={{
          background: 'radial-gradient(ellipse at top left, hsl(210, 80%, 8%) 0%, hsl(210, 100%, 4%) 70%)',
          border: '1px solid hsl(210, 50%, 16%)',
          boxShadow: '0 8px 32px -8px hsla(210, 80%, 10%, 0.5)',
        }}
      >
        {/* Accent top line */}
        <div
          className="h-[2px]"
          style={{ background: 'linear-gradient(90deg, hsl(270, 80%, 55%), hsl(200, 90%, 50%), hsl(160, 70%, 50%))' }}
        />

        {/* Header */}
        <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors group hover:bg-white/[0.02]">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(270, 70%, 45%), hsl(200, 80%, 45%))',
              boxShadow: '0 0 16px -4px hsla(270, 80%, 55%, 0.4)',
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[13px] font-bold text-white block truncate">{title}</span>
            <span className="text-[10px] text-slate-500">
              {isStreaming
                ? `${visibleCount}/${blocks.length} ${t('ai_center_sections')}…`
                : `${blocks.length} ${t('ai_center_sections')} · ${new Date(result.timestamp).toLocaleTimeString()}`
              }
            </span>
          </div>
          {isStreaming && (
            <div
              className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
              style={{ background: 'hsl(160, 70%, 50%)', boxShadow: '0 0 8px hsla(160, 70%, 50%, 0.5)' }}
            />
          )}
          <ChevronDown className="w-4 h-4 text-slate-500 transition-transform duration-300 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mx-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(210, 50%, 18%), transparent)' }} />

          <div className="relative">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 z-10 p-2 rounded-lg transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'hsl(210, 50%, 10%)',
                border: '1px solid hsl(210, 40%, 20%)',
                opacity: isStreaming ? 0.4 : 1,
              }}
              title={t('ai_center_copy_content')}
              disabled={isStreaming}
            >
              {copied
                ? <Check className="w-3.5 h-3.5" style={{ color: 'hsl(160, 70%, 55%)' }} />
                : <Copy className="w-3.5 h-3.5 text-slate-500" />
              }
            </button>

            {/* Content area */}
            <div ref={scrollRef} className="px-4 pt-4 pb-5 max-h-[600px] overflow-y-auto scrollbar-thin">
              {isStructured ? (
                <div className="space-y-1">
                  {blocks.slice(0, visibleCount).map((block, i) => (
                    <div
                      key={i}
                      className="animate-fade-in"
                      style={{ animationDuration: '0.25s', animationFillMode: 'both' }}
                    >
                      <RenderBlock
                        block={block}
                        index={block.type === 'numbered' ? numberedIndices[i] : i}
                      />
                    </div>
                  ))}
                  {isStreaming && <StreamingCursor />}
                </div>
              ) : (
                <pre
                  className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed p-3 rounded-xl"
                  style={{
                    background: 'hsl(210, 60%, 6%)',
                    border: '1px solid hsl(210, 40%, 14%)',
                  }}
                >
                  {rawContent}
                </pre>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                borderTop: '1px solid hsl(210, 50%, 12%)',
                background: 'hsl(210, 80%, 4%)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: isStreaming ? 'hsl(45, 90%, 55%)' : 'hsl(160, 70%, 50%)' }} />
                <span className="text-[10px] text-slate-600">
                  {isStreaming ? 'Streaming…' : t('ai_center_generated_by')}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-600">
                {rawContent.length.toLocaleString()} chars
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
