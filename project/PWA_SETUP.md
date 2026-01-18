# Guida Configurazione PWA - MY TARGET

## Panoramica

Il progetto MY TARGET è stato configurato come Progressive Web App (PWA), permettendo agli utenti di installare l'app sulla schermata home del proprio telefono.

## Componenti Configurati

### 1. Manifest.json
- **File**: `public/manifest.json`
- **Contenuto**:
  - Nome app: "MY TARGET - Il Marketplace Invertito"
  - Short name: "MY TARGET"
  - Theme color: `#FF6B00` (brand orange)
  - Background color: `#0f172a` (slate-900)
  - Display mode: `standalone` (si comporta come app nativa)
  - Icone multiple per diversi dispositivi (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512)
  - Shortcuts (azioni rapide): "Nuova Ricerca", "Le Mie Offerte"

### 2. Service Worker
- **File**: `public/sw.js`
- **Funzionalità**:
  - Caching offline di asset statici
  - Supporto per Web Push Notifications
  - Cache runtime per risposte dinamiche
  - Gestione attivazione/installazione

### 3. HTML Meta Tags
- **File**: `index.html`
- **Aggiunti**:
  - Link al manifest.json
  - Meta tags per Apple iOS (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`)
  - Theme color meta tags
  - Open Graph e Twitter Card meta tags
  - Favicon e Apple touch icon

## Icone PWA Richieste

Per completare la configurazione PWA, è necessario creare le seguenti icone nella cartella `public/`:

### Icone Standard (obbligatorie)
- `icon-72x72.png` - 72x72 pixel
- `icon-96x96.png` - 96x96 pixel
- `icon-128x128.png` - 128x128 pixel
- `icon-144x144.png` - 144x144 pixel (Windows tiles)
- `icon-152x152.png` - 152x152 pixel (Apple iPad)
- `icon-192x192.png` - 192x192 pixel (Android home screen)
- `icon-384x384.png` - 384x384 pixel (Android splash)
- `icon-512x512.png` - 512x512 pixel (Android splash, Chrome install)

### Icone Opzionali (per screenshots)
- `screenshot-wide.png` - 1280x720 pixel (desktop screenshot)
- `screenshot-narrow.png` - 750x1334 pixel (mobile screenshot)

## Come Creare le Icone

### Opzione 1: Usando il Logo Esistente

Se hai già un logo (`logo.png`), puoi usare un tool online per generare tutte le dimensioni:

1. **PWA Asset Generator** (consigliato):
   - Vai su https://www.pwabuilder.com/imageGenerator
   - Carica il tuo `logo.png`
   - Scarica tutte le icone generate
   - Copia i file nella cartella `public/`

2. **RealFaviconGenerator**:
   - Vai su https://realfavicongenerator.net/
   - Carica il tuo logo
   - Configura le opzioni
   - Scarica e copia i file

3. **ImageMagick** (command line):
   ```bash
   # Se hai ImageMagick installato
   convert logo.png -resize 192x192 icon-192x192.png
   convert logo.png -resize 512x512 icon-512x512.png
   # ... ripeti per tutte le dimensioni
   ```

### Opzione 2: Creare Icone da Zero

Se non hai un logo, crea un'icona che rappresenti MY TARGET:
- Usa il colore brand `#FF6B00` (arancione)
- Design semplice e riconoscibile
- Testo "MY TARGET" o simbolo 🎯 (target)
- Formato PNG con sfondo trasparente o colorato

### Specifiche Icone

- **Formato**: PNG
- **Trasparenza**: Supportata (ma meglio con sfondo colorato per alcuni dispositivi)
- **Padding**: 10-20% intorno al contenuto (per maskable icons)
- **Colore**: Brand orange `#FF6B00` o combinazione con bianco/nero

## Test della PWA

### Chrome DevTools

1. Apri Chrome DevTools (F12)
2. Vai alla tab **Application**
3. Controlla:
   - **Manifest**: Verifica che il manifest sia caricato correttamente
   - **Service Workers**: Verifica che il service worker sia registrato e attivo
   - **Cache**: Verifica che le risorse siano cachate

### Lighthouse

1. Apri Chrome DevTools (F12)
2. Vai alla tab **Lighthouse**
3. Seleziona **Progressive Web App**
4. Esegui l'audit
5. Risolvi eventuali problemi segnalati

### Test Installazione

#### Android (Chrome)
1. Apri il sito su Chrome mobile
2. Tap sul menu (tre puntini)
3. Dovrebbe apparire **"Installa app"** o **"Aggiungi alla schermata home"**
4. Tap per installare

#### iOS (Safari)
1. Apri il sito su Safari mobile
2. Tap sul pulsante **Condividi** (box con freccia)
3. Tap su **"Aggiungi alla schermata Home"**
4. Conferma il nome e aggiungi

#### Desktop (Chrome/Edge)
1. Apri il sito su Chrome o Edge
2. Cerca l'icona di installazione nella barra degli indirizzi (o menu)
3. Clicca **"Installa"**
4. L'app si aprirà in una finestra standalone

## Registrazione Service Worker

Il service worker è già registrato in `src/utils/pushNotifications.ts` e `src/components/NotificationSystem.tsx`.

Se necessario, puoi verificare la registrazione nel browser:
```javascript
// Nella console del browser
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers registrati:', registrations);
});
```

## Troubleshooting

### Icone non visibili
- Verifica che i file esistano nella cartella `public/`
- Controlla che i path nel `manifest.json` siano corretti (`/icon-192x192.png`)
- Verifica che i file siano serviti correttamente (HTTP status 200)

### Manifest non caricato
- Verifica che `manifest.json` sia accessibile a `/manifest.json`
- Controlla la console del browser per errori
- Verifica il formato JSON del manifest (usare validatore JSON)

### Service Worker non funziona
- Verifica che il file `sw.js` sia accessibile a `/sw.js`
- Controlla che sia servito via HTTPS (richiesto per service workers in produzione)
- Verifica i log della console per errori

### Installazione non disponibile
- Verifica che il manifest sia valido
- Controlla che le icone 192x192 e 512x512 esistano
- Assicurati che il sito sia servito via HTTPS
- Verifica che il service worker sia registrato e attivo

## Funzionalità PWA Attive

✅ **Manifest configurato** - L'app può essere installata
✅ **Service Worker attivo** - Supporto offline e push notifications
✅ **Theme color** - Brand orange `#FF6B00`
✅ **Standalone mode** - L'app si comporta come nativa
✅ **Shortcuts** - Azioni rapide dalla home screen
✅ **Meta tags iOS** - Supporto per Apple devices
✅ **Cache offline** - Asset statici cachati per funzionamento offline

## Prossimi Passi

1. **Crea le icone PWA** (vedi sezione "Come Creare le Icone")
2. **Testa l'installazione** su diversi dispositivi
3. **Verifica Lighthouse** per eventuali miglioramenti
4. **Aggiungi screenshots** (opzionale) per migliorare l'esperienza di installazione

## Note

- Le icone devono essere in formato PNG
- Il service worker funziona solo su HTTPS (o localhost in sviluppo)
- La cache viene aggiornata automaticamente quando cambiano gli asset
- Gli utenti vedranno il banner di installazione automaticamente quando i requisiti PWA sono soddisfatti
