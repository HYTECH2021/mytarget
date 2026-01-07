# MyTarget - Piattaforma B2B di Lead Generation

Piattaforma innovativa che mette in contatto buyer e seller in un marketplace di opportunità commerciali.

## Caratteristiche Principali

- **Gestione Target**: I buyer pubblicano richieste di prodotti/servizi
- **Sistema Offerte**: I seller inviano proposte commerciali
- **Chat in tempo reale**: Comunicazione diretta tra buyer e seller
- **Dashboard Analytics**: Statistiche e insights per gli utenti
- **Sistema di abbonamenti**: Piani Free, Pro e Business
- **Panel Admin**: Gestione utenti e contenuti

## Setup del Progetto

### Prerequisiti

- Node.js 18+
- Account Supabase

### Installazione

1. Clona il repository:
```bash
git clone https://github.com/HYTECH2021/mytarget.git
cd mytarget
```

2. Installa le dipendenze:
```bash
npm install
```

3. Configura le variabili d'ambiente:
```bash
cp .env.example .env
```

Poi modifica `.env` con le tue credenziali Supabase:
- `VITE_SUPABASE_URL`: URL del tuo progetto Supabase
- `VITE_SUPABASE_ANON_KEY`: Anon key del tuo progetto

Trova questi valori su: [Supabase Dashboard](https://app.supabase.com/project/_/settings/api)

4. Avvia il server di sviluppo:
```bash
npm run dev
```

## Deploy su Vercel

### Setup Automatico

1. Fai il push del codice su GitHub
2. Vai su [Vercel](https://vercel.com)
3. Importa il repository GitHub
4. Aggiungi le variabili d'ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

### Vercel CLI (Opzionale)

```bash
npm i -g vercel
vercel
```

## Database

Il progetto usa Supabase PostgreSQL. Le migrazioni sono in `supabase/migrations/`.

## Struttura del Progetto

```
src/
├── components/      # Componenti React
├── contexts/        # Context API (Auth)
├── hooks/          # Custom hooks
└── lib/            # Utilità e configurazioni
```

## Tecnologie Utilizzate

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Framer Motion
- Lucide React

## Licenza

Proprietario - HYTECH2021
