import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('[cleanup-news-ai-cache] Starting cleanup...');

    // Get count of expired entries before deletion
    const { count: expiredCount } = await supabase
      .from('news_ai_analysis_cache')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString());

    console.log('[cleanup-news-ai-cache] Found', expiredCount || 0, 'expired entries');

    // Delete expired cache entries
    const { error: deleteError } = await supabase
      .from('news_ai_analysis_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (deleteError) {
      console.error('[cleanup-news-ai-cache] Delete error:', deleteError);
      throw deleteError;
    }

    // Get total remaining entries
    const { count: remainingCount } = await supabase
      .from('news_ai_analysis_cache')
      .select('*', { count: 'exact', head: true });

    const result = {
      success: true,
      deleted: expiredCount || 0,
      remaining: remainingCount || 0,
      timestamp: new Date().toISOString(),
    };

    console.log('[cleanup-news-ai-cache] Cleanup complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cleanup-news-ai-cache] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
