/**
 * CSV Parser module with auto-detection for multiple broker formats.
 * Supports: MT4/MT5, cTrader, OANDA, Alpaca, Binance, NinjaTrader, Generic
 */

export interface ParsedTrade {
  external_trade_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  entry_time: string; // ISO string
  exit_time: string | null;
  commission: number;
  swap: number;
  profit: number;
  status: 'closed' | 'open';
  notes: string;
}

export interface BrokerFormat {
  id: string;
  name: string;
  requiredHeaders: string[];
  parse: (rows: Record<string, string>[]) => ParsedTrade[];
}

// ─── Utility helpers ───────────────────────────────────────────────────────

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseDate(val: string | undefined): string {
  if (!val) return new Date().toISOString();
  // Try multiple date formats
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString();
  // Try DD.MM.YYYY HH:mm:ss
  const parts = val.match(/(\d{2})[./](\d{2})[./](\d{4})\s*(\d{2}):(\d{2}):?(\d{2})?/);
  if (parts) {
    return new Date(`${parts[3]}-${parts[2]}-${parts[1]}T${parts[4]}:${parts[5]}:${parts[6] || '00'}`).toISOString();
  }
  return new Date().toISOString();
}

function normalizeSide(val: string): 'buy' | 'sell' {
  const lower = val.toLowerCase().trim();
  if (['buy', 'long', 'compra'].includes(lower)) return 'buy';
  if (['sell', 'short', 'venta'].includes(lower)) return 'sell';
  if (lower.includes('buy') || lower.includes('long')) return 'buy';
  return 'sell';
}

// ─── MT4 / MT5 Parser ──────────────────────────────────────────────────────

const mt4Parser: BrokerFormat = {
  id: 'mt4',
  name: 'MetaTrader 4/5',
  requiredHeaders: ['Ticket', 'Open Time', 'Type', 'Size', 'Symbol', 'Open Price', 'Close Price', 'Profit'],
  parse(rows) {
    return rows
      .filter(r => r['Type'] && !r['Type'].toLowerCase().includes('balance'))
      .map(r => ({
        external_trade_id: r['Ticket'] || crypto.randomUUID(),
        symbol: (r['Symbol'] || r['Item'] || '').trim(),
        side: normalizeSide(r['Type']),
        quantity: parseNum(r['Size'] || r['Volume']),
        entry_price: parseNum(r['Open Price'] || r['Price']),
        exit_price: r['Close Price'] ? parseNum(r['Close Price']) : null,
        entry_time: parseDate(r['Open Time']),
        exit_time: r['Close Time'] ? parseDate(r['Close Time']) : null,
        commission: parseNum(r['Commission']),
        swap: parseNum(r['Swap']),
        profit: parseNum(r['Profit']),
        status: (r['Close Time'] && r['Close Price']) ? 'closed' as const : 'open' as const,
        notes: r['Comment'] || '',
      }));
  },
};

// ─── cTrader Parser ────────────────────────────────────────────────────────

const ctraderParser: BrokerFormat = {
  id: 'ctrader',
  name: 'cTrader',
  requiredHeaders: ['Position ID', 'Symbol', 'Direction', 'Entry Price', 'Close Price'],
  parse(rows) {
    return rows.map(r => ({
      external_trade_id: r['Position ID'] || crypto.randomUUID(),
      symbol: (r['Symbol'] || '').trim(),
      side: normalizeSide(r['Direction']),
      quantity: parseNum(r['Quantity'] || r['Volume']),
      entry_price: parseNum(r['Entry Price']),
      exit_price: r['Close Price'] ? parseNum(r['Close Price']) : null,
      entry_time: parseDate(r['Entry Time'] || r['Opening Time']),
      exit_time: r['Close Time'] || r['Closing Time'] ? parseDate(r['Close Time'] || r['Closing Time']) : null,
      commission: parseNum(r['Commission']),
      swap: parseNum(r['Swap']),
      profit: parseNum(r['Net Profit'] || r['Gross Profit']),
      status: (r['Close Price']) ? 'closed' as const : 'open' as const,
      notes: r['Label'] || '',
    }));
  },
};

// ─── OANDA CSV Parser ──────────────────────────────────────────────────────

const oandaParser: BrokerFormat = {
  id: 'oanda',
  name: 'OANDA',
  requiredHeaders: ['Transaction ID', 'Instrument', 'Units', 'P/L'],
  parse(rows) {
    return rows
      .filter(r => r['Type']?.toLowerCase().includes('trade') || r['Instrument'])
      .map(r => ({
        external_trade_id: r['Transaction ID'] || crypto.randomUUID(),
        symbol: (r['Instrument'] || '').trim().replace('_', '/'),
        side: parseNum(r['Units']) >= 0 ? 'buy' as const : 'sell' as const,
        quantity: Math.abs(parseNum(r['Units'])),
        entry_price: parseNum(r['Price']),
        exit_price: null,
        entry_time: parseDate(r['Date/Time'] || r['Time']),
        exit_time: null,
        commission: parseNum(r['Commission']),
        swap: parseNum(r['Financing']),
        profit: parseNum(r['P/L']),
        status: 'closed' as const,
        notes: r['Type'] || '',
      }));
  },
};

// ─── Alpaca CSV Parser ─────────────────────────────────────────────────────

