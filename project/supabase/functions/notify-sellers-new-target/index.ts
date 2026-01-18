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

interface NewTargetNotificationPayload {
  target_id: string;
  target_title: string;
  category: string;
  location: string;
  budget: number | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: NewTargetNotificationPayload = await req.json();
    const { target_id, target_title, category, location, budget } = payload;

    if (!target_id || !target_title || !category) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: target_id, target_title, category" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Supabase client
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find all sellers interested in this category
    // Check sellers with primary_sector matching the category
    const { data: sellers, error: sellersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, notifications_enabled')
      .eq('role', 'seller')
      .eq('notifications_enabled', true) // Only notify sellers who have notifications enabled
      .or(`primary_sector.eq.${category},primary_sector.is.null`); // Match by primary_sector or notify all if null

    if (sellersError) {
      console.error("Error fetching sellers:", sellersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch sellers", details: sellersError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (interestedSellers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No sellers to notify", notified: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send notifications to each seller
    const notificationPromises = interestedSellers.map(async (seller) => {
      try {
        // 1. Create in-app notification (store in notifications table if it exists, or use realtime)
        // For now, we'll rely on Realtime subscriptions in the frontend

        // 2. Send email notification
        if (RESEND_API_KEY && seller.email) {
          const emailHtml = getEmailTemplate(target_title, category, location, budget, seller.full_name);
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "MyTarget <noreply@mytarget.ai>",
              to: seller.email,
              subject: `Nuova ricerca trovata per te: ${target_title}`,
              html: emailHtml,
            }),
          });

          if (!emailResponse.ok) {
            console.error(`Failed to send email to ${seller.email}`);
          }
        }

        // 3. Push notification will be handled by the frontend via Realtime subscription
        return { seller_id: seller.id, email_sent: !!RESEND_API_KEY };
      } catch (error) {
        console.error(`Error notifying seller ${seller.id}:`, error);
        return { seller_id: seller.id, error: error.message };
      }
    });

    const results = await Promise.allSettled(notificationPromises);

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failedCount = results.filter((r) => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({
        success: true,
        notified: successCount,
        failed: failedCount,
        total_sellers: interestedSellers.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in notify-sellers-new-target:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getEmailTemplate(
  targetTitle: string,
  category: string,
  location: string,
  budget: number | null,
  sellerName: string
): string {
  const budgetText = budget ? `Budget: €${budget.toLocaleString('it-IT')}` : 'Budget da concordare';
  
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuova ricerca trovata per te</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">🎯 Nuova Opportunità Trovata!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">
        Ciao <strong>${sellerName}</strong>,
      </p>

      <p style="color: #475569; margin-bottom: 20px; font-size: 16px; line-height: 1.8;">
        Un Buyer ha appena pubblicato una ricerca che corrisponde al tuo profilo. Accedi subito per vedere i dettagli, analizzare il budget e inviare la tua proposta prima della concorrenza.
      </p>

      <div style="background: #f8fafc; border-left: 4px solid #FF6B00; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="color: #FF6B00; font-size: 20px; margin: 0 0 15px; font-weight: 700;">${targetTitle}</h3>
        <div style="color: #64748b; font-size: 14px; line-height: 1.8;">
          <p style="margin: 8px 0;"><strong>Categoria:</strong> ${category}</p>
          <p style="margin: 8px 0;"><strong>Località:</strong> ${location}</p>
          <p style="margin: 8px 0;"><strong>${budgetText}</strong></p>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, rgba(255, 107, 0, 0.1) 0%, rgba(255, 140, 0, 0.05) 100%); border-left: 4px solid #FF6B00; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.8;">
          <strong style="color: #1e293b;">⚡ Agisci subito:</strong> Le migliori opportunità vengono colte rapidamente. Accedi alla piattaforma per vedere tutti i dettagli e inviare la tua proposta prima dei competitor.
        </p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${SITE_URL}/?target=${target_id}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);">
          Vedi Dettagli Ricerca
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;" />

      <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0;">
        Ricevi questa notifica perché hai attivato gli avvisi per la categoria <strong>${category}</strong>.<br>
        Puoi gestire le tue preferenze di notifica nelle impostazioni del profilo.
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
}
