# 🚀 Guida Sincronizzazione GitHub

Questa guida ti aiuta a sincronizzare tutto il progetto MyTarget con il tuo repository GitHub.

## 📋 Prerequisiti

- Git installato sul tuo computer
- Accesso al repository: `https://github.com/HYTECH2021/mytarget.git`
- Credenziali GitHub configurate

## 🎯 Metodo 1: Script Automatico (Raccomandato)

### Per Mac/Linux:

1. Apri il terminale nella cartella del progetto
2. Esegui lo script:

```bash
./sync-to-github.sh
```

3. Conferma con `y` quando richiesto
4. Inserisci le credenziali GitHub se necessario

### Per Windows (PowerShell - Raccomandato):

1. Apri PowerShell nella cartella del progetto:
   - Clicca destro sulla cartella mentre tieni premuto `Shift`
   - Scegli "Apri finestra PowerShell qui"

2. Esegui lo script:

```powershell
.\sync-to-github.ps1
```

3. Se ricevi errore "impossibile caricare lo script":

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\sync-to-github.ps1
```

4. Conferma con `y` quando richiesto
5. Inserisci le credenziali GitHub se necessario

### Per Windows (Command Prompt - Alternativa):

1. Apri il Command Prompt nella cartella del progetto
2. Esegui:

```cmd
sync-to-github.bat
```

3. Conferma con `y` quando richiesto

## 🔧 Metodo 2: Comandi Manuali

Se preferisci farlo manualmente:

```bash
# Inizializza git (se necessario)
git init

# Configura user
git config user.email "tua-email@example.com"
git config user.name "Il Tuo Nome"

# Aggiungi remote
git remote add origin https://github.com/HYTECH2021/mytarget.git

# Aggiungi tutti i file
git add .

# Commit
git commit -m "Update MyTarget platform"

# Rinomina branch
git branch -M main

# Push (force)
git push -f origin main
```

## ⚠️ Note Importanti

1. **Force Push**: Lo script usa `-f` (force) per sovrascrivere completamente il repository
2. **Backup**: Assicurati di avere un backup se ci sono modifiche nel repository remoto che vuoi mantenere
3. **Credenziali**: La prima volta ti verrà chiesto di autenticarti con GitHub
4. **Vercel**: Dopo il push, Vercel farà automaticamente il deploy della nuova versione

## 🔐 Autenticazione GitHub

Se ricevi errori di autenticazione, puoi usare:

### Personal Access Token (Raccomandato)

1. Vai su: https://github.com/settings/tokens
2. Genera un nuovo token (classic)
3. Seleziona scope: `repo` (full control)
4. Usa il token come password quando richiesto

### SSH (Alternativa)

Se preferisci usare SSH:

```bash
# Cambia remote in SSH
git remote set-url origin git@github.com:HYTECH2021/mytarget.git
```

## 📦 Cosa Viene Sincronizzato

Il sync include tutti i file del progetto:

- ✅ 73 file totali
- ✅ Codice sorgente React/TypeScript
- ✅ Migrazioni database Supabase
- ✅ Edge Functions
- ✅ Configurazioni (Vite, Tailwind, TypeScript)
- ✅ Documentazione (README, guide)
- ✅ Risorse statiche (immagini, loghi)

## 🆘 Troubleshooting

### Errore: "could not read Username"
- Il terminale non può richiedere credenziali interattive
- Soluzione: Usa Personal Access Token o SSH

### Errore: "remote origin already exists"
- Il remote è già configurato
- Soluzione: Continua normalmente, lo script lo gestisce

### Errore: "Permission denied"
- Non hai i permessi per il repository
- Soluzione: Verifica di essere owner/collaborator del repo

## ✅ Verifica Sync

Dopo il sync, verifica che tutto sia andato a buon fine:

1. Vai su: https://github.com/HYTECH2021/mytarget
2. Controlla che i file siano aggiornati
3. Vai su Vercel per vedere il deploy in corso
4. Dopo 2-3 minuti il sito sarà live con le modifiche

## 🔗 Link Utili

- **Repository**: https://github.com/HYTECH2021/mytarget
- **Vercel Dashboard**: https://vercel.com
- **Supabase Dashboard**: https://supabase.com/dashboard

---

**Hai bisogno di aiuto?** Contatta il supporto o consulta la documentazione Git.