const alpacaParser: BrokerFormat = {
  id: 'alpaca',
  name: 'Alpaca',
  requiredHeaders: ['Symbol', 'Side', 'Qty', 'Price', 'Status'],
  parse(rows) {
    return rows
      .filter(r => r['Status']?.toLowerCase() === 'filled')
      .map(r => ({
        external_trade_id: r['Order ID'] || r['id'] || crypto.randomUUID(),
        symbol: (r['Symbol'] || '').trim(),
        side: normalizeSide(r['Side']),
        quantity: parseNum(r['Qty'] || r['Filled Qty']),
        entry_price: parseNum(r['Price'] || r['Filled Avg Price']),
        exit_price: null,
        entry_time: parseDate(r['Filled At'] || r['Created At']),
        exit_time: null,
        commission: 0,
        swap: 0,
        profit: parseNum(r['Total'] || '0'),
        status: 'closed' as const,
        notes: r['Time in Force'] || '',
      }));
  },
};

// ─── Binance / Crypto Parser ───────────────────────────────────────────────

const binanceParser: BrokerFormat = {
  id: 'binance',
  name: 'Binance / Crypto',
  requiredHeaders: ['Pair', 'Side', 'Price', 'Amount'],
  parse(rows) {
    return rows.map(r => ({
      external_trade_id: r['Trade ID'] || r['Order ID'] || crypto.randomUUID(),
      symbol: (r['Pair'] || r['Symbol'] || '').trim(),
      side: normalizeSide(r['Side']),
      quantity: parseNum(r['Amount'] || r['Qty']),
      entry_price: parseNum(r['Price']),
      exit_price: null,
      entry_time: parseDate(r['Date'] || r['Time']),
      exit_time: null,
      commission: parseNum(r['Fee']),
      swap: 0,
      profit: parseNum(r['Realized Profit'] || r['Total']),
      status: 'closed' as const,
      notes: r['Fee Coin'] || '',
    }));
  },
};

// ─── NinjaTrader Parser ────────────────────────────────────────────────────

const ninjaParser: BrokerFormat = {
  id: 'ninjatrader',
  name: 'NinjaTrader',
  requiredHeaders: ['Instrument', 'Entry price', 'Exit price', 'Profit'],
  parse(rows) {
    return rows.map(r => ({
      external_trade_id: r['Trade #'] || crypto.randomUUID(),
      symbol: (r['Instrument'] || '').trim(),
      side: (r['Market pos.'] || '').toLowerCase().includes('long') ? 'buy' as const : 'sell' as const,
      quantity: parseNum(r['Quantity']),
      entry_price: parseNum(r['Entry price']),
      exit_price: parseNum(r['Exit price']) || null,
      entry_time: parseDate(r['Entry time']),
      exit_time: r['Exit time'] ? parseDate(r['Exit time']) : null,
      commission: parseNum(r['Commission']),
      swap: 0,
      profit: parseNum(r['Profit']),
      status: r['Exit price'] ? 'closed' as const : 'open' as const,
      notes: `MAE: ${r['MAE'] || '—'} | MFE: ${r['MFE'] || '—'}`,
    }));
  },
};

// ─── All parsers registry ──────────────────────────────────────────────────

export const BROKER_PARSERS: BrokerFormat[] = [
  mt4Parser, ctraderParser, oandaParser, alpacaParser, binanceParser, ninjaParser,
];

// ─── CSV text → rows ──────────────────────────────────────────────────────

export function csvToRows(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  const headers = parseCsvLine(firstLine, delimiter).map(h => h.trim());
  const rows = lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const vals = parseCsvLine(line, delimiter);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
      return obj;
    });

  return { headers, rows };
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Auto-detect broker format ─────────────────────────────────────────────

export function detectBrokerFormat(headers: string[]): BrokerFormat | null {
  const normalized = headers.map(h => h.trim().toLowerCase());

  let bestMatch: BrokerFormat | null = null;
  let bestScore = 0;

  for (const parser of BROKER_PARSERS) {
    const required = parser.requiredHeaders.map(h => h.toLowerCase());
    const matched = required.filter(rh =>
      normalized.some(nh => nh === rh || nh.includes(rh) || rh.includes(nh))
    );
    const score = matched.length / required.length;
    if (score > bestScore && score >= 0.6) {
      bestScore = score;
      bestMatch = parser;
    }
  }

  return bestMatch;
}

// ─── Full parse pipeline ──────────────────────────────────────────────────

export interface ParseResult {
  broker: BrokerFormat | null;
  trades: ParsedTrade[];
  headers: string[];
  rowCount: number;
  errors: string[];
}

export function parseCSV(text: string, forceBrokerId?: string): ParseResult {
  const { headers, rows } = csvToRows(text);
  const errors: string[] = [];

  if (headers.length === 0 || rows.length === 0) {
    return { broker: null, trades: [], headers, rowCount: 0, errors: ['Archivo vacío o sin datos'] };
  }

  let broker: BrokerFormat | null = null;
  if (forceBrokerId) {
    broker = BROKER_PARSERS.find(p => p.id === forceBrokerId) || null;
    if (!broker) errors.push(`Formato '${forceBrokerId}' no reconocido`);
  } else {
    broker = detectBrokerFormat(headers);
  }

  if (!broker) {
    return { broker: null, trades: [], headers, rowCount: rows.length, errors: ['Formato CSV no reconocido. Selecciona el broker manualmente.'] };
  }

  try {
    const trades = broker.parse(rows).filter(t => t.symbol);
    return { broker, trades, headers, rowCount: rows.length, errors };
  } catch (err) {
    errors.push(`Error al parsear: ${err instanceof Error ? err.message : 'desconocido'}`);
    return { broker, trades: [], headers, rowCount: rows.length, errors };
  }
}
