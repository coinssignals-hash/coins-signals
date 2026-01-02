import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignalData {
  currencyPair: string;
  action: string;
  trend: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  probability: number;
  support?: number;
  resistance?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signal } = await req.json() as { signal: SignalData };
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing signal:', signal.currencyPair);

    const systemPrompt = `Eres un analista de trading forex profesional. Analiza la señal de trading proporcionada y genera un análisis detallado en español.

Tu análisis debe incluir:
1. **Resumen Ejecutivo**: Una evaluación rápida de la señal (2-3 oraciones)
2. **Análisis Técnico**: Evaluación de los niveles de entrada, take profit y stop loss
3. **Ratio Riesgo/Beneficio**: Cálculo y evaluación del R:R
4. **Factores de Riesgo**: Principales riesgos a considerar
5. **Recomendación**: Tu recomendación final (Ejecutar/Esperar/Evitar)
6. **Nivel de Confianza**: Porcentaje de confianza en la señal

Sé conciso pero informativo. Usa emojis para hacer el análisis más visual.`;

    const userPrompt = `Analiza esta señal de trading:

Par: ${signal.currencyPair}
Acción: ${signal.action === 'BUY' ? 'COMPRAR' : 'VENDER'}
Tendencia: ${signal.trend === 'bullish' ? 'Alcista' : 'Bajista'}
Precio de Entrada: ${signal.entryPrice}
Take Profit: ${signal.takeProfit}
Stop Loss: ${signal.stopLoss}
Probabilidad: ${signal.probability}%
${signal.support ? `Soporte: ${signal.support}` : ''}
${signal.resistance ? `Resistencia: ${signal.resistance}` : ''}

Genera un análisis profesional y detallado.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Límite de solicitudes excedido. Intenta de nuevo en unos momentos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos de IA agotados. Por favor, recarga tu cuenta.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('No analysis generated');
    }

    console.log('Analysis generated successfully');

    return new Response(JSON.stringify({ 
      analysis,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-signal:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
