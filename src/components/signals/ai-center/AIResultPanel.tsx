import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronDown, Copy, Check, Sparkles,
  TrendingUp, AlertTriangle, Lightbulb, Target,
  Shield, BarChart3, ArrowRight
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AIAnalysisResult } from '@/hooks/useAIAnalysis';

interface Props {
  result: AIAnalysisResult;
  title: string;
}

/* ── Markdown-lite parser ── */
interface ParsedBlock {
  type: 'heading' | 'subheading' | 'bullet' | 'numbered' | 'paragraph' | 'separator' | 'keyvalue';
  text: string;
  level?: number;
  label?: string;
  value?: string;
}

function parseContent(raw: string): ParsedBlock[] {
  const lines = raw.split('\n');
  const blocks: ParsedBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ type: 'separator', text: '' });
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.+)/);
    if (h3) { blocks.push({ type: 'subheading', text: h3[1].replace(/\*\*/g, ''), level: 3 }); continue; }

    const h2 = trimmed.match(/^##\s+(.+)/);
    if (h2) { blocks.push({ type: 'subheading', text: h2[1].replace(/\*\*/g, ''), level: 2 }); continue; }

    const h1 = trimmed.match(/^#\s+(.+)/);
    if (h1) { blocks.push({ type: 'heading', text: h1[1].replace(/\*\*/g, ''), level: 1 }); continue; }

    const boldLine = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (boldLine) { blocks.push({ type: 'subheading', text: boldLine[1], level: 2 }); continue; }

    // Key: Value pattern (e.g. "Entrada: 1.0850")
    const kvBold = trimmed.match(/^\*\*(.+?)\*\*:\s*(.+)/);
    if (kvBold) { blocks.push({ type: 'keyvalue', text: trimmed, label: kvBold[1], value: kvBold[2] }); continue; }

    const bullet = trimmed.match(/^[-*•]\s+(.+)/);
    if (bullet) { blocks.push({ type: 'bullet', text: bullet[1] }); continue; }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (numbered) { blocks.push({ type: 'numbered', text: numbered[1] }); continue; }

    blocks.push({ type: 'paragraph', text: trimmed });
  }

  return blocks;
}

/* ── Inline formatting ── */
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

/* ── Smart icon for heading text ── */
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
  if (t.includes('recomend') || t.includes('conclus') || t.includes('resumen'))
    return <Lightbulb className="w-3.5 h-3.5" />;
  if (t.includes('alerta') || t.includes('alert') || t.includes('precaución'))
    return <AlertTriangle className="w-3.5 h-3.5" />;
  return <ArrowRight className="w-3.5 h-3.5" />;
}

/* ── Numbered counter ── */
let numberedCounter = 0;

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

  // Reset numbered counter for each render
  numberedCounter = 0;

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
          style={{
            background: 'linear-gradient(90deg, hsl(270, 80%, 55%), hsl(200, 90%, 50%), hsl(160, 70%, 50%))',
          }}
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
              {blocks.length} secciones · {new Date(result.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 transition-transform duration-300 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* Divider */}
          <div className="mx-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(210, 50%, 18%), transparent)' }} />

          <div className="relative">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 z-10 p-2 rounded-lg transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'hsl(210, 50%, 10%)',
                border: '1px solid hsl(210, 40%, 20%)',
              }}
              title="Copiar contenido"
            >
              {copied
                ? <Check className="w-3.5 h-3.5" style={{ color: 'hsl(160, 70%, 55%)' }} />
                : <Copy className="w-3.5 h-3.5 text-slate-500" />
              }
            </button>

            {/* Content area */}
            <div className="px-4 pt-4 pb-5 max-h-[600px] overflow-y-auto scrollbar-thin">
              {isStructured ? (
                <div className="space-y-1">
                  {blocks.map((block, i) => {
                    switch (block.type) {
                      case 'heading':
                        return (
                          <div key={i} className="pt-5 pb-2 first:pt-1">
                            <div
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                              style={{
                                background: 'linear-gradient(135deg, hsl(200, 80%, 10%), hsl(210, 60%, 8%))',
                                border: '1px solid hsl(200, 50%, 20%)',
                              }}
                            >
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: 'linear-gradient(135deg, hsl(200, 90%, 40%), hsl(200, 70%, 30%))',
                                }}
                              >
                                {getHeadingIcon(block.text)}
                              </div>
                              <h3 className="text-[13px] font-bold text-white tracking-tight">{block.text}</h3>
                            </div>
                          </div>
                        );

                      case 'subheading':
                        return (
                          <div key={i} className="pt-4 pb-1.5 first:pt-1">
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
                                className={cn(
                                  "font-semibold tracking-tight",
                                  block.level === 2 ? "text-[12px]" : "text-[11px]"
                                )}
                                style={{
                                  color: block.level === 2 ? 'hsl(200, 80%, 70%)' : 'hsl(210, 30%, 70%)',
                                }}
                              >
                                {block.text}
                              </h4>
                            </div>
                          </div>
                        );

                      case 'keyvalue':
                        return (
                          <div
                            key={i}
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
                          <div key={i} className="flex gap-2.5 pl-3 py-1 group/bullet">
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

                      case 'numbered': {
                        numberedCounter++;
                        return (
                          <div key={i} className="flex gap-2.5 pl-2 py-1.5">
                            <span
                              className="text-[10px] font-bold mt-[2px] flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
                              style={{
                                background: 'linear-gradient(135deg, hsl(200, 80%, 15%), hsl(210, 60%, 12%))',
                                color: 'hsl(200, 90%, 65%)',
                                border: '1px solid hsl(200, 50%, 25%)',
                              }}
                            >
                              {numberedCounter}
                            </span>
                            <p className="text-[12px] text-slate-400 leading-[1.7] flex-1">{renderInline(block.text)}</p>
                          </div>
                        );
                      }

                      case 'separator':
                        return (
                          <div key={i} className="py-3">
                            <div
                              className="h-px"
                              style={{
                                background: 'linear-gradient(90deg, transparent, hsl(200, 50%, 22%), hsl(270, 40%, 22%), transparent)',
                              }}
                            />
                          </div>
                        );

                      case 'paragraph':
                        return (
                          <p key={i} className="text-[12px] text-slate-400 leading-[1.8] py-0.5 pl-1">
                            {renderInline(block.text)}
                          </p>
                        );

                      default:
                        return null;
                    }
                  })}
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
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(160, 70%, 50%)' }} />
                <span className="text-[10px] text-slate-600">Generado por IA · Gemini</span>
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
