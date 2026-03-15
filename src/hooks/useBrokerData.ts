import { useState, useEffect, useCallback, useRef } from 'react';

export interface NormalizedBroker {
  id: string;
  name: string;
  type: string;
  country: string;
  countryFlag: string;
  section: string;
  region: string;
  rating: number;
  depositMin: string;
  commission: string;
  spreads: string;
  leverage: string;
  regulations: string[];
  instruments: string[];
  platform: string[];
  central: string;
  description: string;
  pros: string[];
  cons: string[];
  instrumentTypes: { name: string; desc: string }[];
  platforms: { name: string; desc: string }[];
  accountTypes: { name: string; desc: string }[];
  allRegulations: { name: string; desc: string }[];
  mainRegion: string;
  operatingCountries: string;
  founded?: number;
}

export const BROKER_REGIONS = [
  { key: 'intl', label: '🌎 Internacional', file: 'internacionales_latam.json' },
  { key: 'eu', label: '🇪🇺 Europa', file: 'europa.json' },
  { key: 'us', label: '🇺🇸 USA/CA', file: 'usa_canada.json' },
  { key: 'mx', label: '🇲🇽 México', file: 'mexico.json' },
  { key: 'co', label: '🇨🇴 Colombia', file: 'colombia.json' },
  { key: 'ar', label: '🇦🇷 Argentina', file: 'argentina.json' },
  { key: 'br', label: '🇧🇷 Brasil', file: 'brasil.json' },
  { key: 'cl', label: '🇨🇱 Chile', file: 'chile.json' },
  { key: 'pe', label: '🇵🇪 Perú', file: 'peru.json' },
  { key: 'ec', label: '🇪🇨 Ecuador', file: 'ecuador.json' },
  { key: 'cr', label: '🇨🇷 Costa Rica', file: 'costarica.json' },
  { key: 'pa', label: '🇵🇦 Panamá', file: 'panama.json' },
  { key: 'sv', label: '🇸🇻 El Salvador', file: 'elsalvador.json' },
  { key: 'ni', label: '🇳🇮 Nicaragua', file: 'nicaragua.json' },
  { key: 've', label: '🇻🇪 Venezuela', file: 'venezuela.json' },
  { key: 'uy', label: '🇺🇾 Uruguay', file: 'uruguay.json' },
];

const FLAG_MAP: Record<string, string> = {
  argentina: '🇦🇷', brasil: '🇧🇷', colombia: '🇨🇴', chile: '🇨🇱',
  'costa rica': '🇨🇷', ecuador: '🇪🇨', 'el salvador': '🇸🇻',
  méxico: '🇲🇽', mexico: '🇲🇽', nicaragua: '🇳🇮', panamá: '🇵🇦',
  panama: '🇵🇦', perú: '🇵🇪', peru: '🇵🇪', uruguay: '🇺🇾',
  venezuela: '🇻🇪', usa: '🇺🇸', 'estados unidos': '🇺🇸',
  canadá: '🇨🇦', canada: '🇨🇦', australia: '🇦🇺',
  alemania: '🇩🇪', españa: '🇪🇸', francia: '🇫🇷',
  'reino unido': '🇬🇧', uk: '🇬🇧', irlanda: '🇮🇪',
  chipre: '🇨🇾', dinamarca: '🇩🇰', suiza: '🇨🇭',
  'países bajos': '🇳🇱', italia: '🇮🇹', portugal: '🇵🇹',
  israel: '🇮🇱', japón: '🇯🇵',
};

function getFlag(country: string): string {
  const lower = country.toLowerCase();
  for (const [key, flag] of Object.entries(FLAG_MAP)) {
    if (lower.includes(key)) return flag;
  }
  return '🌐';
}

