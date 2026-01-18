#!/bin/bash

echo "🚀 MyTarget - Sync to GitHub Script"
echo "===================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verifica se siamo in una directory git
if [ ! -d .git ]; then
    echo -e "${RED}❌ Errore: Non sono in una directory git${NC}"
    echo "Inizializzo repository git..."
    git init
    git config user.email "deploy@mytarget.com"
    git config user.name "MyTarget Deploy"
fi

# Aggiungi remote se non esiste
if ! git remote | grep -q 'origin'; then
    echo -e "${BLUE}🔗 Aggiungo remote GitHub...${NC}"
    git remote add origin https://github.com/HYTECH2021/mytarget.git
else
    echo -e "${GREEN}✓ Remote GitHub già configurato${NC}"
fi

# Status corrente
echo ""
echo -e "${BLUE}📊 Status attuale:${NC}"
git status --short

# Aggiungi tutti i file
echo ""
echo -e "${BLUE}📦 Aggiungo tutti i file...${NC}"
git add .

# Commit
echo ""
echo -e "${BLUE}💾 Creando commit...${NC}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Update MyTarget platform - $TIMESTAMP" || echo -e "${GREEN}✓ Nessuna modifica da committare${NC}"

# Rinomina branch a main se necessario
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${BLUE}🔄 Rinomino branch a 'main'...${NC}"
    git branch -M main
fi

# Push
echo ""
echo -e "${BLUE}🚀 Push to GitHub...${NC}"
echo -e "${RED}⚠️  Verrà eseguito un FORCE PUSH (-f)${NC}"
echo ""
read -p "Sei sicuro? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -f origin main

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ SYNC COMPLETATA CON SUCCESSO!${NC}"
        echo ""
        echo "🌐 Repository: https://github.com/HYTECH2021/mytarget"
        echo "🚀 Vercel farà il deploy automaticamente"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ Errore durante il push${NC}"
        echo "Verifica le tue credenziali GitHub"
        exit 1
    fi
else
    echo ""
    echo -e "${RED}❌ Operazione annullata${NC}"
    exit 0
fi
