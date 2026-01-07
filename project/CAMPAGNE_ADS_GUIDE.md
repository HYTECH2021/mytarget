# Guida alle Campagne ADS e Gestione Admin

## Landing Pages per Nicchie (Fase 4)

### Come Funzionano

Le landing pages per nicchie sono pagine specifiche ottimizzate per le tue campagne pubblicitarie. Ogni landing page mostra:
- Richieste attive nella categoria specifica
- Statistiche in tempo reale (numero richieste, budget medio)
- Call-to-action mirati per quella nicchia

### URL delle Landing Pages

Le landing pages sono accessibili tramite parametri URL:

**Per Categoria:**
```
https://tuodominio.com/?category=Elettronica
```

**Per Categoria e Località:**
```
https://tuodominio.com/?category=Auto%20e%20Moto&location=Milano
```

### Categorie Disponibili

Le categorie iniziali sono:
- Elettronica
- Moda e Abbigliamento
- Casa e Giardino
- Sport e Tempo Libero
- Auto e Moto
- Servizi Professionali
- Immobiliare
- Lavoro
- Altro

**Nota:** Nuove categorie possono essere aggiunte dagli utenti e approvate dagli admin.

### Esempi di Campagne ADS

#### Campagna 1: Elettronica a Milano
**URL:** `?category=Elettronica&location=Milano`

**Testo Ad (Facebook/Instagram):**
```
🔥 Cerchi iPhone, laptop o TV a Milano?
Non perdere tempo a cercare - fatti trovare!
📱 Pubblica cosa cerchi
💰 Ricevi offerte dai migliori negozi
✅ Scegli la migliore offerta

[Link: tuodominio.com/?category=Elettronica&location=Milano]
```

#### Campagna 2: Auto e Moto Nazionale
**URL:** `?category=Auto%20e%20Moto`

**Testo Ad (Google Ads):**
```
Cerchi Auto Usata? Fatti Trovare Gratis
✓ Pubblica la tua richiesta
✓ Concessionari ti contattano
✓ Confronta le migliori offerte
[Link: tuodominio.com/?category=Auto%20e%20Moto]
```

#### Campagna 3: Casa e Giardino
**URL:** `?category=Casa%20e%20Giardino&location=Roma`

**Testo Ad (TikTok):**
```
🏠 Ristrutturi casa a Roma?
Non cercare i professionisti, fatti trovare da loro!

Pubblica gratis cosa ti serve →
[Link: tuodominio.com/?category=Casa%20e%20Giardino&location=Roma]
```

### Strategia di Targeting

#### Per Acquirenti (Buyer)
- Target: Chi sta cercando attivamente un prodotto/servizio
- Obiettivo: Farli pubblicare una richiesta
- Budget: Basso CPA, alto volume

#### Per Venditori (Seller)
- Target: Business owners, negozianti, professionisti
- Obiettivo: Iscrizione e conversione a piano Pro/Enterprise
- Budget: Alto CPA, qualità over quantità
- Retargeting: Mostra numero di richieste attive nella loro zona

### Tracking delle Campagne

Per tracciare le conversioni, aggiungi parametri UTM:
```
?category=Elettronica&utm_source=facebook&utm_medium=cpc&utm_campaign=elettronica_milano
```

## Pannello Admin

### Come Diventare Admin

Per il primo admin, devi inserire manualmente il record nel database:

1. **Via Supabase Dashboard:**
   - Vai su Supabase Dashboard
   - Seleziona il progetto I-LOOK For
   - Vai su "Table Editor" → "admin_users"
   - Click su "Insert" → "Insert row"
   - Nel campo `user_id`, inserisci l'ID del tuo profilo (lo trovi in "profiles" table)
   - Salva

2. **Via SQL Editor:**
   ```sql
   -- Inserisci il tuo user_id qui
   INSERT INTO admin_users (user_id, permissions)
   VALUES ('TUO_USER_ID_QUI', ARRAY['manage_categories', 'view_analytics', 'manage_users']);
   ```

### Funzionalità del Pannello Admin

Il pannello admin ti permette di:

#### 1. Approvare Categorie Suggerite
- Gli utenti possono suggerire nuove categorie durante la creazione di richieste
- Le categorie appaiono nel pannello admin in "Categorie in Attesa"
- Puoi approvare (✓) o rifiutare (✗) ogni suggerimento
- Le categorie approvate diventano immediatamente disponibili per tutti

#### 2. Gestire Categorie Attive
- Vedere tutte le categorie con il numero di richieste
- Attivare/disattivare categorie
- Le categorie disattivate non appaiono nei form ma le richieste esistenti rimangono

