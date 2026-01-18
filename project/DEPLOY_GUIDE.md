# Guida Deploy su Vercel

Questa guida ti aiuterà a deployare MyTarget su Vercel in pochi minuti.

## Prerequisiti

1. Account Vercel (gratuito) - https://vercel.com
2. Repository Git (GitHub, GitLab, o Bitbucket)
3. Database Supabase configurato e funzionante

## Metodo 1: Deploy tramite Dashboard Vercel (Consigliato)

### 1. Prepara il Repository

Assicurati che il tuo codice sia su un repository Git:

```bash
# Se non hai già inizializzato git
git init
git add .
git commit -m "Initial commit"

# Crea un repository su GitHub e poi:
git remote add origin https://github.com/TUO-USERNAME/mytarget.git
git branch -M main
git push -u origin main
```

### 2. Importa il Progetto su Vercel

1. Vai su https://vercel.com/new
2. Clicca su **"Import Project"**
3. Seleziona il tuo repository Git
4. Vercel rileverà automaticamente che è un progetto Vite

### 3. Configura le Variabili d'Ambiente

Nella sezione **Environment Variables**, aggiungi:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**IMPORTANTE**: Non committare mai il file `.env` nel repository!

Per trovare queste variabili:
1. Vai sul tuo Dashboard Supabase
2. Seleziona il progetto
3. Vai su **Settings** → **API**
4. Copia **Project URL** e **anon public key**

### 4. Configura Build Settings

Vercel dovrebbe rilevare automaticamente le impostazioni:

```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Se non le rileva, configurale manualmente.

### 5. Deploy

Clicca su **Deploy** e aspetta che Vercel completi il processo (circa 2-3 minuti).

## Metodo 2: Deploy tramite CLI Vercel

### 1. Installa Vercel CLI

```bash
npm install -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Deploy

Dalla directory del progetto:

```bash
# Prima volta (configurazione)
vercel

# Deploy in produzione
vercel --prod
```

### 4. Configura Environment Variables

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## Post-Deploy: Configurazione Supabase

Dopo il deploy, devi aggiornare le configurazioni Supabase:

### 1. Aggiungi URL del Sito

Nel Dashboard Supabase:

1. Vai su **Authentication** → **URL Configuration**
2. Aggiungi il tuo URL Vercel nei **Site URL**:
   ```
   https://your-app-name.vercel.app
   ```
3. Aggiungi anche nei **Redirect URLs**:
   ```
   https://your-app-name.vercel.app/**
   ```

### 2. Configura CORS

Se necessario, aggiungi il dominio Vercel nelle whitelist CORS.

## Deploy Automatico (CI/CD)

Vercel configura automaticamente il deploy continuo:

- **Push su `main`** → Deploy in produzione
- **Pull Request** → Deploy di preview
- **Push su altri branch** → Deploy di sviluppo

## Ottimizzazioni Post-Deploy

### 1. Custom Domain

1. Vai su **Project Settings** → **Domains**
2. Aggiungi il tuo dominio personalizzato
3. Configura i DNS records come indicato

### 2. Performance

Vercel ottimizza automaticamente:
- ✅ Edge Network globale
- ✅ Compressione Brotli/Gzip
- ✅ HTTP/2 e HTTP/3
- ✅ Caching intelligente
- ✅ Image optimization

### 3. Analytics (Opzionale)

Abilita Vercel Analytics per monitorare performance:

1. Vai su **Analytics** nel dashboard
2. Clicca su **Enable**

### 4. Monitoring

Configura notifiche per:
- Deploy falliti
- Errori runtime
- Performance issues

## Troubleshooting

### Build Fallisce

Se il build fallisce:

1. Verifica che funzioni localmente: `npm run build`
2. Controlla i log di build su Vercel
3. Verifica che tutte le dipendenze siano in `package.json`
4. Controlla le variabili d'ambiente

### 404 su Route Refresh

Il file `vercel.json` dovrebbe gestire questo. Se hai problemi:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Errori Supabase

Se l'app non si connette a Supabase:

1. Verifica le variabili d'ambiente su Vercel
2. Controlla che l'URL del sito sia aggiunto su Supabase
3. Verifica i CORS settings

### Performance Lenta

- Usa code splitting
- Ottimizza le immagini
- Riduci le dimensioni dei bundle
- Usa lazy loading per componenti pesanti

## Comandi Utili

```bash
# Visualizza informazioni deploy
vercel inspect

# Visualizza logs
vercel logs

# Lista tutti i deploy
vercel list

# Rollback a una versione precedente
vercel rollback

# Rimuovi progetto
vercel remove
```

## Sicurezza

### Variabili d'Ambiente

- ✅ Usa `VITE_` prefix per variabili pubbliche
- ❌ Non committare `.env` nel repository
- ✅ Usa Vercel Environment Variables
- ✅ Separa variabili per production/preview/development

### Headers Sicurezza

Il file `vercel.json` include già headers di sicurezza:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## Costi

### Vercel Free Tier Include:

- ✅ Deploy illimitati
- ✅ 100 GB bandwidth/mese
- ✅ SSL automatico
- ✅ Global CDN
- ✅ Deploy preview automatici

Per maggiori informazioni sui limiti: https://vercel.com/pricing

## Link Utili

- Dashboard Vercel: https://vercel.com/dashboard
- Documentazione: https://vercel.com/docs
- Status Page: https://vercel-status.com
- Community: https://github.com/vercel/vercel/discussions

## Prossimi Passi

Dopo il deploy:

1. ✅ Testa tutte le funzionalità
2. ✅ Configura dominio personalizzato
3. ✅ Abilita analytics
4. ✅ Configura monitoring
5. ✅ Aggiorna documentazione con URL produzione
6. ✅ Informa gli utenti del lancio

---

**Congratulazioni! 🎉**

Il tuo MyTarget è ora live e accessibile a tutti!
