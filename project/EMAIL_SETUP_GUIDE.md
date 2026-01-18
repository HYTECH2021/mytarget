# Guida Configurazione Email di Benvenuto

Questa guida ti aiuterà a configurare l'email di benvenuto automatica per i nuovi utenti che si registrano su MyTarget.

## Metodo 1: Template Email Supabase (Consigliato)

Supabase offre template email built-in che puoi personalizzare direttamente dal dashboard.

### Passi per configurare:

1. **Accedi al Dashboard Supabase**
   - Vai su https://supabase.com/dashboard
   - Seleziona il tuo progetto MyTarget

2. **Naviga nelle Impostazioni Email**
   - Vai su **Authentication** → **Email Templates**

3. **Personalizza il Template "Confirm Signup"**
   - Seleziona il template "Confirm signup"
   - Copia il contenuto del file `email-templates/welcome-email.html`
   - Incolla nel campo del template
   - Clicca su **Save**

4. **Variabili Disponibili**
   Le seguenti variabili sono automaticamente disponibili nei template:
   - `{{ .ConfirmationURL }}` - Link di conferma email
   - `{{ .Token }}` - Token di conferma
   - `{{ .TokenHash }}` - Hash del token
   - `{{ .SiteURL }}` - URL del tuo sito
   - `{{ .User.Email }}` - Email dell'utente
   - `{{ .User.UserMetaData.full_name }}` - Nome completo (se fornito durante la registrazione)

## Metodo 2: Edge Function + Database Trigger (Avanzato)

Se vuoi più controllo, puoi creare un sistema personalizzato usando:

### 1. Servizio Email Esterno

Scegli un provider email (uno di questi):
- **Resend** (consigliato) - https://resend.com
- **SendGrid** - https://sendgrid.com
- **Mailgun** - https://mailgun.com

### 2. Crea Edge Function

```typescript
// supabase/functions/send-welcome-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { email, full_name } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'MyTarget <noreply@mytarget.com>',
      to: email,
      subject: 'Benvenuto su MyTarget! 🎯',
      html: `
        <!-- HTML email template qui -->
      `
    })
  })

  return new Response(JSON.stringify({ sent: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 3. Configura Database Trigger

```sql
-- Crea una funzione che chiama l'Edge Function
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'YOUR_SUPABASE_URL/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY'
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'full_name', NEW.full_name
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea il trigger
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email();
```

## Metodo 3: Client-Side (Non Consigliato per Produzione)

Puoi anche inviare l'email dal frontend dopo la registrazione, ma questo non è consigliato perché:
- Meno affidabile (dipende dal client)
- Espone API keys
- Può essere bypassato

## Configurazione Attuale

Al momento, Supabase invia automaticamente un'email di conferma quando un utente si registra (se la conferma email è abilitata).

### Per personalizzare l'email esistente:

1. Vai su **Authentication** → **Email Templates** nel dashboard
2. Modifica il template con il design fornito in `email-templates/welcome-email.html`
3. Salva le modifiche

### Email di Conferma

Se vuoi che gli utenti confermino la loro email prima di accedere:

1. Vai su **Authentication** → **Settings**
2. Abilita **"Enable email confirmations"**
3. Gli utenti riceveranno automaticamente l'email di benvenuto con il link di conferma

## Template Email Fornito

Il file `email-templates/welcome-email.html` contiene un template HTML professionale con:

- Design moderno e responsive
- Gradienti viola (brand MyTarget)
- Sezione di benvenuto personalizzata
- Lista delle features principali
- Call-to-action button
- Footer informativo

## Testare l'Email

Per testare l'email:

1. Registra un nuovo utente di test
2. Controlla la tua inbox (e spam folder)
3. Verifica che l'email abbia il design corretto
4. Testa tutti i link funzionino correttamente

## Note Importanti

- Le email sono inviate automaticamente da Supabase
- Non è necessario codice aggiuntivo per email di base
- Per email più complesse, usa un servizio esterno
- Assicurati di configurare un dominio email personalizzato per produzione

## Dominio Email Personalizzato (Produzione)

Per email professionali in produzione:

1. Vai su **Project Settings** → **Auth**
2. Configura **Custom SMTP** con il tuo provider email
3. Verifica il dominio presso il tuo provider DNS
4. Testa l'invio email

---

Per qualsiasi domanda o problema, consulta la [documentazione ufficiale Supabase Auth](https://supabase.com/docs/guides/auth/auth-email-templates).
