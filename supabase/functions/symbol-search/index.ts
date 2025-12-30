import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWELVE_DATA_API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');

interface SymbolResult {
  symbol: string;
  instrument_name: string;
  exchange: string;
  mic_code: string;
  exchange_timezone: string;
  instrument_type: string;
  country: string;
  currency: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = 'all' } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(JSON.stringify({
        data: [],
        status: 'ok',
        message: 'Query must be at least 2 characters'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!TWELVE_DATA_API_KEY) {
      console.error('TWELVE_DATA_API_KEY not configured');
      throw new Error('API key not configured');
    }

    const trimmedQuery = query.trim();
    
    // Build the URL based on type filter
    let outputType = '';
    if (type === 'forex') {
      outputType = '&outputtype=forex';
    } else if (type === 'crypto') {
      outputType = '&outputtype=cryptocurrency';
    }

    const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(trimmedQuery)}${outputType}&apikey=${TWELVE_DATA_API_KEY}`;

    console.log('Searching symbols for:', trimmedQuery, 'type:', type);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'error') {
      console.error('Twelve Data API error:', data.message);
      throw new Error(data.message || 'Error searching symbols');
    }

    // Filter and format results - focus on Forex and Crypto
    const results: SymbolResult[] = (data.data || [])
      .filter((item: SymbolResult) => {
        const instrumentType = item.instrument_type?.toLowerCase() || '';
        if (type === 'forex') {
          return instrumentType === 'forex' || instrumentType === 'currency';
        }
        if (type === 'crypto') {
          return instrumentType === 'cryptocurrency' || instrumentType === 'digital currency';
        }
        // For 'all', show forex and crypto primarily
        return ['forex', 'currency', 'cryptocurrency', 'digital currency'].includes(instrumentType);
      })
      .slice(0, 20) // Limit to 20 results
      .map((item: SymbolResult) => ({
        symbol: item.symbol,
        name: item.instrument_name,
        exchange: item.exchange,
        type: item.instrument_type,
        country: item.country,
        currency: item.currency
      }));

    console.log(`Found ${results.length} symbols for query: ${trimmedQuery}`);

    return new Response(JSON.stringify({
      data: results,
      status: 'ok'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in symbol-search function:', errorMessage);
    return new Response(JSON.stringify({
      error: errorMessage,
      status: 'error',
      data: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
