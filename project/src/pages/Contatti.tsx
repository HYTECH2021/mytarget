import { ArrowLeft, Mail, MapPin } from 'lucide-react';
import { Footer } from '../components/Footer';
import Logo from '../components/Logo';

export function Contatti() {
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
            Contatti
          </h1>
          <p className="text-slate-600">Hai bisogno di assistenza? Siamo qui per aiutarti</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6">Informazioni di Contatto</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Indirizzo</h3>
                  <p className="text-slate-700">Brescia (BS), Italia</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Email</h3>
                  <p className="text-slate-700">
                    <a href="mailto:info@mytarget.it" className="text-orange-600 hover:underline font-semibold">
                      info@mytarget.it
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Titolare del Trattamento</h2>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <p className="text-slate-700 mb-2"><strong>Titolare:</strong> Massimiliano Nicolai</p>
              <p className="text-slate-700 mb-2"><strong>Sede:</strong> Brescia (BS), Italia</p>
              <p className="text-slate-700"><strong>Email:</strong> <a href="mailto:info@mytarget.it" className="text-orange-600 hover:underline">info@mytarget.it</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Supporto e Assistenza</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Per assistenza tecnica, domande sul servizio o richieste di supporto, puoi utilizzare:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li><strong>Chat di Supporto:</strong> Utilizza il widget di assistenza integrato nella piattaforma</li>
              <li><strong>Email:</strong> Invia una richiesta all'indirizzo <a href="mailto:info@mytarget.it" className="text-orange-600 hover:underline">info@mytarget.it</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Tempi di Risposta</h2>
            <p className="text-slate-700 leading-relaxed">
              Ci impegniamo a rispondere a tutte le richieste entro 48 ore lavorative. Per questioni urgenti, indicare "URGENTE" nell'oggetto dell'email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Privacy e Dati Personali</h2>
            <p className="text-slate-700 leading-relaxed">
              Per questioni relative al trattamento dei dati personali o per esercitare i tuoi diritti (accesso, rettifica, cancellazione), consulta la <a href="/privacy" className="text-orange-600 hover:underline font-semibold">Privacy Policy</a> o contattaci direttamente.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
