import { useState, useEffect } from 'react';
import { Crosshair, TrendingUp, Sparkles, Zap, Users, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import { Footer } from './Footer';
import { LanguageSelector } from './LanguageSelector';

interface LandingPageProps {
  onGetStarted: (role: 'buyer' | 'seller') => void;
  onGuestMode?: (role: 'buyer' | 'seller') => void;
}

const AI_REFINEMENT_TEMPLATES: Record<string, any> = {
  'arredamento': {
    category: 'Arredamento & Design',
    budget: '€3.000 - €8.000',
    timeline: '2-4 settimane',
    specs: ['Consulenza designer professionista', 'Render 3D degli spazi', 'Selezione materiali premium', 'Installazione e montaggio inclusi']
  },
  'auto': {
    category: 'Automotive',
    budget: '€15.000 - €35.000',
    timeline: '1-2 mesi',
    specs: ['Test drive personalizzato', 'Finanziamento agevolato', 'Garanzia estesa', 'Manutenzione primo anno inclusa']
  },
  'tech': {
    category: 'Tecnologia & Software',
    budget: '€500 - €5.000',
    timeline: '1-3 settimane',
    specs: ['Setup e configurazione', 'Training personalizzato', 'Supporto tecnico 24/7', 'Aggiornamenti inclusi']
  },
  'default': {
    category: 'Servizi Professionali',
    budget: '€1.000 - €5.000',
    timeline: '2-6 settimane',
    specs: ['Consulenza iniziale gratuita', 'Preventivo dettagliato', 'Garanzia soddisfazione', 'Assistenza post-vendita']
  }
};

export function LandingPage({ onGetStarted, onGuestMode }: LandingPageProps) {
  const { t } = useTranslation();
  const [aiInput, setAiInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineStage, setRefineStage] = useState(0);

  useEffect(() => {
    if (refineStage > 0 && refineStage <= 5) {
      const timer = setTimeout(() => {
        setRefineStage(refineStage + 1);
      }, 600);
      return () => clearTimeout(timer);
    } else if (refineStage > 5) {
      setIsRefining(false);
      setRefineStage(0);
    }
  }, [refineStage]);

  const handleAIRefine = () => {
    if (!aiInput.trim()) return;

    setIsRefining(true);
    setAiOutput('');
    setRefineStage(1);

    const input = aiInput.toLowerCase();
    let template = AI_REFINEMENT_TEMPLATES.default;

    if (input.includes('arredamento') || input.includes('mobili') || input.includes('ufficio')) {
      template = AI_REFINEMENT_TEMPLATES.arredamento;
    } else if (input.includes('auto') || input.includes('macchina') || input.includes('veicolo')) {
      template = AI_REFINEMENT_TEMPLATES.auto;
    } else if (input.includes('software') || input.includes('app') || input.includes('tech')) {
      template = AI_REFINEMENT_TEMPLATES.tech;
    }

    setTimeout(() => {
      let output = `🎯 TARGET RAFFINATO\n\n`;
      output += `📝 Richiesta originale:\n"${aiInput}"\n\n`;
      output += `✨ Specifi che professionali generate:\n\n`;
      output += `📦 Categoria: ${template.category}\n`;
      output += `💰 Budget suggerito: ${template.budget}\n`;
      output += `⏱️ Tempistica: ${template.timeline}\n\n`;
      output += `🎁 Specifiche consigliate:\n`;
      template.specs.forEach((spec: string, i: number) => {
        output += `  ${i + 1}. ${spec}\n`;
      });
      output += `\n✅ Il tuo target è pronto per acquisire le migliori offerte!`;

      setAiOutput(output);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo size={48} showText={true} blackBg={false} />
          <div className="flex gap-4 items-center">
            <LanguageSelector />
            <button
              onClick={() => onGetStarted('buyer')}
              className="px-8 py-3 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 hover:scale-105 active:scale-95"
            >
              {t('accedi')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-600/5 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-50 border border-orange-200 backdrop-blur-sm mb-8">
            <Logo size={16} showText={false} />
            <span className="text-sm text-orange-600 font-bold tracking-wide">IL MARKETPLACE INVERTITO</span>
          </div>

          <h1 className="text-7xl md:text-9xl font-black text-slate-900 mb-6 leading-none tracking-tighter">
            {t('heroTitle').split(' ')[0]}.
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent">
              {t('heroTitle').split(' ')[1]}.
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-slate-600 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
            {t('heroSubtitle').split('. ')[0]}. <span className="text-orange-600 font-bold">{t('heroSubtitle').split('. ')[1]}.</span>
          </p>
          <p className="text-lg text-slate-500 mb-16 max-w-3xl mx-auto leading-relaxed">
            Da preda a cacciatore: pubblica il tuo obiettivo e lascia che le aziende competano per te. Precisione millimetrica. Risultati garantiti.
          </p>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-12 max-w-3xl mx-auto shadow-xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-slate-900">AI Target Generator</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">Trasforma un desiderio vago in una specifica professionale con l'AI</p>

            <div className="space-y-4">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Es: 'Vorrei cambiare l'arredamento del mio ufficio...'"
                className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none h-24"
              />
              <button
                onClick={handleAIRefine}
                disabled={isRefining || !aiInput.trim()}
                className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRefining ? (
                  <>
                    <div className="animate-spin">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    Raffinamento AI in corso...
                  </>
                ) : (
                  <>
                    <Crosshair className="w-5 h-5" />
                    Raffina con AI
                  </>
                )}
              </button>

              {isRefining && refineStage > 0 && (
                <div className="mt-4 space-y-2 transition-all duration-300">
                  {[
                    { stage: 1, text: '🔍 Analisi semantica in corso...' },
                    { stage: 2, text: '🎯 Identificazione categoria...' },
                    { stage: 3, text: '💰 Calcolo budget ottimale...' },
                    { stage: 4, text: '⚡ Generazione specifiche...' },
                    { stage: 5, text: '✨ Finalizzazione target...' }
                  ].map(({ stage, text }) => (
                    <div
                      key={stage}
                      className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 ${
                        refineStage >= stage
                          ? 'bg-orange-50 border border-orange-200 opacity-100 translate-x-0'
                          : 'bg-gray-100 border border-gray-200 opacity-50 -translate-x-2'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        refineStage >= stage ? 'bg-orange-600 animate-pulse' : 'bg-slate-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        refineStage >= stage ? 'text-orange-700' : 'text-slate-500'
                      }`}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {aiOutput && (
                <div className="mt-6 p-8 bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-300 rounded-3xl relative overflow-hidden shadow-lg transition-all duration-500">
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-orange-500/5 to-transparent opacity-50 animate-pulse" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-xs font-black text-orange-700 tracking-wide">GENERATO DA AI</span>
                      </div>
                      <pre className="text-sm text-slate-900 whitespace-pre-wrap font-mono leading-relaxed">{aiOutput}</pre>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="flex flex-col gap-6 justify-center items-center mb-12 transition-all duration-500">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => onGetStarted('buyer')}
                className="group relative px-12 py-6 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black text-xl transition-all shadow-2xl shadow-orange-600/40 hover:shadow-orange-600/60 hover:scale-105 hover:-translate-y-1 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center gap-3">
                  <Logo size={24} showText={false} />
                  Punta il Tuo Target
                </span>
              </button>
              <button
                onClick={() => onGetStarted('seller')}
                className="group relative px-12 py-6 rounded-3xl bg-white border-2 border-orange-300 text-slate-900 font-black text-xl transition-all hover:bg-orange-50 hover:border-orange-400 hover:scale-105 hover:-translate-y-1 active:scale-95 overflow-hidden shadow-lg"
              >
                <span className="relative flex items-center gap-3">
                  <Crosshair className="w-6 h-6 text-orange-600" />
                  Trova Target
                </span>
              </button>
            </div>
            {onGuestMode && (
              <div className="flex flex-col sm:flex-row gap-3 items-center text-sm transition-all duration-500">
                <span className="text-slate-500">Oppure esplora senza registrarti:</span>
                <button
                  onClick={() => onGuestMode('buyer')}
                  className="text-orange-600 hover:text-orange-700 font-semibold underline underline-offset-4"
                >
                  Vedi le ricerche
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => onGuestMode('seller')}
                  className="text-orange-600 hover:text-orange-700 font-semibold underline underline-offset-4"
                >
                  Vedi le offerte
                </button>
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-orange-50 border border-orange-200 transition-all duration-500">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-slate-700 font-semibold">Per Business: Prevedi la domanda prima che diventi ricerca</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20 relative z-10">
          {[
            {
              icon: <Logo size={32} showText={false} />,
              title: "Punta il Target",
              description: "Da preda a cacciatore. Pubblica il tuo obiettivo e lascia che le aziende competano per servirti con precisione millimetrica.",
              delay: 1.2
            },
            {
              icon: <Crosshair className="w-8 h-8 text-orange-600" />,
              title: "Acquisizione Intelligente",
              description: "Per Business: trova lead caldi prima della concorrenza. Prevedi la domanda e colpisci al momento giusto.",
              delay: 1.3
            },
            {
              icon: <Zap className="w-8 h-8 text-orange-600" />,
              title: "Velocità Estrema",
              description: "Zero ricerche infinite. Massima efficienza. Risultati in tempo reale. Il futuro del marketplace è qui.",
              delay: 1.4
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-orange-300 transition-all hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] shadow-lg duration-300"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-orange-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="relative bg-gradient-to-br from-orange-100 via-orange-50 to-white p-16 rounded-3xl border-2 border-orange-200 text-center overflow-hidden shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjAuNSIgY3g9IjMwIiBjeT0iMzAiIHI9IjE1Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-6">
              <Logo size={80} showText={false} />
            </div>
            <h2 className="text-5xl font-black text-slate-900 mb-6 leading-tight">
              Da preda a cacciatore.<br />Inizia oggi.
            </h2>
            <p className="text-xl text-slate-700 mb-10 max-w-2xl mx-auto leading-relaxed">
              Unisciti alla rivoluzione del marketplace invertito. Precisione. Velocità. Risultati.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onGetStarted('buyer')}
                className="px-12 py-5 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black text-xl hover:from-orange-500 hover:to-orange-400 transition-all shadow-2xl shadow-orange-600/40 hover:scale-105 active:scale-95"
              >
                Inizia Gratis
              </button>
              <button
                onClick={() => onGetStarted('seller')}
                className="px-12 py-5 rounded-3xl bg-white border-2 border-orange-300 text-slate-900 font-black text-xl hover:bg-orange-50 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                Business? Scopri di più
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
