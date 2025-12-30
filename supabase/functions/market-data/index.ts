import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWELVE_DATA_API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');

interface TimeSeriesData {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

interface IndicatorData {
  datetime: string;
  [key: string]: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { symbol, interval = '4h', indicator, outputsize = 50 } = body;
    
    // Validate required parameters
    if (!symbol || typeof symbol !== 'string') {
      console.error('Invalid or missing symbol:', symbol);
      return new Response(JSON.stringify({
        error: 'Symbol parameter is required',
        status: 'error'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Format symbol for Twelve Data (remove / and trim)
    const formattedSymbol = symbol.replace('/', '').trim().toUpperCase();
    
    if (!formattedSymbol) {
      console.error('Empty symbol after formatting');
      return new Response(JSON.stringify({
        error: 'Invalid symbol format',
        status: 'error'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Fetching data for ${formattedSymbol} with interval ${interval}, indicator: ${indicator || 'price'}`);
    
    if (!TWELVE_DATA_API_KEY) {
      console.error('TWELVE_DATA_API_KEY not configured');
      throw new Error('API key not configured');
    }

    const baseUrl = 'https://api.twelvedata.com';
    let url: string;
    const size = outputsize;
    
    if (indicator === 'rsi') {
      url = `${baseUrl}/rsi?symbol=${formattedSymbol}&interval=${interval}&time_period=14&outputsize=${size}&apikey=${TWELVE_DATA_API_KEY}`;
    } else if (indicator === 'macd') {
      url = `${baseUrl}/macd?symbol=${formattedSymbol}&interval=${interval}&outputsize=${size}&apikey=${TWELVE_DATA_API_KEY}`;
    } else if (indicator === 'sma') {
      // Fetch multiple SMAs
      const sma20Url = `${baseUrl}/sma?symbol=${formattedSymbol}&interval=${interval}&time_period=20&outputsize=${size}&apikey=${TWELVE_DATA_API_KEY}`;
      const sma50Url = `${baseUrl}/sma?symbol=${formattedSymbol}&interval=${interval}&time_period=50&outputsize=${size}&apikey=${TWELVE_DATA_API_KEY}`;
      
      console.log('Fetching SMA 20 and SMA 50...');
      
      const [sma20Response, sma50Response] = await Promise.all([
        fetch(sma20Url),
        fetch(sma50Url)
      ]);
      
      const sma20Data = await sma20Response.json();
      const sma50Data = await sma50Response.json();
      
      console.log('SMA 20 response status:', sma20Data.status);
      console.log('SMA 50 response status:', sma50Data.status);
      
      if (sma20Data.status === 'error' || sma50Data.status === 'error') {
        throw new Error(sma20Data.message || sma50Data.message || 'Error fetching SMA data');
      }
      
      return new Response(JSON.stringify({
        sma20: sma20Data.values || [],
        sma50: sma50Data.values || [],
        symbol: formattedSymbol
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Default: fetch time series (price data)
      url = `${baseUrl}/time_series?symbol=${formattedSymbol}&interval=${interval}&outputsize=${size}&apikey=${TWELVE_DATA_API_KEY}`;
    }
    
    console.log('Fetching from URL:', url.replace(TWELVE_DATA_API_KEY!, '***'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response status:', data.status);
    
    if (data.status === 'error') {
      console.error('Twelve Data API error:', data.message);
      throw new Error(data.message || 'Error fetching market data');
    }
    
    return new Response(JSON.stringify({
      ...data,
      symbol: formattedSymbol
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in market-data function:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});