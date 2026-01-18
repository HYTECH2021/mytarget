import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  conversationId: string;
  message: string;
  context?: any;
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

    const { conversationId, message, context }: RequestBody = await req.json();

    const { data: conversation } = await supabaseClient
      .from("support_conversations")
      .select("*")
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

    const { data: previousMessages } = await supabaseClient
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    const aiResponse = await generateAIResponse(message, previousMessages || [], conversation);

    const { data: newMessage, error: insertError } = await supabaseClient
      .from("support_messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "ai_assistant",
        sender_id: null,
        content: aiResponse.content,
        metadata: {
          confidence: aiResponse.confidence,
          intent: aiResponse.intent,
          suggestedActions: aiResponse.suggestedActions,
        },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    if (aiResponse.shouldUpdateStatus) {
      await supabaseClient
        .from("support_conversations")
        .update({ 
          status: aiResponse.newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    }

    return new Response(
      JSON.stringify({
        message: newMessage,
        aiResponse,
      }),
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

function generateAIResponse(userMessage: string, history: any[], conversation: any) {
  const lowerMessage = userMessage.toLowerCase();
  
  const intents = {
    greeting: /\b(ciao|salve|buongiorno|buonasera|hey|hello)\b/i,
    problem: /\b(problema|errore|bug|non funziona|aiuto|help)\b/i,
    question: /\b(come|cosa|perch[eé]|quando|dove|chi|quale)\b/i,
    thanks: /\b(grazie|ringrazio|thank)\b/i,
    complaint: /\b(arrabbiato|deluso|insoddisfatto|pessimo|terribile)\b/i,
  };

  let detectedIntent = "general";
  let confidence = 0.7;

  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(lowerMessage)) {
      detectedIntent = intent;
      confidence = 0.85;
      break;
    }
  }

  const responses: Record<string, any> = {
    greeting: {
      content: "Ciao! Sono l'assistente virtuale di MyTarget. Come posso aiutarti oggi? Puoi chiedermi informazioni su come funziona la piattaforma, su come pubblicare un target, su come inviare offerte o qualsiasi altra domanda.",
      suggestedActions: [
        "Come pubblico un target?",
        "Come funzionano le offerte?",
        "Quali sono i piani disponibili?",
      ],
    },
    problem: {
      content: "Mi dispiace che tu stia riscontrando un problema. Puoi descrivermi nel dettaglio cosa sta succedendo? Ad esempio:\n\n- Quale funzionalità stavi usando?\n- Quale errore hai visualizzato?\n- Quando si è verificato il problema?\n\nQuesto mi aiuterà a fornirti l'assistenza più adeguata.",
      suggestedActions: [
        "Non riesco ad accedere",
        "Errore durante l'invio dell'offerta",
        "Il pagamento non funziona",
      ],
    },
    question: {
      content: generateContextualAnswer(lowerMessage),
      suggestedActions: [
        "Altre domande sulla piattaforma",
        "Voglio parlare con un operatore",
      ],
    },
    thanks: {
      content: "Sono felice di esserti stato utile! Se hai altre domande, sono sempre qui per aiutarti. Buona giornata! 😊",
      shouldUpdateStatus: conversation.status === "open",
      newStatus: "resolved",
      suggestedActions: [],
    },
    complaint: {
      content: "Mi dispiace molto per la tua esperienza negativa. La tua soddisfazione è molto importante per noi. Sto inoltrando la tua segnalazione a un operatore umano che ti contatterà al più presto per risolvere la situazione. Nel frattempo, puoi fornirmi maggiori dettagli?",
      shouldUpdateStatus: true,
      newStatus: "in_progress",
      suggestedActions: [
        "Voglio un rimborso",
        "Voglio parlare con un manager",
      ],
    },
    general: {
      content: "Ho capito. Posso aiutarti con:\n\n- Informazioni sulla piattaforma MyTarget\n- Come pubblicare e gestire i tuoi target\n- Come inviare e ricevere offerte\n- Gestione del profilo e abbonamento\n- Problemi tecnici\n\nCosa ti interessa sapere?",
      suggestedActions: [
        "Come funziona MyTarget?",
        "Gestione target",
        "Gestione offerte",
        "Supporto tecnico",
      ],
    },
  };

  const response = responses[detectedIntent] || responses.general;

  return {
    content: response.content,
    confidence,
    intent: detectedIntent,
    suggestedActions: response.suggestedActions || [],
    shouldUpdateStatus: response.shouldUpdateStatus || false,
    newStatus: response.newStatus || conversation.status,
  };
}

function generateContextualAnswer(message: string): string {
  const faqResponses: Record<string, string> = {
    "pubblic": "Per pubblicare un target:\n1. Vai alla tua dashboard\n2. Clicca su 'Nuovo Target'\n3. Compila il form con titolo, descrizione, categoria, budget e località\n4. Clicca su 'Pubblica'\n\nIl tuo target sarà visibile ai venditori interessati!",
    "offer": "Per inviare un'offerta:\n1. Cerca i target che ti interessano\n2. Clicca sul target per vedere i dettagli\n3. Clicca su 'Invia Offerta'\n4. Scrivi la tua proposta e indica il prezzo\n5. Invia!\n\nIl buyer riceverà una notifica e potrà accettare o rifiutare la tua offerta.",
    "funzion": "MyTarget è una piattaforma che connette buyer e seller:\n\n- I BUYER pubblicano target (richieste) per prodotti/servizi che cercano\n- I SELLER cercano target interessanti e inviano offerte\n- Le parti si connettono tramite chat per finalizzare\n\nÈ semplice, veloce ed efficace!",
    "pian": "Abbiamo 3 piani:\n\n- FREE: Accesso base, 3 target al mese\n- PRO (€29/mese): 20 target, priorità nei risultati, analisi avanzate\n- ENTERPRISE (€99/mese): Target illimitati, supporto dedicato, API\n\nPuoi cambiare piano in qualsiasi momento!",
    "paga": "Accettiamo:\n- Carte di credito (Visa, Mastercard, Amex)\n- PayPal\n- Bonifico bancario (solo per piani annuali)\n\nTutti i pagamenti sono sicuri e crittografati.",
    "canc": "Puoi cancellare il tuo abbonamento in qualsiasi momento dalle impostazioni del profilo. L'abbonamento rimarrà attivo fino alla fine del periodo già pagato.",
    "conta": "Puoi contattarci:\n- Via email: [email protected]\n- Tramite questa chat\n- Telefono: +39 02 1234567 (Lun-Ven 9-18)\n\nSiamo qui per aiutarti!",
  };

  for (const [keyword, response] of Object.entries(faqResponses)) {
    if (message.includes(keyword)) {
      return response;
    }
  }

  return "Grazie per la tua domanda. Potresti fornirmi più dettagli? Oppure, ecco alcune risorse che potrebbero esserti utili:\n\n- Guida introduttiva alla piattaforma\n- FAQ completa\n- Video tutorial\n\nSe preferisci, posso metterti in contatto con un operatore umano.";
}
