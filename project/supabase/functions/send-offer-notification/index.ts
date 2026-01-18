import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OfferNotificationPayload {
  offer_id: string;
  target_id: string;
  seller_id: string;
  buyer_email: string;
  buyer_name: string;
  target_title: string;
  seller_name: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const payload: OfferNotificationPayload = await req.json();
    const {
      buyer_email,
      buyer_name,
      target_title,
      seller_name,
      offer_id,
    } = payload;

    // Get site URL for email links
    const siteUrl = Deno.env.get("SITE_URL") || "https://mytarget.ai";
    const offerUrl = `${siteUrl}/?offer=${offer_id}`;

    // Prepare email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuova Offerta Ricevuta</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  
  <div style="background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">🎯 Nuova Offerta Ricevuta!</h1>
  </div>

  <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">
      Ciao <strong>${buyer_name}</strong>,
    </p>

    <p style="color: #475569; margin-bottom: 20px;">
      Hai ricevuto una nuova offerta per la tua ricerca <strong>"${target_title}"</strong> da <strong>${seller_name}</strong>.
    </p>

    <div style="background: #f8fafc; border-left: 4px solid #FF6B00; padding: 20px; margin: 30px 0; border-radius: 8px;">
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        <strong style="color: #1e293b;">Nota:</strong> L'offerta potrebbe includere allegati (PDF, documenti o immagini) che puoi visualizzare e scaricare direttamente dalla tua dashboard.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${offerUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);">
        Vedi Dettagli Offerta
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 14px; margin-top: 30px; text-align: center;">
      Rispondi rapidamente per non perdere l'opportunità! 💼
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
      Questa è un'email automatica da MY TARGET.<br>
      Per disattivare le notifiche, vai nelle impostazioni del tuo profilo.
    </p>
  </div>

</body>
</html>
    `;

    // Send email using Supabase Auth email service
    // Note: This requires SMTP configuration in Supabase Dashboard
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: buyer_email,
        subject: 'Hai ricevuto una nuova offerta per la tua ricerca!',
        html: emailHtml,
      },
    });

    if (emailError) {
      console.error('Error sending email via function:', emailError);
      // Fallback: Try direct email sending (if configured)
      // For now, we'll just log the error but not fail the request
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailSent: !emailError,
        message: emailError ? 'Offer created but email failed' : 'Email sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-offer-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
