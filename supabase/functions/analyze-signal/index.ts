import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    const { signal, mode, language } = await req.json() as { signal: SignalData; mode?: string; language?: string };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing signal:', signal.currencyPair, 'mode:', mode);

    const isJpy = signal.currencyPair.includes('JPY');
    const pipMultiplier = isJpy ? 100 : 10000;
    const tpPips = Math.abs((signal.takeProfit - signal.entryPrice) * pipMultiplier).toFixed(1);
    const slPips = Math.abs((signal.stopLoss - signal.entryPrice) * pipMultiplier).toFixed(1);
    const rrRatio = (parseFloat(tpPips) / parseFloat(slPips)).toFixed(2);

    // Strategy mode: return structured strategy data
    if (mode === 'strategy') {
      const langMap: Record<string, string> = {
        es: 'español', en: 'English', pt: 'português', fr: 'français'
      };
      const responseLang = langMap[language ?? 'es'] ?? 'español';

      const systemPrompt = `You are a professional forex trading analyst. Analyze the signal and return an optimal strategy using the provided tool. ALWAYS respond in ${responseLang}. Be concise in explanations (max 2 sentences per explanation field).

Criteria for your analysis:
- Duration: Evaluate if the trade is intraday, swing or scalping based on TP/SL distance and pair volatility.
- Approach: Determine the best methodology (Smart Money, Price Action, Classic Technical Analysis, etc).
- Session: Best session to execute (London, New York, Tokyo, Sydney or combinations).
- Best time: Optimal time range in HH:MM-HH:MM format (EST time).
- Confirmation candles: Most relevant candle pattern to confirm entry (Pin Bar, Engulfing, Doji, Morning Star, etc).
- Each field must have a brief explanation of WHY you recommend that option for THIS specific signal.`;

      const userPrompt = `Señal de trading:
Par: ${signal.currencyPair}
Acción: ${signal.action === 'BUY' ? 'COMPRAR' : 'VENDER'}
Tendencia: ${signal.trend === 'bullish' ? 'Alcista' : 'Bajista'}
Precio de Entrada: ${signal.entryPrice}
Take Profit: ${signal.takeProfit} (${tpPips} pips)
Stop Loss: ${signal.stopLoss} (${slPips} pips)
Ratio R:R: ${rrRatio}
Probabilidad: ${signal.probability}%
${signal.support ? `Soporte: ${signal.support}` : ''}
${signal.resistance ? `Resistencia: ${signal.resistance}` : ''}

Analiza y devuelve la estrategia óptima.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "set_strategy",
              description: "Set the optimal trading strategy for this signal",
              parameters: {
                type: "object",
                properties: {
                  duration: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "e.g. Intradía, Swing, Scalping" },
                      explanation: { type: "string", description: "Brief explanation why this duration" }
                    },
                    required: ["value", "explanation"]
                  },
                  approach: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "e.g. Smart Money, Price Action, Técnico Clásico" },
                      explanation: { type: "string", description: "Brief explanation why this approach" }
                    },
                    required: ["value", "explanation"]
                  },
                  session: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "e.g. New York, London, Tokyo" },
                      explanation: { type: "string", description: "Brief explanation why this session" }
                    },
                    required: ["value", "explanation"]
                  },
                  bestTime: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "Time range e.g. 10:00 – 14:00" },
                      explanation: { type: "string", description: "Brief explanation why this time" }
                    },
                    required: ["value", "explanation"]
                  },
                  confirmationCandle: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "e.g. Pin Bar, Engulfing, Doji, Morning Star" },
                      explanation: { type: "string", description: "Brief explanation of this pattern and why it applies" }
                    },
                    required: ["value", "explanation"]
                  }
                },
                required: ["duration", "approach", "session", "bestTime", "confirmationCandle"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "set_strategy" } },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      
      if (!toolCall?.function?.arguments) {
        throw new Error('No strategy generated');
      }

      const strategy = JSON.parse(toolCall.function.arguments);
      console.log('Strategy generated:', JSON.stringify(strategy));

      return new Response(JSON.stringify({
        strategy,
        generatedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langMapDefault: Record<string, string> = {
      es: 'español', en: 'English', pt: 'português', fr: 'français'
    };
    const defaultLang = langMapDefault[language ?? 'es'] ?? 'español';

    const systemPrompt = `You are a professional forex trading analyst. Analyze the provided trading signal and generate a detailed analysis in ${defaultLang}.

Your analysis must include:
1. **Executive Summary**: A quick evaluation of the signal (2-3 sentences)
2. **Technical Analysis**: Evaluation of entry, take profit and stop loss levels
3. **Risk/Reward Ratio**: Calculation and evaluation of R:R
4. **Risk Factors**: Main risks to consider
5. **Recommendation**: Your final recommendation (Execute/Wait/Avoid)
6. **Confidence Level**: Confidence percentage in the signal

Be concise but informative. Use emojis to make the analysis more visual.`;

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
        model: 'google/gemini-3-flash-preview',
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
        return new Response(JSON.stringify({ error: 'Límite de solicitudes excedido.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA agotados.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('No analysis generated');
    }

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
