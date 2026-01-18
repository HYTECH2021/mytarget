import { ArrowLeft } from 'lucide-react';
import { Footer } from '../components/Footer';
import Logo from '../components/Logo';

export function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-200">
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span className="text-sm text-slate-600 font-medium">Torna alla home</span>
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <Logo size={64} showText={true} blackBg={false} />
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6 mb-4">
            Cookie Policy
          </h1>
          <p className="text-slate-600">Ultimo aggiornamento: Gennaio 2026</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">1. Cosa sono i Cookie</h2>
            <p className="text-slate-700 leading-relaxed">
              I cookie sono piccoli file di testo che vengono memorizzati sul dispositivo dell'utente (computer, tablet, smartphone) quando si visita un sito web. I cookie permettono al sito di riconoscere il dispositivo e memorizzare alcune informazioni sulle preferenze dell'utente o azioni passate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">2. Tipi di Cookie Utilizzati</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">2.1 Cookie Tecnici (Necessari)</h3>
                <p className="text-slate-700 leading-relaxed mb-2">
                  Questi cookie sono essenziali per il funzionamento del sito e non possono essere disattivati. Consentono:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                  <li>Autenticazione e gestione della sessione utente</li>
                  <li>Memorizzazione delle preferenze di accesso</li>
                  <li>Funzionalità di sicurezza</li>
                  <li>Funzionamento delle funzionalità base del servizio</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  <strong>Durata:</strong> Cookie di sessione (eliminati alla chiusura del browser) e cookie persistenti (fino a 12 mesi).
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">2.2 Cookie di Prestazioni e Analisi</h3>
                <p className="text-slate-700 leading-relaxed mb-2">
                  Questi cookie raccolgono informazioni su come gli utenti utilizzano il sito (pagine visitate, tempo di permanenza, errori) per migliorare le prestazioni del sito. Sono utilizzati in forma anonima e aggregata.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Durata:</strong> Fino a 24 mesi. Puoi disattivarli senza compromettere la funzionalità del sito.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">2.3 Cookie di Profilazione (Marketing)</h3>
                <p className="text-slate-700 leading-relaxed mb-2">
                  Questi cookie vengono utilizzati per creare profili degli utenti al fine di inviare messaggi pubblicitari in linea con le preferenze manifestate durante la navigazione. Richiedono il consenso esplicito dell'utente.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Durata:</strong> Fino a 12 mesi. Puoi revocare il consenso in qualsiasi momento.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">3. Cookie di Terze Parti</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Il sito può utilizzare servizi di terze parti che impostano cookie. Tali servizi includono:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li><strong>Supabase:</strong> Servizio di backend e autenticazione (cookie tecnici necessari)</li>
              <li><strong>Google Analytics:</strong> Analisi del traffico e comportamento utenti (richiede consenso)</li>
              <li><strong>Cookiebot o servizi simili:</strong> Gestione del consenso cookie (se implementato)</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              Per maggiori informazioni sui cookie di terze parti, consulta le rispettive privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">4. Gestione dei Cookie</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Puoi gestire le preferenze dei cookie in diversi modi:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">4.1 Tramite Impostazioni del Browser</h3>
                <p className="text-slate-700 leading-relaxed mb-2">
                  La maggior parte dei browser consente di:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                  <li>Visualizzare i cookie installati e cancellarli singolarmente</li>
                  <li>Bloccare i cookie di terze parti</li>
                  <li>Bloccare i cookie di tutti i siti</li>
                  <li>Cancellare tutti i cookie alla chiusura del browser</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3 text-sm">
                  <strong>Nota:</strong> La disattivazione dei cookie tecnici può compromettere il funzionamento del sito.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">4.2 Tramite Banner di Consenso</h3>
                <p className="text-slate-700 leading-relaxed">
                  Alla prima visita del sito, un banner informativo ti permetterà di accettare o rifiutare i cookie non tecnici. Puoi modificare le tue preferenze in qualsiasi momento accedendo alle impostazioni privacy.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">5. Consenso e Revoca</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Il consenso all'utilizzo dei cookie di profilazione e marketing è libero e facoltativo. Puoi:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>Esprimere il consenso tramite il banner informativo</li>
              <li>Modificare le preferenze in qualsiasi momento accedendo alle impostazioni</li>
              <li>Revocare il consenso senza pregiudicare la navigazione del sito</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">6. Durata dei Cookie</h2>
            <p className="text-slate-700 leading-relaxed">
              I cookie tecnici hanno durata variabile (sessione o fino a 12 mesi). I cookie di profilazione hanno durata massima di 12 mesi, salvo revoca del consenso da parte dell'utente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">7. Contatti</h2>
            <p className="text-slate-700 leading-relaxed">
              Per domande riguardanti l'utilizzo dei cookie, contattare il Titolare del trattamento:
            </p>
            <div className="mt-3 space-y-1 text-slate-700">
              <p><strong>Massimiliano Nicolai</strong></p>
              <p>Brescia (BS), Italia</p>
              <p>Email: <a href="mailto:info@mytarget.it" className="text-orange-600 hover:underline">info@mytarget.it</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">8. Aggiornamenti della Cookie Policy</h2>
            <p className="text-slate-700 leading-relaxed">
              Il Titolare si riserva il diritto di aggiornare la presente Cookie Policy in qualsiasi momento per riflettere modifiche nei servizi offerti o nella normativa. Le modifiche saranno pubblicate su questa pagina.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Per ulteriori informazioni, consulta la <a href="/privacy" className="text-orange-600 hover:underline">Privacy Policy</a> o contatta il Titolare all'indirizzo email: <a href="mailto:info@mytarget.it" className="text-orange-600 hover:underline">info@mytarget.it</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
