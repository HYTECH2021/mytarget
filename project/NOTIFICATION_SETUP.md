# Guida Configurazione Notifiche Email e Push - MY TARGET

## Panoramica

Questo sistema invia automaticamente email e notifiche push quando un venditore completa l'invio di un'offerta (incluso l'upload di file PDF/Immagini).

## Componenti del Sistema

### 1. Database Trigger
- **File**: `supabase/migrations/20260123000000_add_offer_notification_trigger.sql`
- **Funzione**: Si attiva automaticamente quando viene inserita una nuova offerta nella tabella `offers`
- **Azione**: Chiama l'Edge Function `send-offer-notification` per inviare email e push notification

### 2. Edge Function: send-offer-notification
- **File**: `supabase/functions/send-offer-notification/index.ts`
- **Funzione**: Riceve i dati dell'offerta e invia email al buyer
- **Parametri**:
  - `offer_id`: ID dell'offerta
  - `buyer_email`: Email del buyer
  - `buyer_name`: Nome del buyer
  - `target_title`: Titolo della ricerca
  - `seller_name`: Nome del venditore

### 3. Edge Function: send-email
- **File**: `supabase/functions/send-email/index.ts`
- **Funzione**: Invia email utilizzando Resend API o SMTP Supabase
- **Supporta**: Resend API (se `RESEND_API_KEY` è configurato)

### 4. Service Worker
- **File**: `public/sw.js`
- **Funzione**: Gestisce le notifiche push del browser
- **Eventi**: `push` (riceve notifiche), `notificationclick` (gestisce click sulle notifiche)

### 5. Push Notifications Utilities
- **File**: `src/utils/pushNotifications.ts`
- **Funzioni**:
  - `registerServiceWorker()`: Registra il service worker
  - `subscribeToPush()`: Sottoscrive l'utente alle push notifications
  - `savePushSubscription()`: Salva la subscription nel database

### 6. Tabella push_subscriptions
- **File**: `supabase/migrations/20260123000001_add_push_subscriptions_table.sql`
- **Funzione**: Memorizza le subscriptions push degli utenti
- **Colonne**: `user_id`, `subscription` (JSONB con endpoint e keys)

## Configurazione

### Passo 1: Esegui le Migrations

Esegui le seguenti migrations nel database Supabase:

1. `20260123000000_add_offer_notification_trigger.sql`
2. `20260123000001_add_push_subscriptions_table.sql`

### Passo 2: Configura Email Service

#### Opzione A: Resend (Consigliato)

1. Registrati su [Resend](https://resend.com)
2. Crea un API Key
3. Aggiungi la variabile d'ambiente `RESEND_API_KEY` nelle Edge Functions Supabase:
   - Dashboard Supabase → Edge Functions → Settings → Secrets
   - Aggiungi `RESEND_API_KEY=re_xxxxxxxxxxxxx`

#### Opzione B: SMTP Supabase

1. Configura SMTP nel Dashboard Supabase:
   - Project Settings → Auth → SMTP Settings
   - Compila i campi (Host, Port, Username, Password, Sender Email)

### Passo 3: Deploy Edge Functions

```bash
# Deploy send-offer-notification
supabase functions deploy send-offer-notification

# Deploy send-email (opzionale, se usi Resend)
supabase functions deploy send-email
```

### Passo 4: Configura Variabili d'Ambiente

Nel Dashboard Supabase → Edge Functions → Settings → Secrets, aggiungi:

- `RESEND_API_KEY` (se usi Resend)
- `SUPABASE_URL` (automaticamente disponibile)
- `SITE_URL` (opzionale, default: https://mytarget.ai)

### Passo 5: Abilita HTTP Extension

Il trigger usa l'estensione `http` di Postgres. Se non è già abilitata:

```sql
-- Nel SQL Editor di Supabase
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

## Web Push API Setup (Opzionale)

Per le notifiche push browser, hai bisogno di VAPID keys:

1. **Genera VAPID Keys** (usa un generatore online o node.js):
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Aggiungi VAPID Public Key** all'ambiente frontend:
   - Crea `.env.local`:
     ```
     VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
     ```

3. **Aggiungi VAPID Private Key** all'Edge Function (per inviare push):
   - Dashboard → Edge Functions → Secrets
   - `VAPID_PRIVATE_KEY=your_vapid_private_key_here`

## Flusso di Funzionamento

1. **Venditore completa offerta** → `SendOfferModal` invia dati a Supabase
2. **Trigger attivato** → `notify_buyer_new_offer()` chiama Edge Function
3. **Edge Function** → `send-offer-notification` invia:
   - **Email** al buyer (via `send-email` o SMTP)
   - **Push notification** (se subscription presente)
4. **Buyer riceve**:
   - Email con oggetto "Hai ricevuto una nuova offerta per la tua ricerca!"
   - Notifica push "Nuova offerta disponibile. Clicca per vedere i dettagli."

## Test del Sistema

### Test Email

1. Invia un'offerta da un account venditore
2. Controlla la casella email del buyer
3. Verifica che l'email contenga:
   - Oggetto corretto
   - Link alla dashboard
   - Informazioni sull'offerta

### Test Push Notifications

1. Accetta le notifiche nel browser (consent dialog)
2. Chiudi la finestra del browser
3. Invia un'offerta da un altro account
4. Verifica che appaia una notifica push

## Troubleshooting

### Email non arriva

- Verifica che `RESEND_API_KEY` sia configurato correttamente
- Controlla i log dell'Edge Function nel Dashboard Supabase
- Verifica che SMTP sia configurato se non usi Resend

### Push notifications non funzionano

- Verifica che il service worker sia registrato (`navigator.serviceWorker.ready`)
- Controlla che `VITE_VAPID_PUBLIC_KEY` sia configurato nel frontend
- Verifica che l'utente abbia accettato le notifiche (`Notification.permission === 'granted'`)

### Trigger non si attiva

- Verifica che l'estensione `http` sia abilitata
- Controlla i log di Supabase per errori nel trigger
- Verifica che `SUPABASE_URL` e `SUPABASE_ANON_KEY` siano configurati come setting nel database

## Note Importanti

1. **Performance**: Il trigger è asincrono e non blocca l'inserimento dell'offerta
2. **Error Handling**: Se l'email fallisce, l'offerta viene comunque salvata
3. **Privacy**: Le email contengono solo informazioni necessarie
4. **Consenso**: L'utente deve accettare le notifiche tramite `NotificationConsent`
