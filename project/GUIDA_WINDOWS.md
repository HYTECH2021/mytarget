# 🪟 Guida Rapida per Windows

## 🎯 Metodo Più Semplice (PowerShell)

### Passo 1: Apri PowerShell
- Vai nella cartella del progetto in Esplora File
- Tieni premuto `Shift` e clicca destro in uno spazio vuoto
- Scegli **"Apri finestra PowerShell qui"** (o "Apri in Terminale")

### Passo 2: Esegui lo Script
Copia e incolla questo comando:

```powershell
.\sync-to-github.ps1
```

### Passo 3: Se Vedi un Errore
Se ricevi l'errore "impossibile caricare lo script", esegui:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Poi riprova:

```powershell
.\sync-to-github.ps1
```

### Passo 4: Conferma
- Ti chiederà conferma, scrivi `y` e premi Invio
- Inserisci le credenziali GitHub quando richiesto

## ✅ Fatto!

Il tuo progetto sarà sincronizzato su GitHub e Vercel farà il deploy automaticamente!

---

## 🔧 Alternativa: Comandi Git Manuali

Se preferisci fare tutto manualmente, apri PowerShell e copia questi comandi uno alla volta:

```powershell
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

# Push
git push -f origin main
```

---

## ⚠️ Problemi Comuni

### "git non è riconosciuto come comando"
**Soluzione**: Installa Git per Windows
1. Vai su: https://git-scm.com/download/win
2. Scarica e installa
3. Riavvia PowerShell

### "Permission denied" durante il push
**Soluzione**: Usa un Personal Access Token
1. Vai su: https://github.com/settings/tokens
2. Clicca "Generate new token (classic)"
3. Seleziona scope `repo`
4. Copia il token
5. Usa il token come password quando richiesto

### "remote origin already exists"
**Soluzione**: È normale, continua normalmente

---

## 🆘 Serve Aiuto?

Se continui ad avere problemi, puoi anche:

1. **Usare GitHub Desktop** (interfaccia grafica):
   - Scarica da: https://desktop.github.com
   - Trascina la cartella del progetto
   - Fai commit e push visualmente

2. **Contattare il supporto** con lo screenshot dell'errore

---

**🚀 Dopo il sync**, controlla:
- GitHub: https://github.com/HYTECH2021/mytarget
- Vercel farà il deploy in 2-3 minuti
