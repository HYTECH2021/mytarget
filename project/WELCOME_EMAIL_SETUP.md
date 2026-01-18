# Guida Configurazione Email di Benvenuto - MyTarget

## Panoramica

Sistema automatico di email di benvenuto che invia template personalizzati in base al ruolo dell'utente (buyer o seller) immediatamente dopo la conferma della registrazione via email.

## Componenti del Sistema

### 1. Edge Function: send-welcome-email
- **File**: `supabase/functions/send-welcome-email/index.ts`
- **Funzione**: Riceve dati utente (email, full_name, role, phone_number) e invia email personalizzata
- **Template**: Due template distinti per buyer e seller
- **Provider**: Resend API (con fallback logging se non configurato)

### 2. Database Trigger
- **File**: `supabase/migrations/20260125000000_add_welcome_email_trigger.sql`
- **Funzione**: `check_and_send_welcome_email()` 
- **Trigger**: Si attiva dopo INSERT/UPDATE su `profiles` quando l'email è confermata
- **Logica**: Verifica che `auth.users.email_confirmed_at` sia impostato prima di inviare

### 3. Template Email

#### Template Buyer
- **Oggetto**: "Benvenuto su MyTarget – La tua ricerca inizia qui!"
- **Contenuto**: 
  - Benvenuto personalizzato con nome utente
  - Spiegazione dell'AI che ottimizza le ricerche
  - Enfasi su controllo del budget
  - Call-to-action per iniziare la prima ricerca

#### Template Seller
- **Oggetto**: "Benvenuto su MyTarget – Trova nuovi clienti oggi stesso"
- **Contenuto**:
  - Benvenuto personalizzato con nome utente
  - Accesso a ricerche reali, mirate e verificate
  - **Sezione speciale**: "Finestra sul futuro del mercato"
    - Ricerche previsionali in tempo reale
    - Analisi della domanda mentre nasce
    - Filtri demografici, geografici e di budget
    - Anticipare i competitor
  - Call-to-action per esplorare i target

## Configurazione

### Passo 1: Esegui la Migration

Esegui la migration nel database Supabase:

```sql
-- Esegui il file: supabase/migrations/20260125000000_add_welcome_email_trigger.sql
```

### Passo 2: Configura Resend API Key

1. Registrati su [Resend](https://resend.com)
2. Crea un API Key
3. Aggiungi la variabile d'ambiente `RESEND_API_KEY` nelle Edge Functions Supabase:
   - Dashboard Supabase → Edge Functions → Settings → Secrets
   - Aggiungi `RESEND_API_KEY=re_xxxxxxxxxxxxx`

### Passo 3: Configura Variabili d'Ambiente

Nel Dashboard Supabase → Edge Functions → Settings → Secrets, aggiungi:

- `RESEND_API_KEY` (obbligatorio per inviare email)
- `SUPABASE_URL` (automaticamente disponibile)
- `SITE_URL` (opzionale, default: https://mytarget.ai)

### Passo 4: Deploy Edge Function

```bash
supabase functions deploy send-welcome-email
```

## Flusso di Funzionamento

1. **Utente si registra** → `AuthContext.signUp()` crea profilo in `profiles`
2. **Utente conferma email** → Supabase imposta `auth.users.email_confirmed_at`
3. **Trigger attivato** → `check_and_send_welcome_email()` verifica email confermata
4. **Edge Function chiamata** → `send-welcome-email` riceve dati utente
5. **Template selezionato** → Buyer o Seller in base a `role`
6. **Email inviata** → Via Resend API (o loggata se non configurato)

## Verifica Campi Database

Il sistema verifica che siano disponibili:
- ✅ `email` (da `auth.users` o `profiles`)
- ✅ `full_name` (da `profiles`)
- ✅ `role` (da `profiles`, deve essere 'buyer' o 'seller')
- ✅ `phone_number` (da `profiles`, opzionale)

## Test del Sistema

### Test Manuale

1. Registra un nuovo utente buyer:
   - Completa la registrazione
   - Conferma l'email via link di Supabase
   - Verifica ricezione email con oggetto: "Benvenuto su MyTarget – La tua ricerca inizia qui!"

2. Registra un nuovo utente seller:
   - Completa la registrazione
   - Conferma l'email via link di Supabase
   - Verifica ricezione email con oggetto: "Benvenuto su MyTarget – Trova nuovi clienti oggi stesso"

### Verifica Log

Controlla i log dell'Edge Function nel Dashboard Supabase:
- Dashboard → Edge Functions → send-welcome-email → Logs
- Verifica eventuali errori o successi

## Troubleshooting

### Email non arriva

1. **Verifica RESEND_API_KEY**:
   - Controlla che sia configurato correttamente
   - Verifica che non sia scaduto o revocato

2. **Verifica trigger**:
   - Controlla che la migration sia stata eseguita
   - Verifica che l'email sia effettivamente confermata (`email_confirmed_at IS NOT NULL`)

3. **Verifica log**:
   - Controlla i log dell'Edge Function per errori
   - Verifica i log del database per errori nel trigger

### Template non corretto

- Verifica che il `role` nel profilo sia 'buyer' o 'seller'
- Controlla i log per vedere quale template viene selezionato

### Campi mancanti

- Verifica che `email`, `full_name`, e `role` siano presenti nel profilo
- Controlla che `phone_number` sia mappato correttamente (anche se opzionale)

## Note Importanti

1. **Timing**: L'email viene inviata solo dopo la conferma email (non alla registrazione)
2. **Una volta sola**: Il trigger invia l'email solo se l'email è confermata
3. **Fallback**: Se `RESEND_API_KEY` non è configurato, l'email viene loggata ma non inviata
4. **Privacy**: I dati `phone_number` sono inclusi nel payload ma non mostrati nell'email (per ora)

## Prossimi Miglioramenti

- [ ] Aggiungere `phone_number` nel template email (se richiesto)
- [ ] Personalizzazione basata su categoria/settore (per seller)
- [ ] Email di follow-up dopo X giorni
- [ ] A/B testing dei template per ottimizzare conversioni
