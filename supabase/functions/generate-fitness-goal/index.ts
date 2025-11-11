import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goalDescription, fitnessLevel, daysPerWeek, userName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an energetic, motivational fitness coach for GetFitSuperHit 💥. 
Your role is to transform vague fitness goals into SMART (Specific, Measurable, Achievable, Relevant, Time-bound) action plans.

Fitness Level Guidelines:
- Beginner: Gentle encouragement, focus on small wins, build confidence
- Intermediate: Steady improvement, balanced challenges
- Advanced: Push boundaries, performance-oriented, ambitious targets

Always respond with exactly 3 goal suggestions in JSON format using this structure:
{
  "suggestions": [
    {
      "title": "Catchy goal title with emoji",
      "activity": "activity name (lowercase, simple)",
      "target_value": number,
      "unit": "unit (lowercase)",
      "deadline_days": number,
      "frequency": "X days/week",
      "motivation": "Short motivational line with emoji"
    }
  ],
  "summary": "Personalized encouragement using the user's name"
}

Make goals realistic for the given fitness level and frequency. Use emojis 💪 🌟 🔥 ✨ throughout.`;

    const userPrompt = `Goal: "${goalDescription}"
Fitness Level: ${fitnessLevel}
Available: ${daysPerWeek} days/week
User Name: ${userName || "Friend"}

Generate 3 SMART fitness goal suggestions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Strip markdown code blocks if present
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    const parsedContent = JSON.parse(content);

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-fitness-goal function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
