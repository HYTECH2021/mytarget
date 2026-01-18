# Guida Completa alle Variabili d'Ambiente - MyTarget

## Variabili Obbligatorie (per il funzionamento base)

### 1. `VITE_SUPABASE_URL`

**Dove trovarla:**
1. Vai su [Supabase Dashboard](https://app.supabase.com)
2. Seleziona il tuo progetto (o creane uno nuovo)
3. Vai su **Settings** → **API** (sidebar sinistra)
4. Nella sezione **Project URL**, copia l'URL completo
   - Formato: `https://xxxxxxxxxxxxx.supabase.co`
   - Esempio: `https://abcdefghijklmnop.supabase.co`

**Come copiarla:**
- Clicca sull'icona "Copy" accanto a "Project URL"
- Oppure copia manualmente l'URL dalla casella

---

### 2. `VITE_SUPABASE_ANON_KEY`

**Dove trovarla:**
1. Vai su [Supabase Dashboard](https://app.supabase.com)
2. Seleziona il tuo progetto
3. Vai su **Settings** → **API**
4. Nella sezione **Project API keys**, trova **anon public**
5. Copia la chiave (è molto lunga, circa 100+ caratteri)

**Come copiarla:**
- Clicca sull'icona "Copy" accanto a "anon public"
- **⚠️ IMPORTANTE**: Usa la chiave "anon public", NON la "service_role" (quella è segreta!)

**Esempio di formato:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Variabili Opzionali (per funzionalità avanzate)

### 3. `VITE_STRIPE_PUBLISHABLE_KEY` (Opzionale)

**Quando serve:** Solo se usi il sistema di abbonamenti Stripe (pagina `/pricing`)

**Dove trovarla:**
1. Vai su [Stripe Dashboard](https://dashboard.stripe.com)
2. Accedi al tuo account (o creane uno nuovo)
3. Vai su **Developers** → **API keys**
4. Trova la sezione **Publishable key** (inizia con `pk_test_` per test, `pk_live_` per produzione)
5. Copia la chiave

**Note:**
- Usa `pk_test_...` per sviluppo/test
- Usa `pk_live_...` solo per produzione
- Questa chiave è pubblica e sicura da esporre nel frontend

---

### 4. `VITE_OPENAI_API_KEY` (Opzionale)

**Quando serve:** Solo se vuoi usare OpenAI per le funzionalità AI (suggerimenti categorìe, assistente)

**Dove trovarla:**
1. Vai su [OpenAI Platform](https://platform.openai.com)
2. Accedi o registrati
3. Vai su **API keys** → **Create new secret key**
4. Copia la chiave generata (inizia con `sk-...`)
5. **⚠️ IMPORTANTE**: Salvala subito, non potrai più vederla!

**Note:**
- Questa chiave è SECRETA - non committarla mai nel codice
- Ha un costo per ogni richiesta API
- Se non configurata, il sistema userà suggerimenti basati su regole

---

### 5. `VITE_GROK_API_KEY` (Opzionale)

**Quando serve:** Alternativa a OpenAI, se preferisci usare Grok (X/Twitter AI)

**Dove trovarla:**
1. Vai su [Grok API](https://x.ai/api) o [xAI Developer Portal](https://console.x.ai)
2. Accedi con il tuo account X/Twitter
3. Crea una nuova API key
4. Copia la chiave generata

**Note:**
- Alternativa a OpenAI
- Usa solo una delle due (OpenAI o Grok), non entrambe

---

### 6. `VITE_VAPID_PUBLIC_KEY` (Opzionale)

**Quando serve:** Solo se vuoi abilitare le notifiche push per PWA

**Come generarla:**
1. Puoi generarla usando un tool online come [VAPID Key Generator](https://vapidkeys.com)
2. Oppure usa questo comando Node.js:
   ```bash
   npm install -g web-push
   web-push generate-vapid-keys
   ```
3. Copia solo la **Public Key** (non la Private!)

**Note:**
- La Private Key va configurata nelle Edge Functions di Supabase (non nel frontend)
- Questa chiave è pubblica e sicura da esporre

---

## Come Configurare le Variabili

### Per Sviluppo Locale

1. Crea un file `.env` nella root del progetto:
   ```bash
   # .env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_OPENAI_API_KEY=sk-...
   ```

2. **⚠️ IMPORTANTE**: Aggiungi `.env` al `.gitignore` per non committarlo!

3. Riavvia il server di sviluppo:
   ```bash
   npm run dev
   ```

### Per Deploy su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com)
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi ogni variabile:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Environment**: Seleziona tutte (Production, Preview, Development)
5. Clicca **Save**
6. Ripeti per tutte le variabili
7. **Fai un nuovo deploy** per applicare le modifiche

### Per Deploy su Supabase Edge Functions

Per le Edge Functions (come `notify-sellers-new-target`), le variabili vanno configurate separatamente:

1. Vai su [Supabase Dashboard](https://app.supabase.com)
2. Seleziona il progetto
3. Vai su **Edge Functions** → **Settings** → **Secrets**
4. Aggiungi le variabili:
   - `RESEND_API_KEY` (per inviare email)
   - `SUPABASE_URL` (già disponibile di default)
   - `SUPABASE_SERVICE_ROLE_KEY` (per query admin)
   - `SITE_URL` (URL del tuo sito, es: `https://mytarget.vercel.app`)

---

## Checklist Configurazione

### Base (Funzionalità Minime)
- [ ] `VITE_SUPABASE_URL` - Configurata
- [ ] `VITE_SUPABASE_ANON_KEY` - Configurata

### Opzionali (per Funzionalità Avanzate)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` - Solo se usi abbonamenti
- [ ] `VITE_OPENAI_API_KEY` o `VITE_GROK_API_KEY` - Solo se usi AI
- [ ] `VITE_VAPID_PUBLIC_KEY` - Solo se usi notifiche push PWA

### Edge Functions Supabase
- [ ] `RESEND_API_KEY` - Per email di benvenuto e notifiche
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Per operazioni admin nelle Edge Functions

---

## Test Configurazione

Dopo aver configurato le variabili, verifica che funzionino:

1. **Test locale:**
   ```bash
   npm run dev
   # Il sito dovrebbe caricarsi senza errori
   ```

2. **Test build:**
   ```bash
   npm run build
   # Il build dovrebbe completarsi con successo
   ```

3. **Test variabili:**
   - Apri la console del browser (F12)
   - Controlla che non ci siano errori di configurazione
   - Verifica che le chiamate a Supabase funzionino

---

## Link Utili

- [Supabase Dashboard - Settings API](https://app.supabase.com/project/_/settings/api)
- [Stripe Dashboard - API Keys](https://dashboard.stripe.com/apikeys)
- [OpenAI Platform - API Keys](https://platform.openai.com/api-keys)
- [Vercel Dashboard - Environment Variables](https://vercel.com/dashboard)

---

## Troubleshooting

### "Cannot read property 'SUPABASE_URL' of undefined"
- **Causa**: Variabile d'ambiente non configurata
- **Soluzione**: Aggiungi `VITE_SUPABASE_URL` nel file `.env` o su Vercel

### "Invalid API key" (Supabase)
- **Causa**: Hai usato la chiave sbagliata
- **Soluzione**: Usa la chiave "anon public", NON "service_role"

### "Stripe not configured"
- **Causa**: `VITE_STRIPE_PUBLISHABLE_KEY` non configurata
- **Soluzione**: Aggiungi la chiave o rimuovi le funzionalità Stripe

### Variabili non funzionano su Vercel
- **Causa**: Non hai fatto un nuovo deploy dopo aver aggiunto le variabili
- **Soluzione**: Vai su Vercel → Deployments → Redeploy
