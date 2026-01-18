# Guida Configurazione Notifiche Real-time per Venditori - MyTarget

## Panoramica

Sistema automatico di notifiche real-time per venditori quando un buyer pubblica una nuova ricerca nella loro categoria di interesse.

## Componenti del Sistema

### 1. Database Trigger
- **File**: `supabase/migrations/20260126000000_add_new_target_notification_trigger.sql`
- **Funzione**: `notify_sellers_new_target()`
- **Trigger**: Si attiva automaticamente quando viene inserito un nuovo target attivo
- **Logica**: Identifica la categoria del target e trova tutti i venditori interessati

### 2. Edge Function: notify-sellers-new-target
- **File**: `supabase/functions/notify-sellers-new-target/index.ts`
- **Funzione**: 
  - Trova tutti i venditori con `primary_sector` corrispondente alla categoria
  - Invia email a ciascun venditore interessato
  - Le notifiche in-app e push sono gestite dal frontend via Realtime

### 3. NotificationSystem (Frontend)
- **File**: `src/components/NotificationSystem.tsx`
- **Funzionalità**:
  - Sottoscrizione Realtime a nuovi target per venditori
  - Filtra per categoria (`primary_sector`)
  - Mostra notifica in-app: "Nuova opportunità nella categoria [Nome Categoria]!"
  - Invia push notification: "Nuovo Target rilevato: [Categoria]. Clicca per rispondere."

### 4. Template Email
- **Oggetto**: "Nuova ricerca trovata per te: [Titolo Ricerca]"
- **Contenuto**:
  - Messaggio personalizzato con nome venditore
  - Dettagli ricerca (titolo, categoria, località, budget)
  - Call-to-action per vedere i dettagli
  - Link diretto al target

## Configurazione

### Passo 1: Esegui la Migration

Esegui la migration nel database Supabase:

```sql
-- Esegui il file: supabase/migrations/20260126000000_add_new_target_notification_trigger.sql
```

### Passo 2: Configura Variabili d'Ambiente

Nel Dashboard Supabase → Edge Functions → Settings → Secrets, aggiungi:

- `RESEND_API_KEY` (obbligatorio per inviare email)
- `SUPABASE_URL` (automaticamente disponibile)
- `SUPABASE_SERVICE_ROLE_KEY` (per query admin)
- `SITE_URL` (opzionale, default: https://mytarget.ai)

### Passo 3: Deploy Edge Function

```bash
supabase functions deploy notify-sellers-new-target
```

### Passo 4: Configurazione Database Settings

Nel SQL Editor di Supabase, esegui:

```sql
-- Imposta le configurazioni necessarie per il trigger
ALTER DATABASE postgres SET app.supabase_url = 'YOUR_SUPABASE_URL';
ALTER DATABASE postgres SET app.supabase_anon_key = 'YOUR_SUPABASE_ANON_KEY';
```

**Nota**: In alternativa, puoi usare variabili d'ambiente o configurare queste impostazioni nel trigger stesso.

## Flusso di Funzionamento

1. **Buyer pubblica ricerca** → `NewRequestModal` inserisce nuovo target in `targets`
2. **Trigger attivato** → `notify_sellers_new_target()` chiama Edge Function
3. **Edge Function** → Trova venditori con `primary_sector` corrispondente
4. **Notifiche inviate**:
   - **Email**: Via Resend API a tutti i venditori interessati
   - **In-App**: Via Supabase Realtime (frontend si sottoscrive)
   - **Push**: Via Service Worker (se abilitato)

## Logica di Matching Categorie

Il sistema notifica un venditore se:
- `notifications_enabled = true` (ha attivato le notifiche)
- `primary_sector` corrisponde alla categoria del target OPPURE
- `primary_sector` è NULL o vuoto (notifica tutti i venditori senza settore specifico)

## Gestione Notifiche

I venditori possono:
- **Attivare/Disattivare**: Tramite `NotificationConsent` al primo accesso
- **Gestire preferenze**: Modificando `notifications_enabled` nel profilo
- **Filtrare categorie**: Impostando `primary_sector` nel profilo

## Test del Sistema

### Test Manuale

1. **Registra un venditore**:
   - Imposta `primary_sector` = "Elettronica" (o altra categoria)
   - Attiva notifiche (`notifications_enabled = true`)

2. **Pubblica una ricerca**:
   - Come buyer, pubblica un target con categoria "Elettronica"
   - Verifica che il venditore riceva:
     - Notifica in-app (pallino rosso sulla campanella)
     - Email (se RESEND_API_KEY configurato)
     - Push notification (se abilitato)

### Verifica Log

Controlla i log dell'Edge Function nel Dashboard Supabase:
- Dashboard → Edge Functions → notify-sellers-new-target → Logs
- Verifica eventuali errori o successi

## Troubleshooting

### Notifiche non arrivano

1. **Verifica trigger**:
   - Controlla che la migration sia stata eseguita
   - Verifica che il target sia `status = 'active'`

2. **Verifica matching categoria**:
   - Controlla che `primary_sector` del venditore corrisponda alla categoria del target
   - Verifica che `notifications_enabled = true`

3. **Verifica Edge Function**:
   - Controlla i log per errori
   - Verifica che `RESEND_API_KEY` sia configurato

### Email non arriva

- Verifica `RESEND_API_KEY` nelle Edge Functions
- Controlla i log dell'Edge Function per errori Resend
- Verifica che l'email del venditore sia valida

### Notifiche in-app non funzionano

- Verifica che il venditore abbia `notifications_enabled = true`
- Controlla la console del browser per errori Realtime
- Verifica che la subscription Realtime sia attiva

## Ottimizzazione Anti-Spam

Per evitare che le email finiscano in spam:

1. **Configura SPF/DKIM** nel dominio email (se usi dominio personalizzato)
2. **Usa Resend** con dominio verificato
3. **Limita frequenza**: Il sistema invia una email per target (non spam)
4. **Consenso esplicito**: Solo venditori con `notifications_enabled = true`

## Note Importanti

1. **Performance**: Il trigger è asincrono e non blocca l'inserimento del target
2. **Scalabilità**: Per molti venditori, considera rate limiting o batch processing
3. **Privacy**: Le email contengono solo informazioni pubbliche del target
4. **Consenso**: I venditori devono esplicitamente attivare le notifiche