function extractInstrumentNames(instrumentos: any): string[] {
  if (!instrumentos) return [];
  const names: string[] = [];
  const keyMap: Record<string, string> = {
    forex: 'Forex', acciones: 'Acciones', acoes: 'Acciones',
    indices: 'Índices', criptomonedas: 'Crypto', cripto: 'Crypto',
    materias_primas: 'Materias Primas', commodities: 'Materias Primas',
    etfs: 'ETFs', etfs_bdrs: 'ETFs/BDRs', opciones: 'Opciones',
    bonos: 'Bonos', renta_fija: 'Renta Fija', fondos: 'Fondos',
    futuros: 'Futuros', cfd_acciones: 'CFD Acciones',
    acciones_cfd: 'CFD Acciones', derivativos: 'Derivados',
  };
  for (const [key, val] of Object.entries(instrumentos)) {
    if (val && val !== 'No' && val !== 'No directo' && val !== false) {
      const mapped = keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
      if (!names.includes(mapped)) names.push(mapped);
    }
  }
  return names.slice(0, 6);
}

function extractInstrumentTypes(instrumentos: any): { name: string; desc: string }[] {
  if (!instrumentos) return [];
  const types: { name: string; desc: string }[] = [];
  for (const [key, val] of Object.entries(instrumentos)) {
    if (!val || val === 'No' || val === 'No directo' || val === false) continue;
    const name = key.replace(/_/g, ' ').toUpperCase();
    let desc = '';
    if (typeof val === 'string') desc = val;
    else if (typeof val === 'object' && val !== null) {
      const obj = val as any;
      if (obj.cantidad) desc = obj.cantidad;
      else if (obj.pares) desc = obj.pares;
      else if (obj.incluye) desc = Array.isArray(obj.incluye) ? obj.incluye.join(', ') : obj.incluye;
      else desc = obj.disponible ? 'Disponible' : '';
    } else if (val === true) desc = 'Disponible';
    types.push({ name, desc });
  }
  return types.slice(0, 8);
}

function extractPlatforms(plataformas: any): { name: string; desc: string }[] {
  if (!plataformas || !Array.isArray(plataformas)) return [];
  return plataformas.map((p: any) => {
    if (typeof p === 'string') return { name: p, desc: '' };
    return { name: p.name || p.nombre || p.nome || '', desc: p.description || p.desc || p.descripcion || '' };
  });
}

function extractAccountTypes(cuentas: any): { name: string; desc: string }[] {
  if (!cuentas || !Array.isArray(cuentas)) return [];
  return cuentas.map((c: any) => {
    const name = c.nombre || c.nome || c.name || '';
    const parts: string[] = [];
    if (c.min) parts.push(`Min: ${c.min}`);
    if (c.minimo !== undefined) parts.push(`Min: ${typeof c.minimo === 'number' ? `$${c.minimo}` : c.minimo}`);
    if (c.deposito_min) parts.push(`Min: ${c.deposito_min}`);
    if (c.deposito_minimo_usd !== undefined) parts.push(`Min: $${c.deposito_minimo_usd}`);
    if (c.tarifa) parts.push(c.tarifa);
    if (c.taxas) parts.push(c.taxas);
    if (c.tipo) parts.push(c.tipo);
    if (c.spread) parts.push(`Spread: ${c.spread}`);
    if (c.comision) parts.push(`Com: ${c.comision}`);
    if (c.modelo) parts.push(c.modelo);
    if (c.para_quien) parts.push(c.para_quien);
    return { name, desc: parts.join(' · ') };
  });
}

function extractRegulations(reg: any): { list: string[]; detailed: { name: string; desc: string }[] } {
  if (!reg) return { list: [], detailed: [] };
  
  if (Array.isArray(reg)) {
    const list = reg.map((r: any) => typeof r === 'string' ? r : r.name || '');
    const detailed = reg.map((r: any) => {
      if (typeof r === 'string') {
        const parts = r.split(' (');
        return { name: parts[0].trim(), desc: parts.length > 1 ? parts[1].replace(')', '') : r };
      }
      return { name: r.name || '', desc: r.desc || r.description || '' };
    });
    return { list, detailed };
  }
  
  // Object format (international LATAM)
  if (typeof reg === 'object' && reg.principal) {
    const list = Array.isArray(reg.principal) ? reg.principal : [reg.principal];
    const detailed = list.map((r: string) => {
      const parts = r.split(' (');
      return { name: parts[0].trim(), desc: parts.length > 1 ? parts[1].replace(')', '') : r };
    });
    return { list: list.map((r: string) => r.split(' (')[0].trim()), detailed };
  }
  
  return { list: [], detailed: [] };
}

