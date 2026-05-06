import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a precious metals price data provider. Return ONLY valid JSON with current approximate Indian market prices for Gold 24K, Gold 22K, Silver, and Platinum in INR per gram. Include a realistic daily change percentage. Format:
{"prices":[{"name":"Gold 24K","price":7250,"change":0.45},{"name":"Gold 22K","price":6640,"change":0.42},{"name":"Silver","price":85.50,"change":-0.23},{"name":"Platinum","price":3120,"change":0.18}]}
Use realistic current market prices for India in March 2026. Only return the JSON, nothing else.`
          },
          {
            role: 'user',
            content: 'Give me current live precious metal prices in India (INR per gram) for Gold 24K, Gold 22K, Silver, and Platinum with daily change percentage.'
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse metal prices from AI response');
    }
    
    const prices = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({
      success: true,
      ...prices,
      updated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching metal prices:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      // Fallback prices
      prices: [
        { name: "Gold 24K", price: 7250, change: 0.45 },
        { name: "Gold 22K", price: 6640, change: 0.42 },
        { name: "Silver", price: 85.50, change: -0.23 },
        { name: "Platinum", price: 3120, change: 0.18 },
      ],
      updated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
