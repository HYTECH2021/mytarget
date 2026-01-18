import { ArrowLeft } from 'lucide-react';
import { Footer } from '../components/Footer';
import Logo from '../components/Logo';

export function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-slate-600">Ultimo aggiornamento: Gennaio 2026</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">1. Titolare del Trattamento</h2>
            <div className="space-y-2 text-slate-700 leading-relaxed">
              <p><strong>Titolare del trattamento:</strong> Massimiliano Nicolai</p>
              <p><strong>Indirizzo:</strong> Brescia (BS), Italia</p>
              <p><strong>Email:</strong> info@mytarget.it</p>
              <p><strong>P.IVA/CF:</strong> [Inserire P.IVA o Codice Fiscale se disponibile]</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">2. Dati Personali Trattati</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Il Titolare tratta i seguenti dati personali raccolti direttamente dagli utenti:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>Nome e cognome</li>
              <li>Indirizzo email</li>
              <li>Città e località</li>
              <li>Informazioni relative alle richieste/offerte pubblicate sulla piattaforma</li>
              <li>Dati di navigazione e utilizzo del servizio</li>
              <li>Dati tecnici (indirizzo IP, tipo di browser, sistema operativo)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">3. Finalità del Trattamento</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              I dati personali sono trattati per le seguenti finalità:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li><strong>Erogazione del servizio:</strong> gestione dell'account, pubblicazione di richieste/offerte, comunicazione tra buyer e seller</li>
              <li><strong>Adempimenti contrattuali:</strong> esecuzione del contratto di servizio stipulato con l'utente</li>
              <li><strong>Comunicazioni di servizio:</strong> notifiche relative al servizio, risposte alle richieste di supporto</li>
              <li><strong>Miglioramento del servizio:</strong> analisi dell'utilizzo della piattaforma per migliorare l'esperienza utente</li>
              <li><strong>Obblighi di legge:</strong> adempimento di obblighi previsti dalla normativa vigente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">4. Base Giuridica del Trattamento</h2>
            <p className="text-slate-700 leading-relaxed">
              Il trattamento dei dati personali si basa su:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mt-3">
              <li><strong>Consenso dell'interessato</strong> (art. 6, comma 1, lett. a GDPR) - per finalità di marketing e profilazione</li>
              <li><strong>Esecuzione di un contratto</strong> (art. 6, comma 1, lett. b GDPR) - per l'erogazione del servizio richiesto</li>
              <li><strong>Legittimo interesse del Titolare</strong> (art. 6, comma 1, lett. f GDPR) - per migliorare il servizio e prevenire frodi</li>
              <li><strong>Obbligo di legge</strong> (art. 6, comma 1, lett. c GDPR) - per adempimenti normativi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">5. Modalità del Trattamento</h2>
            <p className="text-slate-700 leading-relaxed">
              Il trattamento dei dati viene effettuato mediante strumenti informatici e telematici, con logiche organizzative e modalità strettamente correlate alle finalità indicate. I dati sono trattati da personale autorizzato e/o da incaricati esterni debitamente nominati.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">6. Conservazione dei Dati</h2>
            <p className="text-slate-700 leading-relaxed">
              I dati personali sono conservati per il tempo necessario al perseguimento delle finalità per cui sono stati raccolti e, in ogni caso, per il periodo previsto dalla normativa vigente. I dati relativi all'account utente sono conservati fino alla cancellazione dell'account da parte dell'utente o per il tempo necessario agli obblighi di legge.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">7. Diritti dell'Interessato</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Ai sensi del GDPR, l'interessato ha diritto di:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li><strong>Accesso</strong> (art. 15 GDPR) - ottenere conferma dell'esistenza dei propri dati e accedervi</li>
              <li><strong>Rettifica</strong> (art. 16 GDPR) - ottenere la correzione di dati inesatti o incompleti</li>
              <li><strong>Cancellazione</strong> (art. 17 GDPR) - ottenere la cancellazione dei propri dati ("diritto all'oblio")</li>
              <li><strong>Limitazione</strong> (art. 18 GDPR) - ottenere la limitazione del trattamento in determinate circostanze</li>
              <li><strong>Portabilità</strong> (art. 20 GDPR) - ricevere i propri dati in formato strutturato e trasferirli ad altro titolare</li>
              <li><strong>Opposizione</strong> (art. 21 GDPR) - opporsi al trattamento per motivi legittimi</li>
              <li><strong>Revoca del consenso</strong> - revocare il consenso in qualsiasi momento senza pregiudicare la liceità del trattamento basato sul consenso prestato prima della revoca</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              Per esercitare i propri diritti, l'interessato può contattare il Titolare all'indirizzo email: <a href="mailto:info@mytarget.it" className="text-orange-600 hover:underline font-semibold">info@mytarget.it</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">8. Comunicazione e Diffusione dei Dati</h2>
            <p className="text-slate-700 leading-relaxed">
              I dati personali non vengono diffusi. Possono essere comunicati a soggetti terzi solo per l'esecuzione del servizio (es. provider di hosting, servizi di pagamento) e nel rispetto delle garanzie previste dalla legge. I dati non vengono trasferiti al di fuori dell'Unione Europea, salvo in presenza di garanzie adeguate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">9. Diritto di Reclamo</h2>
            <p className="text-slate-700 leading-relaxed">
              L'interessato ha il diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it) qualora ritenga che il trattamento dei propri dati personali violi il Regolamento (UE) 2016/679.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">10. Modifiche alla Privacy Policy</h2>
            <p className="text-slate-700 leading-relaxed">
              Il Titolare si riserva il diritto di modificare la presente Privacy Policy in qualsiasi momento. Le modifiche saranno pubblicate su questa pagina con indicazione della data di ultimo aggiornamento.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Per ulteriori informazioni sul trattamento dei dati personali, contattare il Titolare all'indirizzo email: <a href="mailto:info@mytarget.it" className="text-orange-600 hover:underline">info@mytarget.it</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
