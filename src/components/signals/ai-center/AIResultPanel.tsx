import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Copy, Check, FileText, Sparkles } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AIAnalysisResult } from '@/hooks/useAIAnalysis';

interface Props {
  result: AIAnalysisResult;
  title: string;
}

/* ── Markdown-lite parser ── */
interface ParsedBlock {
  type: 'heading' | 'subheading' | 'bullet' | 'numbered' | 'paragraph' | 'separator';
  text: string;
  level?: number;
}

function parseContent(raw: string): ParsedBlock[] {
  const lines = raw.split('\n');
  const blocks: ParsedBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // --- or *** separator
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ type: 'separator', text: '' });
      continue;
    }

    // ### Heading
    const h3 = trimmed.match(/^###\s+(.+)/);
    if (h3) { blocks.push({ type: 'subheading', text: h3[1].replace(/\*\*/g, ''), level: 3 }); continue; }

    // ## Heading
    const h2 = trimmed.match(/^##\s+(.+)/);
    if (h2) { blocks.push({ type: 'subheading', text: h2[1].replace(/\*\*/g, ''), level: 2 }); continue; }

    // # Heading
    const h1 = trimmed.match(/^#\s+(.+)/);
    if (h1) { blocks.push({ type: 'heading', text: h1[1].replace(/\*\*/g, ''), level: 1 }); continue; }

    // **Bold title line** (standalone bold = treat as subheading)
    const boldLine = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (boldLine) { blocks.push({ type: 'subheading', text: boldLine[1], level: 2 }); continue; }

    // - or * bullet
    const bullet = trimmed.match(/^[-*•]\s+(.+)/);
    if (bullet) { blocks.push({ type: 'bullet', text: bullet[1] }); continue; }

    // 1. numbered
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (numbered) { blocks.push({ type: 'numbered', text: numbered[1] }); continue; }

    // Regular paragraph
    blocks.push({ type: 'paragraph', text: trimmed });
  }

  return blocks;
}

/* ── Inline formatting: **bold**, *italic*, `code` ── */
function renderInline(text: string) {
  const parts: (string | JSX.Element)[] = [];
  // Simple regex-based inline formatting
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
        <code key={match.index} className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
          {match[6]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function AIResultPanel({ result, title }: Props) {
  const [copied, setCopied] = useState(false);

  const rawContent = typeof result.data === 'string'
    ? result.data
    : JSON.stringify(result.data, null, 2);

  const blocks = useMemo(() => parseContent(rawContent), [rawContent]);
  const isStructured = blocks.some(b => b.type === 'heading' || b.type === 'subheading' || b.type === 'bullet');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible defaultOpen>
      <div
        className="rounded-xl overflow-hidden transition-all"
        style={{
          background: 'hsl(210, 80%, 5%)',
          border: '1px solid hsl(210, 50%, 18%)',
        }}
      >
        {/* Header */}
        <CollapsibleTrigger className="w-full flex items-center gap-2.5 px-4 py-3 transition-colors group"
          style={{ borderBottom: '1px solid hsl(210, 50%, 12%)' }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(270, 70%, 45%), hsl(200, 80%, 45%))' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-white flex-1 text-left truncate">{title}</span>
          <span className="text-[10px] font-mono text-slate-500">
            {new Date(result.timestamp).toLocaleTimeString()}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="relative">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg transition-all"
              style={{
                background: 'hsl(210, 50%, 12%)',
                border: '1px solid hsl(210, 40%, 22%)',
              }}
              title="Copiar contenido"
            >
              {copied
                ? <Check className="w-3.5 h-3.5" style={{ color: 'hsl(160, 70%, 50%)' }} />
                : <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
              }
            </button>

            {/* Content area */}
            <div className="px-4 py-4 max-h-[500px] overflow-y-auto space-y-1 scrollbar-thin">
              {isStructured ? (
                blocks.map((block, i) => {
                  switch (block.type) {
                    case 'heading':
                      return (
                        <div key={i} className="pt-3 pb-1.5 first:pt-0">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(to bottom, hsl(200, 90%, 50%), hsl(270, 80%, 55%))' }} />
                            {block.text}
                          </h3>
                        </div>
                      );

                    case 'subheading':
                      return (
                        <div key={i} className="pt-3 pb-1 first:pt-0">
                          <h4
                            className={cn(
                              "font-semibold flex items-center gap-1.5",
                              block.level === 2 ? "text-[13px] text-cyan-300" : "text-xs text-slate-300"
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'hsl(200, 90%, 50%)' }} />
                            {block.text}
                          </h4>
                        </div>
                      );

                    case 'bullet':
                      return (
                        <div key={i} className="flex gap-2.5 pl-3 py-0.5">
                          <span className="text-cyan-500 mt-1.5 flex-shrink-0 text-[8px]">●</span>
                          <p className="text-[12px] text-slate-400 leading-relaxed flex-1">{renderInline(block.text)}</p>
                        </div>
                      );

                    case 'numbered':
                      return (
                        <div key={i} className="flex gap-2.5 pl-3 py-0.5">
                          <span
                            className="text-[10px] font-bold mt-0.5 flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                            style={{ background: 'hsl(210, 50%, 15%)', color: 'hsl(200, 80%, 60%)' }}
                          >
                            {i + 1}
                          </span>
                          <p className="text-[12px] text-slate-400 leading-relaxed flex-1">{renderInline(block.text)}</p>
                        </div>
                      );

                    case 'separator':
                      return (
                        <div key={i} className="py-2">
                          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(210, 50%, 25%), transparent)' }} />
                        </div>
                      );

                    case 'paragraph':
                      return (
                        <p key={i} className="text-[12px] text-slate-400 leading-relaxed py-0.5 pl-1">
                          {renderInline(block.text)}
                        </p>
                      );

                    default:
                      return null;
                  }
                })
              ) : (
                /* Fallback: raw preformatted text */
                <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                  {rawContent}
                </pre>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
