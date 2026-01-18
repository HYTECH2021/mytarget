# Guida Configurazione Verifica Email - MY TARGET

## Panoramica
Questa guida spiega come configurare la verifica email per la piattaforma MY TARGET utilizzando Supabase Auth.

## 1. Configurazione Email in Supabase Dashboard

### Accedi a Supabase Dashboard
1. Vai su [https://app.supabase.com](https://app.supabase.com)
2. Seleziona il tuo progetto MY TARGET
3. Vai su **Authentication** > **Email Templates**

### Configurazione Email Provider

#### Opzione A: Usa l'email di Supabase (sviluppo/test)
- Supabase fornisce un servizio email gratuito per sviluppo
- Limitato a poche email al giorno
- Ideale per test iniziali

#### Opzione B: Configura SMTP personalizzato (produzione)
1. Vai su **Project Settings** > **Auth** > **SMTP Settings**
2. Compila i campi:
   - **SMTP Host**: es. `smtp.gmail.com` per Gmail
   - **Port**: `587` (TLS) o `465` (SSL)
   - **Username**: la tua email aziendale
   - **Password**: password o app password
   - **Sender Email**: `noreply@mytarget.ai` o `info@mytarget.ai`
   - **Sender Name**: `MY TARGET`

### Configurazione Email Template

1. Vai su **Authentication** > **Email Templates** > **Confirm signup**

2. Personalizza il template (esempio):

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferma Email - MY TARGET</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">MY TARGET</h1>
    <p style="color: white; margin: 10px 0 0; font-size: 14px;">Il Marketplace Invertito</p>
  </div>

  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #ea580c; margin-top: 0;">Benvenuto su MY TARGET!</h2>

    <p>Grazie per esserti registrato. Per completare la registrazione e iniziare a utilizzare la piattaforma, devi confermare il tuo indirizzo email.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
                color: white;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                display: inline-block;
                box-shadow: 0 4px 6px rgba(234, 88, 12, 0.3);">
        Conferma Indirizzo Email
      </a>
    </div>

    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Se non hai richiesto questa registrazione, ignora questa email.
    </p>

    <p style="color: #666; font-size: 14px;">
      <strong>Nota:</strong> Il link scade dopo 24 ore.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center;">
      © 2024 MY TARGET. Tutti i diritti riservati.<br>
      Da preda a cacciatore. Precisione. Velocità. Risultati.
    </p>
  </div>
</body>
</html>
```

3. Clicca su **Save**

## 2. Configurazione Verifica Email Obbligatoria

### Abilita Email Confirmation
1. Vai su **Authentication** > **Settings**
2. Scorri fino a **Email Auth**
3. Assicurati che **Enable email confirmations** sia ATTIVO (toggle verde)
4. Configura:
   - **Confirmation URL**: Lascia il default o imposta `https://tuodominio.com`
   - **Mailer secure email change**: ATTIVO (raccomandato)

### Configura Redirect URLs
1. Vai su **Authentication** > **URL Configuration**
2. Aggiungi i tuoi URL in **Redirect URLs**:
   - `http://localhost:5173` (sviluppo)
   - `https://tuodominio.com` (produzione)

## 3. Configurazione Email Personalizzata

### Opzione: Gmail con App Password
Se usi Gmail come email provider:

1. Vai su [Google Account Security](https://myaccount.google.com/security)
2. Abilita **Verifica in due passaggi**
3. Vai su **App Passwords**
4. Genera una password per "Mail" su "Other"
5. Usa questa password in Supabase SMTP Settings

### Opzione: Email Professionale (Consigliato)
Per una migliore deliverability:

**Opzioni raccomandate:**
- **SendGrid** (gratuito fino a 100 email/giorno)
- **Mailgun** (gratuito fino a 5.000 email/mese)
- **Amazon SES** (molto economico)
- **Resend** (moderno e facile da configurare)

#### Setup con SendGrid (esempio)
1. Registrati su [SendGrid](https://sendgrid.com)
2. Verifica il tuo dominio
3. Crea una API Key
4. In Supabase SMTP Settings:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: [la tua API key]
   - Sender: `noreply@mytarget.ai`

## 4. Dominio Email: noreply@ vs info@

### noreply@mytarget.ai (Raccomandato per email automatiche)
**Vantaggi:**
- Chiaramente indica che è un'email automatica
- Standard industriale per conferme e notifiche
- Gli utenti non rispondono per errore

**Svantaggi:**
- Può sembrare impersonale
- Alcuni filtri antispam potrebbero penalizzare

### info@mytarget.ai (Alternativa valida)
**Vantaggi:**
- Più "umana" e accessibile
- Gli utenti possono rispondere se hanno problemi

**Svantaggi:**
- Riceverai risposte automatiche e spam
- Meno chiaro che è un'email automatica

### Raccomandazione
**Per MY TARGET, usa `noreply@mytarget.ai` perché:**
1. È lo standard per email di conferma
2. Riduce confusione
3. Mantieni `info@mytarget.ai` per supporto clienti

## 5. Configurazione DNS (per email personalizzata)

### Record DNS necessari
Per usare `noreply@mytarget.ai`:

```
# SPF Record
TXT @ "v=spf1 include:_spf.sendgrid.net ~all"

# DKIM Record (fornito dal tuo provider email)
TXT s1._domainkey [chiave fornita da SendGrid/altro provider]

# DMARC Record (opzionale ma raccomandato)
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@mytarget.ai"
```

### Come configurare DNS
1. Accedi al tuo provider DNS (es. Cloudflare, GoDaddy, etc.)
2. Aggiungi i record forniti dal tuo email provider
3. Aspetta 24-48 ore per la propagazione
4. Verifica con [MXToolbox](https://mxtoolbox.com)

## 6. Test Configurazione

### Test Email di Verifica
1. Vai nella tua app MY TARGET
2. Registra un nuovo account con una email di test
3. Controlla che:
   - Email arrivi entro 1-2 minuti
   - Non finisca in spam
   - Il link di conferma funzioni
   - Il redirect dopo conferma sia corretto

### Debug Problemi Comuni

#### Email non arriva
1. Controlla spam/promozioni
2. Verifica configurazione SMTP in Supabase
3. Controlla logs in **Authentication** > **Logs**

#### Email in spam
1. Configura SPF, DKIM, DMARC
2. Usa un provider email affidabile
3. Evita parole spam nell'oggetto/corpo

#### Link non funziona
1. Verifica Redirect URLs in Supabase
2. Controlla che il dominio sia corretto
3. Verifica che il link non sia scaduto

## 7. Monitoraggio

### Dashboard Supabase
- **Authentication** > **Logs**: vedi tutti gli eventi di autenticazione
- **Authentication** > **Users**: stato verifica di ogni utente

### Metriche da monitorare
- Tasso di conferma email
- Tempo medio per conferma
- Email che finiscono in spam
- Errori di invio

## 8. Costi Stimati

### Setup Iniziale (gratuito)
- Supabase email: gratuito per test
- SendGrid free tier: 100 email/giorno

### Produzione (scale)
- SendGrid Essentials: $19.95/mese (50k email)
- Mailgun: $35/mese (50k email)
- Amazon SES: ~$5/mese (10k email)

## Supporto

Per problemi o domande sulla configurazione email:
1. Consulta [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
2. Verifica [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
3. Contatta supporto Supabase per problemi specifici

## Note Finali

- La verifica email è già configurata nel codice MY TARGET
- L'interfaccia utente mostra messaggi appropriati
- Gli utenti devono confermare prima di accedere alla piattaforma
- Il sistema è pronto per produzione una volta configurato SMTP
