@echo off
echo.
echo ========================================
echo   MyTarget - Sync to GitHub Script
echo ========================================
echo.

REM Verifica se siamo in una directory git
if not exist .git (
    echo [ERROR] Non sono in una directory git
    echo Inizializzo repository git...
    git init
    git config user.email "deploy@mytarget.com"
    git config user.name "MyTarget Deploy"
)

REM Aggiungi remote se non esiste
git remote | findstr "origin" >nul
if errorlevel 1 (
    echo [INFO] Aggiungo remote GitHub...
    git remote add origin https://github.com/HYTECH2021/mytarget.git
) else (
    echo [OK] Remote GitHub gia configurato
)

REM Status corrente
echo.
echo [INFO] Status attuale:
git status --short

REM Aggiungi tutti i file
echo.
echo [INFO] Aggiungo tutti i file...
git add .

REM Commit
echo.
echo [INFO] Creando commit...
git commit -m "Update MyTarget platform - %date% %time%"

REM Rinomina branch a main
echo.
echo [INFO] Rinomino branch a 'main'...
git branch -M main

REM Push
echo.
echo [WARNING] Verra eseguito un FORCE PUSH (-f)
echo.
set /p CONFIRM="Sei sicuro? (y/n): "

if /i "%CONFIRM%"=="y" (
    echo.
    echo [INFO] Push to GitHub...
    git push -f origin main

    if errorlevel 1 (
        echo.
        echo [ERROR] Errore durante il push
        echo Verifica le tue credenziali GitHub
        pause
        exit /b 1
    ) else (
        echo.
        echo [SUCCESS] SYNC COMPLETATA CON SUCCESSO!
        echo.
        echo Repository: https://github.com/HYTECH2021/mytarget
        echo Vercel fara il deploy automaticamente
        echo.
        pause
    )
) else (
    echo.
    echo [CANCELLED] Operazione annullata
    pause
    exit /b 0
)
