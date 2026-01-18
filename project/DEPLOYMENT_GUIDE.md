# Guida al Deployment MyTarget

## Prerequisiti

Prima di iniziare il deployment, assicurati di avere:

1. Un account Vercel (https://vercel.com)
2. Il progetto Supabase configurato e funzionante
3. Le credenziali Supabase (URL e Anon Key)
4. Il repository GitHub pronto

## Step 1: Preparazione Supabase

### Database Production Ready

Il database è già configurato con:
- Tutte le tabelle e le relazioni
- Row Level Security (RLS) attivo su tutte le tabelle
- Trigger e funzioni automatiche
- Sistema di notifiche
- Sistema di chat

### Email di Benvenuto (Opzionale)

Se vuoi inviare email di benvenuto agli utenti:
1. Vai su Supabase Dashboard > Project Settings > Auth
2. Configura SMTP settings (vedi EMAIL_SETUP_GUIDE.md)
3. Attiva "Enable Custom SMTP"

### Verifica Edge Functions

Controlla che le Edge Functions siano deployate:
- `ai-chat-suggestions` - Suggerimenti intelligenti per la chat
- `ai-support-assistant` - Assistente AI per il supporto

## Step 2: Deploy su Vercel

### Metodo 1: Deploy da Dashboard Vercel

1. Vai su https://vercel.com/new
2. Importa il repository GitHub `mytarget`
3. Configura il progetto:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Aggiungi le variabili d'ambiente:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Clicca su "Deploy"

### Metodo 2: Deploy da CLI

```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Segui le istruzioni e quando richiesto:
# - Set up and deploy? Yes
# - Which scope? [Il tuo account]
# - Link to existing project? No
# - Project name? mytarget
# - Directory? ./
# - Override settings? No

# Aggiungi le variabili d'ambiente
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy in produzione
vercel --prod
```

## Step 3: Configurazione Post-Deploy

### 1. Configura Supabase Auth Redirects

Nel Supabase Dashboard:
1. Vai su Authentication > URL Configuration
2. Aggiungi gli URL di Vercel:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

### 2. Testa le Funzionalità

Verifica che tutto funzioni:
- [ ] Registrazione utente
- [ ] Login
- [ ] Dashboard Buyer
- [ ] Dashboard Seller
- [ ] Creazione Target/Lead
- [ ] Chat tra utenti
- [ ] Upload foto
- [ ] Sistema notifiche
- [ ] Supporto AI

### 3. Configura il Dominio Personalizzato (Opzionale)

1. Vai su Vercel Dashboard > Settings > Domains
2. Aggiungi il tuo dominio
3. Configura i DNS records come indicato
4. Aggiorna gli URL in Supabase

## Step 4: Monitoraggio

### Analytics Vercel

Attiva Vercel Analytics per monitorare:
- Performance
- Traffico
- Errori

### Supabase Monitoring

Controlla nel Supabase Dashboard:
- Database usage
- API calls
- Storage usage
- Edge Functions logs

## Troubleshooting

### Errore: "Invalid JWT"

Soluzione: Verifica che le variabili d'ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY siano corrette

### Errore: "CORS"

Soluzione: Verifica che l'URL di Vercel sia aggiunto in Supabase Auth Redirects

### Build fallito

Soluzione: Esegui `npm run build` localmente per vedere gli errori dettagliati

### Database connection error

Soluzione: Controlla che il progetto Supabase sia attivo e le credenziali corrette

## Performance Optimization

### Ottimizzazioni già implementate:

1. Lazy loading componenti
2. Ottimizzazione immagini
3. Code splitting
4. Caching headers configurati
5. Security headers attivi

### Raccomandazioni future:

1. Configura CDN per le immagini
2. Implementa Service Worker per PWA
3. Abilita compressione Brotli
4. Monitora Core Web Vitals

## Sicurezza

### Misure già implementate:

- RLS attivo su tutte le tabelle
- Security headers (X-Frame-Options, CSP, etc.)
- Validazione input lato client e server
- JWT authentication
- HTTPS enforced

### Best Practices:

1. Non committare mai file .env
2. Ruota le chiavi periodicamente
3. Monitora i log per attività sospette
4. Mantieni le dipendenze aggiornate

## Costi Stimati

### Vercel (Hobby Plan - Gratis)
- 100GB bandwidth
- Deployments illimitati
- SSL automatico

### Supabase (Free Tier)
- 500MB database
- 1GB file storage
- 2GB bandwidth
- 50,000 monthly active users

Per superare questi limiti, valuta i piani a pagamento.

## Support

Per problemi o domande:
1. Controlla i log su Vercel Dashboard
2. Controlla i log su Supabase Dashboard
3. Verifica la documentazione Supabase/Vercel
4. Contatta il supporto se necessario

## Checklist Finale

Prima di andare live:

- [ ] Build locale completato senza errori
- [ ] Tutte le variabili d'ambiente configurate
- [ ] URL Supabase aggiornati
- [ ] Test completo di tutte le funzionalità
- [ ] Dominio personalizzato configurato (se applicabile)
- [ ] Analytics attivato
- [ ] Backup database configurato
- [ ] Email SMTP configurato (opzionale)
- [ ] Privacy Policy e Terms of Service aggiunti (legalmente necessario)

## Next Steps

Dopo il deploy:
1. Monitora le performance per le prime 24-48 ore
2. Raccogli feedback dagli utenti
3. Implementa miglioramenti basati sui dati
4. Pianifica feature future
