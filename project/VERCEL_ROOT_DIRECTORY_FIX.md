# Fix: Configura Root Directory in Vercel

## Problema

Il campo `rootDirectory` non è supportato in `vercel.json`. Deve essere configurato nelle impostazioni del progetto Vercel.

## Soluzione

### Passo 1: Configura Root Directory nelle Impostazioni Vercel

1. **Vai su Vercel Dashboard** → Seleziona il progetto `mytarget-ti62`
2. **Vai su Settings** → **General**
3. **Scorri in basso** fino alla sezione **"Root Directory"**
4. **Inserisci**: `project` (senza slash iniziale/finale)
5. **Clicca "Save"**

### Passo 2: Deploy Nuovo

Dopo aver salvato:
1. Vai su **Deployments**
2. Clicca **"Redeploy"** sull'ultimo deployment
3. Oppure fai un nuovo deploy manuale

## Struttura Corretta

```
mytarget/                    (Root repository GitHub)
├── project/                 ← Vercel lavorerà da qui
│   ├── package.json        ← Vercel cercherà questo file
│   ├── src/
│   ├── dist/               ← Output del build
│   └── ...
├── vercel.json             ← Configurazione routing (NO rootDirectory qui)
└── README.md
```

## Note Importanti

- ❌ **NON** mettere `rootDirectory` in `vercel.json`
- ✅ **SÌ** configura `rootDirectory` in Vercel Dashboard → Settings → General
- ✅ Il `vercel.json` serve solo per routing e altre configurazioni

## Verifica

Dopo aver configurato:
1. Vai su **Deployments** → **Build Logs**
2. Verifica che il log dica: `Installing dependencies...` (trova package.json)
3. Se vedi `npm install`, significa che funziona!
