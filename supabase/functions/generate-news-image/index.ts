import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsId, title, category, sentiment } = await req.json();

    if (!newsId || !title) {
      return new Response(
        JSON.stringify({ success: false, error: 'newsId and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if image already exists in storage
    const fileName = `${newsId}.png`;
    const { data: existingFile } = await supabase.storage
      .from('news-images')
      .getPublicUrl(fileName);

    // Try to check if file actually exists
    const { data: fileList } = await supabase.storage
      .from('news-images')
      .list('', { search: newsId });

    if (fileList && fileList.length > 0) {
      const publicUrl = existingFile.publicUrl;
      return new Response(
        JSON.stringify({ success: true, imageUrl: publicUrl, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate image using Lovable AI
    const sentimentColor = sentiment === 'bullish' ? 'green and gold tones' : sentiment === 'bearish' ? 'red and dark tones' : 'blue and neutral tones';
    const categoryTheme = getCategoryTheme(category);

    const prompt = `Create a professional financial news article header image. Theme: ${categoryTheme}. Color mood: ${sentimentColor}. Topic: "${title}". Style: modern, clean, editorial financial news illustration with abstract geometric elements representing market data. No text in the image. 16:9 aspect ratio. Ultra high resolution.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract base64 data and upload to storage
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to upload image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('news-images')
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ success: true, imageUrl: publicUrlData.publicUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getCategoryTheme(category: string): string {
  const themes: Record<string, string> = {
    'interest_rates': 'central banking, interest rate charts, monetary policy',
    'inflation': 'price indices, consumer goods, inflation arrows',
    'employment': 'labor market, workforce statistics, employment data',
    'gdp': 'economic growth, GDP charts, national economy',
    'trade': 'international trade, import export, shipping',
    'monetary_policy': 'central bank, monetary tools, policy decisions',
    'geopolitical': 'world map, geopolitics, global tensions',
    'energy': 'oil barrels, energy markets, fuel prices',
    'housing': 'real estate, housing market, property',
    'retail': 'consumer spending, retail sales, shopping',
    'manufacturing': 'factories, industrial production, manufacturing',
    'technology': 'tech innovation, digital markets, fintech',
  };
  return themes[category] || 'financial markets, trading charts, global economy';
}
