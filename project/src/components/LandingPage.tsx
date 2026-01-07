import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, TrendingUp, Sparkles, Zap, Users, BarChart3 } from 'lucide-react';
import { Logo } from './Logo';
import { Footer } from './Footer';

interface LandingPageProps {
  onGetStarted: (role: 'buyer' | 'seller') => void;
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

export function LandingPage({ onGetStarted }: LandingPageProps) {
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
    <div className="min-h-screen bg-[#0f172a]">
      <nav className="border-b border-slate-800/50 bg-[#0f172a]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size={48} />
            <div>
              <span className="text-2xl font-black text-white tracking-tight italic">MY TARGET</span>
              <p className="text-xs text-orange-500 font-medium">Smetti di cercare. Fatti trovare.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => onGetStarted('buyer')}
              className="px-8 py-3 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30"
            >
              Accedi
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-600/10 border border-orange-600/30 backdrop-blur-sm mb-8">
            <Logo size={16} />
            <span className="text-sm text-orange-400 font-bold tracking-wide">IL MARKETPLACE INVERTITO</span>
          </div>

          <h1 className="text-7xl md:text-9xl font-black text-white mb-6 leading-none tracking-tighter">
            PUNTA.
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              ACQUISISCI.
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-slate-300 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
            Smetti di cercare. <span className="text-orange-500 font-bold">Fatti trovare.</span>
          </p>
          <p className="text-lg text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed">
            Da preda a cacciatore: pubblica il tuo obiettivo e lascia che le aziende competano per te. Precisione millimetrica. Risultati garantiti.
          </p>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-orange-600/20 rounded-3xl p-8 mb-12 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-orange-500" />
              <h3 className="text-xl font-bold text-white">AI Target Generator</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">Trasforma un desiderio vago in una specifica professionale con l'AI</p>

            <div className="space-y-4">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Es: 'Vorrei cambiare l'arredamento del mio ufficio...'"
                className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors resize-none h-24"
              />
              <button
                onClick={handleAIRefine}
                disabled={isRefining || !aiInput.trim()}
                className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRefining ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Raffinamento AI in corso...
                  </>
                ) : (
                  <>
                    <Crosshair className="w-5 h-5" />
                    Raffina con AI
                  </>
                )}
              </button>

              <AnimatePresence>
                {isRefining && refineStage > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 space-y-2"
                  >
                    {[
                      { stage: 1, text: '🔍 Analisi semantica in corso...' },
                      { stage: 2, text: '🎯 Identificazione categoria...' },
                      { stage: 3, text: '💰 Calcolo budget ottimale...' },
                      { stage: 4, text: '⚡ Generazione specifiche...' },
                      { stage: 5, text: '✨ Finalizzazione target...' }
                    ].map(({ stage, text }) => (
                      <motion.div
                        key={stage}
                        initial={{ opacity: 0, x: -20 }}
                        animate={refineStage >= stage ? { opacity: 1, x: 0 } : {}}
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
                          refineStage >= stage
                            ? 'bg-orange-600/20 border border-orange-600/30'
                            : 'bg-slate-800/30 border border-slate-700/30'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          refineStage >= stage ? 'bg-orange-500 animate-pulse' : 'bg-slate-600'
                        }`} />
                        <span className={`text-sm font-medium ${
                          refineStage >= stage ? 'text-orange-300' : 'text-slate-500'
                        }`}>
                          {text}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {aiOutput && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-6 p-8 bg-gradient-to-br from-orange-600/20 to-orange-500/10 border-2 border-orange-600/40 rounded-3xl relative overflow-hidden"
                  >
                    <motion.div
                      animate={{
                        background: [
                          'radial-gradient(circle at 0% 0%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
                          'radial-gradient(circle at 100% 100%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
                          'radial-gradient(circle at 0% 0%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)'
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 pointer-events-none"
                    />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-600/30 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-orange-500" />
                        </div>
                        <span className="text-xs font-black text-orange-400 tracking-wide">GENERATO DA AI</span>
                      </div>
                      <pre className="text-sm text-slate-100 whitespace-pre-wrap font-mono leading-relaxed">{aiOutput}</pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => onGetStarted('buyer')}
              className="group relative px-12 py-6 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black text-xl transition-all shadow-2xl shadow-orange-600/40 hover:shadow-orange-600/60 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center gap-3">
                <Logo size={24} />
                Punta il Tuo Target
              </span>
            </button>
            <button
              onClick={() => onGetStarted('seller')}
              className="group relative px-12 py-6 rounded-3xl bg-slate-800 border-2 border-orange-600/30 text-white font-black text-xl transition-all hover:bg-slate-700 hover:border-orange-600/50 overflow-hidden"
            >
              <span className="relative flex items-center gap-3">
                <Crosshair className="w-6 h-6 text-orange-500" />
                Trova Target
              </span>
            </button>
          </div>

          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-orange-600/20 to-orange-500/10 border border-orange-600/30">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-slate-300 font-semibold">Per Business: Prevedi la domanda prima che diventi ricerca</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20 relative z-10">
          <div className="group bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-orange-600/50 transition-all hover:bg-slate-900/70">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-600/20 to-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Logo size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">
              Punta il Target
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Da preda a cacciatore. Pubblica il tuo obiettivo e lascia che le aziende competano per servirti con precisione millimetrica.
            </p>
          </div>

          <div className="group bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-orange-600/50 transition-all hover:bg-slate-900/70">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-600/20 to-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Crosshair className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">
              Acquisizione Intelligente
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Per Business: trova lead caldi prima della concorrenza. Prevedi la domanda e colpisci al momento giusto.
            </p>
          </div>

          <div className="group bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-orange-600/50 transition-all hover:bg-slate-900/70">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-600/20 to-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">
              Velocità Estrema
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Zero ricerche infinite. Massima efficienza. Risultati in tempo reale. Il futuro del marketplace è qui.
            </p>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-transparent p-16 rounded-3xl border border-orange-600/30 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjAuNSIgY3g9IjMwIiBjeT0iMzAiIHI9IjE1Ii8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-6">
              <Logo size={80} />
            </div>
            <h2 className="text-5xl font-black text-white mb-6 leading-tight">
              Da preda a cacciatore.<br />Inizia oggi.
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Unisciti alla rivoluzione del marketplace invertito. Precisione. Velocità. Risultati.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onGetStarted('buyer')}
                className="px-12 py-5 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black text-xl hover:from-orange-500 hover:to-orange-400 transition-all shadow-2xl shadow-orange-600/40 hover:scale-105"
              >
                Inizia Gratis
              </button>
              <button
                onClick={() => onGetStarted('seller')}
                className="px-12 py-5 rounded-3xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white font-black text-xl hover:bg-white/20 transition-all"
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
