import { ArrowLeft } from 'lucide-react';
import { Footer } from '../components/Footer';
import Logo from '../components/Logo';

export function TerminiCondizioni() {
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
            Termini e Condizioni d'uso
          </h1>
          <p className="text-slate-600">Ultimo aggiornamento: Gennaio 2026</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">1. Accettazione dei Termini</h2>
            <p className="text-slate-700 leading-relaxed">
              L'accesso e l'utilizzo della piattaforma MY TARGET (di seguito "il Servizio") implica l'accettazione dei presenti Termini e Condizioni d'uso. Se non accetti questi termini, ti preghiamo di non utilizzare il Servizio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">2. Descrizione del Servizio</h2>
            <p className="text-slate-700 leading-relaxed">
              MY TARGET è una piattaforma digitale che mette in contatto buyer (cacciatori) e seller (business hunter) per facilitare lo scambio di richieste e offerte commerciali. Il servizio consente agli utenti di pubblicare richieste, inviare offerte e comunicare tramite chat integrata.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">3. Registrazione e Account</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Per utilizzare il Servizio è necessario:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>Creare un account con dati veritieri e completi</li>
              <li>Mantenere la riservatezza delle credenziali di accesso</li>
              <li>Essere maggiorenne o avere il consenso di un genitore/tutore</li>
              <li>Utilizzare il servizio in conformità con la legge</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">4. Obblighi degli Utenti</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Gli utenti si impegnano a:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>Pubblicare solo contenuti veritieri, leciti e pertinenti</li>
              <li>Non utilizzare il servizio per attività illegali o fraudolente</li>
              <li>Rispettare la privacy e i diritti degli altri utenti</li>
              <li>Non diffondere contenuti offensivi, discriminatori o inappropriati</li>
              <li>Non tentare di accedere a dati o sistemi non autorizzati</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">5. Limiti di Responsabilità</h2>
            <p className="text-slate-700 leading-relaxed">
              MY TARGET agisce come intermediario tra buyer e seller. La piattaforma non garantisce la qualità, la sicurezza o la legittimità delle transazioni effettuate tra gli utenti. Il Titolare non è responsabile per eventuali controversie, danni o perdite derivanti dall'utilizzo del Servizio o da transazioni tra utenti.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">6. Proprietà Intellettuale</h2>
            <p className="text-slate-700 leading-relaxed">
              Tutti i contenuti della piattaforma (testi, loghi, grafica, software) sono di proprietà di HYTECH srl e sono protetti da copyright e altre leggi sulla proprietà intellettuale. È vietata la riproduzione, la modifica o la distribuzione senza autorizzazione scritta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">7. Modifiche al Servizio</h2>
            <p className="text-slate-700 leading-relaxed">
              Il Titolare si riserva il diritto di modificare, sospendere o interrompere il Servizio in qualsiasi momento, con o senza preavviso, senza alcuna responsabilità verso gli utenti.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">8. Cancellazione dell'Account</h2>
            <p className="text-slate-700 leading-relaxed">
              L'utente può cancellare il proprio account in qualsiasi momento. Il Titolare può sospendere o cancellare account che violano i presenti Termini, senza preavviso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">9. Legge Applicabile e Foro Competente</h2>
            <p className="text-slate-700 leading-relaxed">
              I presenti Termini sono regolati dalla legge italiana. Per eventuali controversie è competente il foro di Brescia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">10. Modifiche ai Termini</h2>
            <p className="text-slate-700 leading-relaxed">
              Il Titolare si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Le modifiche saranno pubblicate su questa pagina e l'utilizzo continuato del Servizio implica l'accettazione dei nuovi Termini.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Per domande sui Termini e Condizioni, contattare: <a href="mailto:info@mytarget.it" className="text-orange-600 hover:underline">info@mytarget.it</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
