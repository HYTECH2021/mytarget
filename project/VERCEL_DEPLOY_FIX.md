# Fix Errore Deploy Vercel - Package.json Non Trovato

## Problema

Vercel non trova il file `package.json` perché il progetto è in una sottocartella (`project/`) invece che nella root del repository.

**Errore:**
```
npm error enoent Impossibile leggere package.json: Errore: ENOENT: nessun file o directory, aprire '/vercel/path0/package.json'
```

## Soluzione

### Opzione 1: Configurare Root Directory in Vercel (Raccomandato)

1. Vai su **Vercel Dashboard** → Seleziona il progetto
2. Vai su **Settings** → **General**
3. Nella sezione **Root Directory**, inserisci: `project`
4. Clicca **Save**
5. Fai un nuovo deploy

### Opzione 2: Usare vercel.json (Già Configurato)

Ho aggiornato il file `vercel.json` con:
```json
{
  "rootDirectory": "project",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

**IMPORTANTE**: Assicurati che questo file sia nella **root del repository** (non in `project/`).

### Opzione 3: Spostare package.json nella Root (Non Raccomandato)

Se preferisci, puoi spostare tutti i file nella root, ma questo richiede una riorganizzazione del repository.

## Verifica Configurazione

Dopo aver configurato la root directory:

1. Vai su **Vercel Dashboard** → **Deployments**
2. Clicca **Redeploy** sull'ultimo deployment
3. Verifica che il build funzioni

## Struttura Repository Corretta

```
mytarget/                    (Root repository GitHub)
├── project/                 (Root directory per Vercel)
│   ├── package.json        ← Vercel deve cercare qui
│   ├── vite.config.ts
│   ├── src/
│   ├── public/
│   └── ...
├── vercel.json             ← Configurazione Vercel (nella root)
└── README.md
```

## Prossimi Passi

1. **Configura Root Directory** in Vercel Dashboard → Settings → General
2. **Aggiungi variabili d'ambiente** (se non già fatto):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Fai un nuovo deploy**

## Troubleshooting

### Se l'errore persiste:

1. Verifica che `vercel.json` sia nella root del repository (non in `project/`)
2. Verifica che il campo "Root Directory" in Vercel sia impostato su `project`
3. Controlla i Build Logs per vedere se trova il `package.json`

### Se vedi ancora "package.json not found":

1. Vai su **Settings** → **General** → **Root Directory**
2. Assicurati che sia impostato su: `project` (senza slash iniziale)
3. Salva e fai un nuovo deploy
