# MyTarget - Sync to GitHub Script (PowerShell)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MyTarget - Sync to GitHub Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se Git è installato
try {
    $gitVersion = git --version
    Write-Host "[OK] Git trovato: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Git non è installato!" -ForegroundColor Red
    Write-Host "Scarica Git da: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Verifica se siamo in una directory git
if (-not (Test-Path .git)) {
    Write-Host "[INFO] Inizializzo repository git..." -ForegroundColor Yellow
    git init
    git config user.email "deploy@mytarget.com"
    git config user.name "MyTarget Deploy"
}

# Aggiungi remote se non esiste
$remotes = git remote
if ($remotes -notcontains "origin") {
    Write-Host "[INFO] Aggiungo remote GitHub..." -ForegroundColor Yellow
    git remote add origin https://github.com/HYTECH2021/mytarget.git
} else {
    Write-Host "[OK] Remote GitHub già configurato" -ForegroundColor Green
}

# Status corrente
Write-Host ""
Write-Host "[INFO] Status attuale:" -ForegroundColor Cyan
git status --short

# Aggiungi tutti i file
Write-Host ""
Write-Host "[INFO] Aggiungo tutti i file..." -ForegroundColor Cyan
git add .

# Commit
Write-Host ""
Write-Host "[INFO] Creando commit..." -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Update MyTarget platform - $timestamp" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Commit creato" -ForegroundColor Green
} else {
    Write-Host "[OK] Nessuna modifica da committare" -ForegroundColor Green
}

# Rinomina branch a main
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host ""
    Write-Host "[INFO] Rinomino branch a 'main'..." -ForegroundColor Yellow
    git branch -M main
}

# Push
Write-Host ""
Write-Host "[WARNING] Verrà eseguito un FORCE PUSH (-f)" -ForegroundColor Red
Write-Host "Questo sovrascriverà completamente il repository remoto" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Sei sicuro? (y/n)"

if ($confirm -eq "y" -or $confirm -eq "Y") {
    Write-Host ""
    Write-Host "[INFO] Push to GitHub..." -ForegroundColor Cyan

    git push -f origin main

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  SYNC COMPLETATA CON SUCCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Repository: https://github.com/HYTECH2021/mytarget" -ForegroundColor Cyan
        Write-Host "Vercel farà il deploy automaticamente" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "[ERROR] Errore durante il push" -ForegroundColor Red
        Write-Host "Verifica le tue credenziali GitHub" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Se hai problemi di autenticazione:" -ForegroundColor Yellow
        Write-Host "1. Crea un Personal Access Token su GitHub" -ForegroundColor White
        Write-Host "2. Vai su: https://github.com/settings/tokens" -ForegroundColor White
        Write-Host "3. Usa il token come password" -ForegroundColor White
        Write-Host ""
        pause
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "[CANCELLED] Operazione annullata" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 0
}

pause
