import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(endpoint: string, symbol: string, date?: string): string {
  return `${endpoint}:${symbol}${date ? `:${date}` : ''}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache HIT for: ${key}`);
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
    console.log(`Cache EXPIRED for: ${key}`);
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`Cache SET for: ${key}`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FASTAPI_BASE_URL = Deno.env.get('FASTAPI_BASE_URL');
    
    if (!FASTAPI_BASE_URL) {
      console.error('FASTAPI_BASE_URL environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Backend URL not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body = await req.json();
    const { endpoint, symbol, date, currentPrice } = body;

    if (!endpoint || !symbol) {
      console.error('Missing required parameters: endpoint or symbol');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: endpoint and symbol' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Analysis proxy request: endpoint=${endpoint}, symbol=${symbol}, date=${date || 'N/A'}`);

    // Build the API path based on endpoint type
    let apiPath: string;
    switch (endpoint) {
      case 'fullAnalysis':
        apiPath = `/api/v1/analysis/full/${encodeURIComponent(symbol)}`;
        break;
      case 'sentiment':
        apiPath = `/api/v1/analysis/sentiment/${encodeURIComponent(symbol)}`;
        break;
      case 'prediction':
        apiPath = `/api/v1/analysis/prediction/${encodeURIComponent(symbol)}`;
        break;
      case 'technicalLevels':
        apiPath = `/api/v1/analysis/technical-levels/${encodeURIComponent(symbol)}`;
        break;
      case 'previousDay':
        apiPath = `/api/v1/analysis/previous-day/${encodeURIComponent(symbol)}`;
        break;
      case 'recommendations':
        apiPath = `/api/v1/analysis/recommendations/${encodeURIComponent(symbol)}`;
        break;
      case 'conclusions':
        apiPath = `/api/v1/analysis/conclusions/${encodeURIComponent(symbol)}`;
        break;
      case 'monetaryPolicies':
        apiPath = `/api/v1/analysis/monetary-policies/${encodeURIComponent(symbol)}`;
        break;
      case 'majorNews':
        apiPath = `/api/v1/analysis/major-news/${encodeURIComponent(symbol)}`;
        break;
      case 'relevantNews':
        apiPath = `/api/v1/analysis/relevant-news/${encodeURIComponent(symbol)}`;
        break;
      case 'economicEvents':
        if (!date) {
          return new Response(
            JSON.stringify({ error: 'Date is required for economicEvents endpoint' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        apiPath = `/api/v1/analysis/economic-events/${encodeURIComponent(symbol)}/${date}`;
        break;
      default:
        console.error(`Unknown endpoint: ${endpoint}`);
        return new Response(
          JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    // Check cache first
    const cacheKey = getCacheKey(endpoint, symbol, date);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return new Response(
        JSON.stringify({ ...cachedData, cached: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Make request to FastAPI backend
    const url = `${FASTAPI_BASE_URL}${apiPath}`;
    console.log(`Fetching from FastAPI: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FastAPI error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `Backend error: ${response.status}`,
          details: errorText 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log(`FastAPI response received for ${endpoint}`);

    // Cache the response
    setCache(cacheKey, data);

    return new Response(
      JSON.stringify({ ...data, cached: false }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analysis-proxy function:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Internal server error';
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Unable to connect to backend. Please check if the API is running.';
    } else if (error instanceof SyntaxError) {
      errorMessage = 'Invalid response from backend';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
