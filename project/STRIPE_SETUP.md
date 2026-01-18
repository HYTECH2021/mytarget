# Setup Stripe per MY TARGET

## 1. Crea Account Stripe

1. Vai su [stripe.com](https://stripe.com)
2. Crea un account (o accedi se già esistente)
3. Completa la verifica del business

## 2. Ottieni le API Keys

1. Vai su [Dashboard Stripe](https://dashboard.stripe.com)
2. Vai su **Developers** → **API keys**
3. Copia:
   - **Publishable key** (inizia con `pk_`)
   - **Secret key** (inizia con `sk_`) - **NON condividere mai questa chiave!**

## 3. Configura Variabili d'Ambiente

Aggiungi al file `.env`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**IMPORTANTE**: 
- Usa chiavi `test_` per sviluppo
- Usa chiavi `live_` per produzione
- Non committare mai il file `.env` nel repository!

## 4. Crea Prodotti e Prezzi in Stripe

### Via Dashboard Stripe:

1. Vai su **Products** → **Add product**
2. Crea i seguenti prodotti:

#### Prodotto: Plus Plan
- **Name**: MY TARGET Plus
- **Description**: Statistiche e insights base
- **Pricing**: 
  - Type: Recurring
  - Price: €19.00
  - Billing period: Monthly
- **Metadata**: `plan: plus`

#### Prodotto: Pro Plan
- **Name**: MY TARGET Pro
- **Description**: Forecast AI e chat prioritarie
- **Pricing**:
  - Type: Recurring
  - Price: €49.00
  - Billing period: Monthly
- **Metadata**: `plan: pro`

### Via API (Alternativa):

```bash
# Plus Plan
curl https://api.stripe.com/v1/products \
  -u sk_test_...: \
  -d name="MY TARGET Plus" \
  -d description="Statistiche e insights base"

# Poi crea il prezzo
curl https://api.stripe.com/v1/prices \
  -u sk_test_...: \
  -d product=prod_... \
  -d unit_amount=1900 \
  -d currency=eur \
  -d recurring[interval]=month

# Pro Plan
curl https://api.stripe.com/v1/products \
  -u sk_test_...: \
  -d name="MY TARGET Pro" \
  -d description="Forecast AI e chat prioritarie"

# Poi crea il prezzo
curl https://api.stripe.com/v1/prices \
  -u sk_test_...: \
  -d product=prod_... \
  -d unit_amount=4900 \
  -d currency=eur \
  -d recurring[interval]=month
```

## 5. Crea Endpoint API per Checkout

Devi creare un endpoint che crea una Stripe Checkout Session. Opzioni:

### Opzione A: Supabase Edge Function (Consigliato)

Crea `supabase/functions/create-checkout-session/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  try {
    const { plan, userId, userEmail } = await req.json();

    // Mappa piani a price IDs di Stripe
    const priceMap: Record<string, string> = {
      plus: Deno.env.get("STRIPE_PLUS_PRICE_ID") || "",
      pro: Deno.env.get("STRIPE_PRO_PRICE_ID") || "",
    };

    const priceId = priceMap[plan];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Piano non valido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${Deno.env.get("SITE_URL")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("SITE_URL")}/pricing`,
      metadata: {
        userId,
        plan,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

### Opzione B: Backend Server (Node.js/Express)

Crea endpoint `/api/create-checkout-session`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout-session', async (req, res) => {
  const { plan, userId, userEmail } = req.body;

  const priceMap = {
    plus: process.env.STRIPE_PLUS_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
  };

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    payment_method_types: ['card'],
    line_items: [{
      price: priceMap[plan],
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SITE_URL}/pricing`,
    metadata: {
      userId,
      plan,
    },
  });

  res.json({ sessionId: session.id });
});
```

## 6. Configura Webhook Stripe

1. Vai su **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. URL: `https://your-domain.com/api/stripe-webhook`
4. Eventi da ascoltare:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copia il **Signing secret** (inizia con `whsec_`)

## 7. Aggiorna Variabili d'Ambiente

Aggiungi al `.env`:

```bash
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=http://localhost:5173  # o il tuo dominio in produzione
```

## 8. Gestisci Webhook per Aggiornare Subscription

Quando Stripe conferma un pagamento, aggiorna la subscription in Supabase:

```typescript
// In webhook handler
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const { userId, plan } = session.metadata;

  // Aggiorna subscription in Supabase
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan: plan,
      status: 'active',
      started_at: new Date().toISOString(),
      stripe_subscription_id: session.subscription,
    });
}
```

## 9. Test in Modalità Test

1. Usa carte di test Stripe:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - CVV: qualsiasi 3 cifre
   - Data: qualsiasi data futura

2. Testa il flusso completo:
   - Click "Sottoscrivi" su `/pricing`
   - Completa checkout Stripe
   - Verifica che subscription sia aggiornata in Supabase

## Note Importanti

- **Sicurezza**: Non esporre mai `STRIPE_SECRET_KEY` nel frontend
- **Webhook**: Verifica sempre la firma del webhook per sicurezza
- **Metadata**: Usa metadata per tracciare userId e plan
- **Error Handling**: Gestisci sempre errori di pagamento
- **Cancellazione**: Implementa anche la gestione della cancellazione subscription