function normalizeEntity(entity: any, regionKey: string, metadata?: any): NormalizedBroker {
  const name = entity.nombre || entity.nome || entity.name || '';
  const country = entity.pais || entity.pais_origen || metadata?.pais || '';
  const flag = metadata?.bandera || getFlag(country);
  
  // Rating: all sources use 1-10 scale, convert to 1-5
  const rawRating = entity.calificacion || entity.score || entity.score_latam || 0;
  const rating = Math.round((rawRating / 2) * 10) / 10;
  
  // Deposit
  const dep = entity.deposito_minimo;
  let depositMin = '0 $';
  if (dep) {
    const currency = dep.moneda || dep.moeda || 'USD';
    depositMin = `${dep.valor} ${currency}`;
  }
  
  // Commission & spreads
  let commission = entity.comision || entity.comissao || entity.comision_por_lote || '0';
  if (typeof commission === 'string' && commission.includes('USD')) {
    commission = commission.replace('USD ', '$');
  }
  let spreads = entity.spread_eurusd || entity.spread_ref || entity.spreads || entity.modelo_costos || entity.modelo_custos || '';
  if (typeof spreads === 'string' && spreads.length > 30) spreads = spreads.substring(0, 30) + '...';
  
  // Leverage
  let leverage = '';
  if (entity.apalancamiento || entity.alavancagem) {
    const alev = entity.apalancamiento || entity.alavancagem;
    if (typeof alev === 'string') leverage = alev;
    else leverage = alev.max || alev.maximo || alev.forex_max || 'N/A';
  }
  
  // Regulations
  const regData = extractRegulations(entity.regulacion || entity.regulacao);
  
  // Instruments
  const instrumentos = entity.instrumentos;
  const instrumentNames = extractInstrumentNames(instrumentos);
  const instrumentTypes = extractInstrumentTypes(instrumentos);
  
  // Platforms
  const rawPlatforms = entity.plataformas || entity.platforms || [];
  const platformNames = rawPlatforms.map((p: any) => typeof p === 'string' ? p : (p.name || p.nombre || p.nome || '')).filter(Boolean);
  const platforms = extractPlatforms(rawPlatforms);
  
  // Account types
  const accountTypes = extractAccountTypes(entity.tipos_cuenta || entity.tipos_conta || entity.cuentas || entity.tipos_conta || []);
  
  // Pros/Cons
  const pros = entity.pros || [];
  const cons = entity.contras || entity.cons || [];
  
  // Description
  const description = entity.description || entity.descripcion || entity.nota || entity.caracteristica_unica || entity.presencia || entity.presenca || '';
  
  // Region/Central
  const region = entity.region || entity.regiao || entity.region_operacion || country;
  const central = entity.sede || entity.central || entity.pais_sede || country;
  
  return {
    id: entity.id || `${regionKey}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    type: entity.tipo || '',
    country,
    countryFlag: flag,
    section: entity.seccion || '',
    region,
    rating,
    depositMin,
    commission: typeof commission === 'number' ? String(commission) : commission,
    spreads: typeof spreads === 'number' ? String(spreads) : spreads,
    leverage,
    regulations: regData.list,
    instruments: instrumentNames,
    platform: platformNames.slice(0, 4),
    central,
    description,
    pros,
    cons,
    instrumentTypes,
    platforms,
    accountTypes,
    allRegulations: regData.detailed,
    mainRegion: entity.presencia || entity.presenca || entity.paises_latam_aceptados || central,
    operatingCountries: entity.region || entity.regiao || entity.region_operacion || country,
    founded: entity.fundacion || entity.fundacao || undefined,
  };
}

function normalizeJsonData(data: any, regionKey: string): NormalizedBroker[] {
  const entities = data.entidades || data.brokers || [];
  const metadata = data.metadata || {};
  return entities.map((entity: any) => normalizeEntity(entity, regionKey, metadata));
}

const cache = new Map<string, NormalizedBroker[]>();

export function useBrokerData(regionKey: string) {
  const [brokers, setBrokers] = useState<NormalizedBroker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadRegion = useCallback(async (key: string) => {
    const region = BROKER_REGIONS.find(r => r.key === key);
    if (!region) return;

    if (cache.has(key)) {
      setBrokers(cache.get(key)!);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/data/brokers/${region.file}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Failed to load ${region.file}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) throw new Error(`Invalid response for ${region.file}`);
      const data = await res.json();
      const normalized = normalizeJsonData(data, key);
      cache.set(key, normalized);
      if (!controller.signal.aborted) {
        setBrokers(normalized);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setBrokers([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadRegion(regionKey);
    return () => { abortRef.current?.abort(); };
  }, [regionKey, loadRegion]);

  return { brokers, loading, error };
}

/** Search across ALL regions at once. Only triggers when query is non-empty. */
export function useGlobalBrokerSearch(query: string) {
  const [results, setResults] = useState<(NormalizedBroker & { regionLabel: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const searchedRef = useRef(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      searchedRef.current = false;
      return;
    }

    let cancelled = false;
    const doSearch = async () => {
      setLoading(true);

      // Load all regions in parallel (uses cache when available)
      const promises = BROKER_REGIONS.map(async (region) => {
        if (cache.has(region.key)) return { brokers: cache.get(region.key)!, label: region.label };
        try {
          const res = await fetch(`/data/brokers/${region.file}`);
          if (!res.ok) return { brokers: [], label: region.label };
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) return { brokers: [], label: region.label };
          const data = await res.json();
          const normalized = normalizeJsonData(data, region.key);
          cache.set(region.key, normalized);
          return { brokers: normalized, label: region.label };
        } catch {
          return { brokers: [], label: region.label };
        }
      });

      const allRegions = await Promise.all(promises);
      if (cancelled) return;

      const lower = query.toLowerCase();
      const matched: (NormalizedBroker & { regionLabel: string })[] = [];
      const seen = new Set<string>();

      for (const { brokers, label } of allRegions) {
        for (const b of brokers) {
          if (seen.has(b.name.toLowerCase())) continue;
          if (
            b.name.toLowerCase().includes(lower) ||
            b.central.toLowerCase().includes(lower) ||
            b.regulations.some(r => r.toLowerCase().includes(lower)) ||
            b.instruments.some(i => i.toLowerCase().includes(lower))
          ) {
            seen.add(b.name.toLowerCase());
            matched.push({ ...b, regionLabel: label });
          }
        }
      }

      matched.sort((a, b) => b.rating - a.rating);
      setResults(matched);
      searchedRef.current = true;
      setLoading(false);
    };

    const timer = setTimeout(doSearch, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  return { results, loading, searched: searchedRef.current };
}

/** Preload broker counts for all regions (lazy, fires once). */
export function useRegionCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const results: Record<string, number> = {};
      await Promise.all(
        BROKER_REGIONS.map(async (region) => {
          if (cache.has(region.key)) {
            results[region.key] = cache.get(region.key)!.length;
            return;
          }
          try {
            const res = await fetch(`/data/brokers/${region.file}`);
            if (!res.ok) { results[region.key] = 0; return; }
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) { results[region.key] = 0; return; }
            const data = await res.json();
            const normalized = normalizeJsonData(data, region.key);
            cache.set(region.key, normalized);
            results[region.key] = normalized.length;
          } catch {
            results[region.key] = 0;
          }
        })
      );
      if (!cancelled) setCounts(results);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return counts;
}
