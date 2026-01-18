# Fix Errori Deploy Vercel - MyTarget

## Problema

Il deploy su Vercel fallisce con errori relativi a "Aggiunta logica email, PWA e campi buyer".

## Cause Principali

### 1. Edge Functions Non Deployate su Supabase

Le Edge Functions di Supabase (file in `supabase/functions/`) **NON** devono essere incluse nel build di Vercel. Vengono deployate separatamente su Supabase.

**Soluzione**: Le Edge Functions sono già esclusi dal build (non sono in `src/`), ma verifica che non ci siano errori di sintassi.

### 2. Variabili d'Ambiente Mancanti in Vercel

Vercel potrebbe fallire se mancano variabili d'ambiente necessarie per il build.

**Aggiungi in Vercel Dashboard → Settings → Environment Variables**:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key (opzionale)
VITE_OPENAI_API_KEY=your_openai_key (opzionale)
VITE_GROK_API_KEY=your_grok_key (opzionale)
```

### 3. Service Worker e PWA Files

Verifica che i file PWA siano corretti:
- `public/sw.js` esiste
- `public/manifest.json` esiste
- `index.html` include i link corretti

### 4. Errori TypeScript/ESLint

**Verifica localmente**:
```bash
npm run typecheck
npm run lint
```

### 5. Build Command

Il build command di Vercel dovrebbe essere:
```
npm run build
```

## Checklist Pre-Deploy

- [ ] **Build locale funziona**: `npm run build` completa senza errori
- [ ] **TypeScript OK**: `npm run typecheck` passa
- [ ] **Variabili d'ambiente**: Configurate in Vercel Dashboard
- [ ] **Edge Functions**: Deployate separatamente su Supabase (non su Vercel)
- [ ] **Service Worker**: File `public/sw.js` presente e valido
- [ ] **Manifest**: File `public/manifest.json` presente
- [ ] **Git push**: Tutti i file committati e pushati

## Comandi per Deploy

### 1. Deploy Frontend su Vercel

```bash
# Assicurati che tutto sia committato
git add .
git commit -m "Fix deploy errors"
git push origin main
```

Vercel deployerà automaticamente.

### 2. Deploy Edge Functions su Supabase

```bash
# Deploy tutte le Edge Functions
supabase functions deploy notify-sellers-new-target
supabase functions deploy send-welcome-email
supabase functions deploy send-offer-notification
supabase functions deploy send-email
supabase functions deploy create-checkout-session
```

### 3. Esegui Migrations

Nel Supabase Dashboard → SQL Editor, esegui:
- `supabase/migrations/20260126000000_add_new_target_notification_trigger.sql`

## Verifica Post-Deploy

1. **Sito funziona**: Visita l'URL Vercel
2. **Notifiche**: Testa le notifiche in-app
3. **PWA**: Verifica installabilità
4. **Edge Functions**: Controlla i log in Supabase Dashboard

## Troubleshooting Specifico

### Errore: "Cannot find module"

- Verifica che tutte le dipendenze siano in `package.json`
- Esegui `npm install` localmente e verifica che funzioni

### Errore: "Build failed"

- Controlla i log di build in Vercel Dashboard
- Cerca errori TypeScript o di sintassi
- Verifica che non ci siano import circolari

### Errore: "Environment variable missing"

- Aggiungi tutte le variabili necessarie in Vercel Dashboard
- Verifica che inizino con `VITE_` per essere esposte al client

## Note Importanti

1. **Edge Functions**: Non vengono buildate da Vercel, solo deployate su Supabase
2. **Variabili d'ambiente**: Solo quelle con prefisso `VITE_` sono accessibili nel frontend
3. **Service Worker**: Deve essere servito da `public/` per funzionare
4. **Build warnings**: I warning su chunk size non bloccano il deploy

## Supporto

Se il problema persiste:
1. Controlla i log dettagliati in Vercel Dashboard → Deployments → [Deploy] → Build Logs
2. Verifica errori specifici e cerca soluzioni online
3. Controlla che tutte le dipendenze siano aggiornate