#### 3. Monitorare Richieste Recenti
- Vista delle ultime 10 richieste
- Utile per la **validazione manuale** (Fase 5)
- Vedi titolo, categoria, località, budget e acquirente

#### 4. Statistiche Piattaforma
- Numero totale richieste
- Numero utenti registrati
- Categorie in attesa di approvazione

## Sistema Categorie Dinamiche (Fase 3)

### Come Funziona

1. **Utente crea richiesta:**
   - Sceglie tra categorie esistenti
   - Oppure clicca "Suggerisci nuova categoria"
   - Inserisce il nome della nuova categoria

2. **Categoria va in pending:**
   - La richiesta viene comunque pubblicata
   - La categoria personalizzata appare nella richiesta
   - Admin riceve notifica nel pannello

3. **Admin approva:**
   - Categoria diventa ufficiale
   - Appare nei dropdown di tutti gli utenti
   - Include contatore richieste

4. **Piattaforma cresce:**
   - Le categorie più usate appaiono in cima
   - Puoi creare campagne ADS per le nuove categorie popolari
   - Il sistema si adatta automaticamente al mercato

### Vantaggi

- **Zero manutenzione:** Gli utenti ti dicono cosa vogliono
- **Validazione di mercato:** Solo categorie con domanda reale vengono approvate
- **Scalabilità:** La piattaforma cresce senza intervento tecnico
- **Insight per ADS:** Scopri nuove nicchie profittevoli automaticamente

## Validazione Manuale (Fase 5)

### Processo Concierge

Nelle prime settimane, quando un acquirente pubblica una richiesta:

1. **Ricevi notifica** (puoi implementare email/webhook)
2. **Vedi richiesta nel pannello admin**
3. **Cerca manualmente:**
   - Chiama negozi nella zona dell'acquirente
   - Cerca su Google Maps
   - Contatta fornitori che conosci

4. **Pitch ai venditori:**
   ```
   "Ciao, sono di I-LOOK For. Ho un cliente a [CITTÀ] che cerca
   [PRODOTTO] con budget di €[BUDGET]. Ti interessa fare un'offerta?
   È gratis, ti bastano 2 minuti per registrarti."
   ```

5. **Registra feedback:**
   - Cosa cercano davvero gli acquirenti?
   - Quali categorie hanno più domanda?
   - Obiezioni comuni dei venditori?

### Da Manuale ad Automatico

Dopo 30-50 richieste manuali:
- Conosci i pattern di domanda
- Hai una base di venditori attivi
- Puoi lanciare campagne ADS mirate
- Il sistema diventa self-service

## Best Practices

### Per Acquirenti
- Titoli chiari e specifici
- Budget realistico (opzionale ma aumenta risposte)
- Descrizione dettagliata aumenta qualità offerte

### Per Venditori
- Rispondere entro 24h massimizza conversioni
- Personalizzare il messaggio dell'offerta
- Prezzo competitivo ma non sottocosto

### Per Admin
- Approvare categorie solo se hanno senso commerciale
- Raggruppare categorie simili quando possibile
- Monitorare quali categorie generano più conversioni
- Usare dati per ottimizzare campagne ADS

## Metriche da Monitorare

### Salute Piattaforma
- Richieste pubblicate/giorno
- Offerte inviate/richiesta (media)
- Tempo medio prima prima offerta
- Tasso conversione acquirente (pubblica → riceve offerte)
- Tasso conversione venditore (registrato → invia offerta)

### Per Campagne ADS
- CPL (Cost Per Lead) acquirenti
- CPL venditori
- LTV (Lifetime Value) venditori Pro/Enterprise
- CAC (Customer Acquisition Cost) vs LTV ratio
- ROAS (Return on Ad Spend)

## Prossimi Passi

1. **Setup iniziale:**
   - Configura te stesso come admin
   - Testa il flusso completo (buyer e seller)
   - Crea 5-10 richieste di test

2. **Prime campagne:**
   - Scegli 2-3 categorie per iniziare
   - Budget minimo: €5-10/giorno per categoria
   - Target geografico: tua città/regione

3. **Validazione:**
   - Gestisci prime 20 richieste manualmente
   - Raccogli feedback
   - Affina il copy delle ADS

4. **Scale:**
   - Aggiungi categorie profitable
   - Espandi geograficamente
   - Lancia piani a pagamento per venditori

## Supporto

Per domande o problemi:
- Controlla il pannello admin per errori
- Verifica Supabase logs per problemi tecnici
- Testa sempre su categorie di test prima di lanciare ADS
