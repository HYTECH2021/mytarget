import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://mytarget.ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailPayload {
  email: string;
  full_name: string;
  role: 'buyer' | 'seller';
  phone_number?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: WelcomeEmailPayload = await req.json();
    const { email, full_name, role, phone_number } = payload;

    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, full_name, role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Select template based on role
    const { subject, html } = role === 'buyer' 
      ? getBuyerTemplate(full_name)
      : getSellerTemplate(full_name);

    // Send email via Resend or fallback
    if (RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "MyTarget <noreply@mytarget.ai>",
          to: email,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Resend API error:", errorData);
        throw new Error(`Resend API error: ${errorData}`);
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, id: data.id, role }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fallback: Log that email service is not configured
    console.log("Email service not configured. Welcome email would be sent to:", email);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Email service not configured",
        message: "Please configure RESEND_API_KEY"
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-welcome-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getBuyerTemplate(fullName: string): { subject: string; html: string } {
  const subject = "Benvenuto su MyTarget – La tua ricerca inizia qui!";
  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900;">🎯 Benvenuto su MyTarget!</h1>
      <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0; font-size: 16px;">Il Marketplace Invertito</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">
        Ciao <strong>${fullName}</strong>,
      </p>

      <p style="color: #475569; margin-bottom: 20px; font-size: 16px; line-height: 1.8;">
        Benvenuto su <strong>MyTarget</strong>! Siamo entusiasti di averti nella nostra community e di accompagnarti nel tuo percorso di ricerca.
      </p>

      <div style="background: #f8fafc; border-left: 4px solid #FF6B00; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; color: #64748b; font-size: 15px; line-height: 1.8;">
          <strong style="color: #1e293b;">La tua esperienza sarà potenziata dalla nostra AI:</strong> Il nostro sistema di intelligenza artificiale ottimizzerà ogni tua ricerca per renderla chiara e facilmente individuabile dai migliori fornitori. Potrai sempre stabilire e gestire il budget a tua disposizione per avere il massimo controllo su ogni opportunità.
        </p>
      </div>

      <div style="margin: 30px 0;">
        <h2 style="color: #FF6B00; font-size: 22px; margin-bottom: 20px; font-weight: 700;">🎯 Cosa puoi fare ora:</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #1e293b;">Pubblica la tua ricerca</strong>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Descrivi esattamente cosa stai cercando e il tuo budget ideale</p>
          </li>
          <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #1e293b;">Ricevi offerte personalizzate</strong>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">I migliori fornitori vedranno la tua richiesta e ti contatteranno</p>
          </li>
          <li style="padding: 12px 0;">
            <strong style="color: #1e293b;">Gestisci il tuo budget</strong>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Controlla sempre quanto vuoi investire per ogni ricerca</p>
          </li>
        </ul>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${SITE_URL}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);">
          Inizia la Tua Prima Ricerca
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;" />

      <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0;">
        Se hai domande, il nostro team di supporto è sempre disponibile.<br>
        Buona ricerca! 🎯
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        <strong style="color: #1e293b;">MyTarget</strong> - Il Marketplace Invertito<br>
        © 2026 MyTarget. Tutti i diritti riservati.
      </p>
    </div>
  </div>

</body>
</html>
  `;

  return { subject, html };
}

function getSellerTemplate(fullName: string): { subject: string; html: string } {
  const subject = "Benvenuto su MyTarget – Trova nuovi clienti oggi stesso";
  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900;">🚀 Benvenuto su MyTarget!</h1>
      <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0; font-size: 16px;">Il Marketplace Invertito</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">
        Ciao <strong>${fullName}</strong>,
      </p>

      <p style="color: #475569; margin-bottom: 20px; font-size: 16px; line-height: 1.8;">
        Benvenuto su <strong>MyTarget</strong>! Da oggi avrai accesso diretto a ricerche di mercato reali, mirate e verificate. Grazie al nostro sistema, riceverai solo opportunità in linea con il tuo profilo, ottimizzando il tuo tempo e aumentando le possibilità di chiusura.
      </p>

      <div style="background: linear-gradient(135deg, rgba(255, 107, 0, 0.1) 0%, rgba(255, 140, 0, 0.05) 100%); border-left: 4px solid #FF6B00; padding: 24px; margin: 30px 0; border-radius: 4px;">
        <h3 style="color: #FF6B00; font-size: 18px; margin: 0 0 15px; font-weight: 700;">🔮 Non ti offriamo solo lead, ma una vera e propria finestra sul futuro del mercato</h3>
        <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.8;">
          Avrai accesso esclusivo a ricerche di mercato previsionali basate non su dati storici obsoleti, ma su <strong>fotografie in tempo reale</strong> dell'andamento attuale. Potrai analizzare la domanda mentre nasce, filtrando per criteri demografici, geografici e di budget, per <strong>anticipare le mosse dei tuoi competitor</strong> e posizionarti prima degli altri.
        </p>
      </div>

      <div style="margin: 30px 0;">
        <h2 style="color: #FF6B00; font-size: 22px; margin-bottom: 20px; font-weight: 700;">🎯 I vantaggi per te:</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #1e293b;">Ricerche verificate e mirate</strong>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Solo opportunità in linea con il tuo settore e profilo aziendale</p>
          </li>
          <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #1e293b;">Intelligenza di mercato in tempo reale</strong>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Analizza la domanda mentre nasce, non quando è già consolidata</p>
          </li>
          <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #1e293b;">Filtri avanzati</strong>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Criteri demografici, geografici e di budget per trovare i target perfetti</p>
          </li>
          <li style="padding: 12px 0;">
            <strong style="color: #1e293b;">Anticipa i competitor</strong>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Posizionati prima degli altri grazie all'accesso esclusivo ai trend emergenti</p>
          </li>
        </ul>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${SITE_URL}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);">
          Esplora i Target Disponibili
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;" />

      <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0;">
        Se hai domande, il nostro team di supporto è sempre disponibile.<br>
        Buona caccia! 🎯
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        <strong style="color: #1e293b;">MyTarget</strong> - Il Marketplace Invertito<br>
        © 2026 MyTarget. Tutti i diritti riservati.
      </p>
    </div>
  </div>

</body>
</html>
  `;

  return { subject, html };
}
