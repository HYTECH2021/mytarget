import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  conversationId: string;
  userRole: "buyer" | "seller";
  lastMessages?: any[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Non autorizzato" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { conversationId, userRole }: RequestBody = await req.json();

    const { data: conversation } = await supabaseClient
      .from("conversations")
      .select(`
        *,
        request:targets(*),
        buyer:buyer_id(full_name, email),
        seller:seller_id(full_name, email)
      `)
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: "Conversazione non trovata" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: messages } = await supabaseClient
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10);

    const suggestions = generateSmartSuggestions(
      userRole,
      conversation,
      messages || []
    );

    return new Response(
      JSON.stringify({ suggestions }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateSmartSuggestions(
  userRole: "buyer" | "seller",
  conversation: any,
  messages: any[]
) {
  const messageCount = messages.length;
  const lastMessage = messages[0];
  const targetDetails = conversation.request;

  const suggestions: Array<{
    type: string;
    text: string;
    priority: number;
    action?: string;
  }> = [];

  if (userRole === "seller") {
    if (messageCount === 0) {
      suggestions.push({
        type: "greeting",
        text: `Salve, sono interessato al suo target "${targetDetails?.title}". Vorrei discutere dei dettagli con lei.`,
        priority: 1,
      });
      suggestions.push({
        type: "introduction",
        text: `Buongiorno! Ho esperienza nel settore ${targetDetails?.category} e credo di poter soddisfare la sua richiesta. Possiamo parlarne?`,
        priority: 2,
      });
    }

    if (messageCount > 0 && messageCount < 3) {
      suggestions.push({
        type: "details",
        text: "Posso fornirle maggiori dettagli sulla mia offerta. Quali aspetti le interessano di più?",
        priority: 1,
      });
      suggestions.push({
        type: "price",
        text: `Per questo tipo di servizio, il mio prezzo è competitivo. Budget indicato: €${targetDetails?.budget}. Possiamo discuterne?`,
        priority: 2,
      });
    }

    if (messageCount >= 3) {
      suggestions.push({
        type: "closing",
        text: "Sono pronto a procedere. Come preferisce finalizzare?",
        priority: 1,
        action: "prepare_contract",
      });
      suggestions.push({
        type: "availability",
        text: "Posso iniziare già dalla prossima settimana. Le va bene?",
        priority: 2,
      });
    }

    if (lastMessage && lastMessage.content.toLowerCase().includes("prezzo")) {
      suggestions.push({
        type: "negotiation",
        text: "Posso offrire uno sconto del 10% se conferma entro questa settimana.",
        priority: 1,
      });
    }
  }

  if (userRole === "buyer") {
    if (messageCount === 0) {
      suggestions.push({
        type: "greeting",
        text: "Grazie per l'interesse nel mio target. Ha esperienza in questo settore?",
        priority: 1,
      });
      suggestions.push({
        type: "question",
        text: "Può dirmi di più sulla sua proposta e sui tempi di realizzazione?",
        priority: 2,
      });
    }

    if (messageCount > 0 && messageCount < 3) {
      suggestions.push({
        type: "clarification",
        text: "Interessante! Può fornirmi alcuni riferimenti o esempi di lavori simili?",
        priority: 1,
      });
      suggestions.push({
        type: "budget",
        text: "Il budget indicato è confermato. Cosa include esattamente la sua offerta?",
        priority: 2,
      });
    }

    if (messageCount >= 3) {
      suggestions.push({
        type: "acceptance",
        text: "La sua proposta mi convince. Procediamo?",
        priority: 1,
        action: "accept_offer",
      });
      suggestions.push({
        type: "contract",
        text: "D'accordo. Possiamo formalizzare l'accordo?",
        priority: 2,
        action: "request_contract",
      });
    }

    if (lastMessage && lastMessage.content.toLowerCase().includes("sconto")) {
      suggestions.push({
        type: "negotiation",
        text: "Apprezzo l'offerta. Possiamo discutere anche delle tempistiche?",
        priority: 1,
      });
    }
  }

  suggestions.push({
    type: "polite",
    text: "Grazie per il messaggio. Ci penso e le faccio sapere a breve.",
    priority: 3,
  });

  suggestions.push({
    type: "question",
    text: "Ha altre domande per me?",
    priority: 4,
  });

  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 4);
}
