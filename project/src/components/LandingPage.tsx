import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Crosshair,
  Database,
  MapPin,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
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

const DATA_SIGNAL_LAYERS = [
  {
    title: 'Ricerche & intento',
    description: 'Keyword, bisogno, urgenza e motivazioni di acquisto',
    icon: Search,
    accent: 'text-orange-400',
    border: 'border-orange-500/30',
    glow: 'from-orange-600/20 to-orange-500/5',
  },
  {
    title: 'Budget reale',
    description: 'Range di spesa dichiarato e propensione alla qualità',
    icon: Wallet,
    accent: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'from-emerald-600/20 to-emerald-500/5',
  },
  {
    title: 'Regione & micro-area',
    description: 'Città, quartieri e segnali di prossimità',
    icon: MapPin,
    accent: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'from-blue-600/20 to-blue-500/5',
  },
  {
    title: 'Età & contesto',
    description: 'Fasce anagrafiche e stile di vita',
    icon: User,
    accent: 'text-purple-400',
    border: 'border-purple-500/30',
    glow: 'from-purple-600/20 to-purple-500/5',
  },
] as const;

const INSIGHT_PACKS = [
  {
    title: 'Heatmap domanda',
    description: 'Dove nasce la domanda, per zona e velocità di conversione',
    icon: BarChart3,
    accent: 'text-orange-400',
    border: 'border-orange-500/30',
    glow: 'from-orange-600/20 to-orange-500/5',
  },
  {
    title: 'Budget ladder',
    description: 'Distribuzione della spesa per categoria e sotto-cluster',
    icon: TrendingUp,
    accent: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'from-emerald-600/20 to-emerald-500/5',
  },
  {
    title: 'Cluster demografici',
    description: 'Età, interessi e comportamenti di acquisto emergenti',
    icon: Users,
    accent: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'from-blue-600/20 to-blue-500/5',
  },
] as const;

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
      output += `✨ Specifiche professionali generate:\n\n`;
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
    <div className="min-h-screen bg-[#0b1120] text-white">
      <nav className="border-b border-slate-800/60 bg-[#0b1120]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size={48} />
            <div>
              <span className="text-2xl font-black text-white tracking-tight italic">MY TARGET</span>
              <p className="text-xs text-orange-400 font-medium">Marketplace inverso, dati che valgono.</p>
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

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(56,189,248,0.12),transparent_40%)]" />
        <div className="absolute -top-32 right-10 w-[500px] h-[500px] bg-orange-500/10 blur-[140px] rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative">
          <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-12 items-center mb-16">
            <div>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-600/10 border border-orange-600/30 backdrop-blur-sm mb-8">
                <Logo size={16} />
                <span className="text-xs text-orange-300 font-bold tracking-[0.2em]">MARKETPLACE INVERSO</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight">
                Dal desiderio nasce il dato.
                <br />
                <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Dal dato nasce il valore.
                </span>
              </h1>
              <p className="text-xl text-slate-300 mb-6 max-w-2xl leading-relaxed">
                Raccogliamo ricerche, budget, regione ed età per trasformare ogni richiesta in
                insight vendibili ai seller. Tu pubblichi, il mercato compete.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                {DATA_SIGNAL_LAYERS.map((layer) => {
                  const Icon = layer.icon;
                  return (
                    <div
                      key={layer.title}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800 text-sm text-slate-200"
                    >
                      <Icon className={`w-4 h-4 ${layer.accent}`} />
                      {layer.title}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onGetStarted('buyer')}
                  className="group relative px-10 py-5 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black text-lg transition-all shadow-2xl shadow-orange-600/40 hover:shadow-orange-600/60 hover:scale-[1.02] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-3">
                    <Logo size={22} />
                    Punta il tuo target
                  </span>
                </button>
                <button
                  onClick={() => onGetStarted('seller')}
                  className="group relative px-10 py-5 rounded-3xl bg-slate-900/60 border-2 border-orange-600/30 text-white font-black text-lg transition-all hover:bg-slate-800 hover:border-orange-600/50"
                >
                  <span className="relative flex items-center gap-3">
                    <Crosshair className="w-5 h-5 text-orange-400" />
                    Accedi come seller
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mt-8 text-xs">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/70 border border-slate-800 text-slate-300">
                  <Shield className="w-4 h-4 text-orange-400" />
                  Dati anonimizzati e aggregati
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/70 border border-slate-800 text-slate-300">
                  <Database className="w-4 h-4 text-orange-400" />
                  Insight pronti per il team sales
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-transparent blur-3xl rounded-[40px]" />
              <div className="relative bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.12),transparent_55%)]" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-600/20 flex items-center justify-center border border-orange-500/30">
                        <Database className="w-6 h-6 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs text-orange-300 font-bold tracking-widest">DATA ENGINE</p>
                        <p className="text-lg font-black text-white">Profilo buyer vivo</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">LIVE</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <Search className="w-4 h-4 text-orange-400" />
                        Ricerca: "SUV elettrico familiare"
                      </div>
                      <span className="text-xs font-semibold text-orange-300">Intento alto</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        Budget: €28k - €35k
                      </div>
                      <span className="text-xs font-semibold text-emerald-300">Alta conversione</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        Regione: Lombardia → Milano
                      </div>
                      <span className="text-xs font-semibold text-blue-300">Domanda in crescita</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <User className="w-4 h-4 text-purple-400" />
                        Età: 28-34
                      </div>
                      <span className="text-xs font-semibold text-purple-300">Cluster premium</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-xs text-slate-500">Propensione spesa</p>
                      <p className="text-lg font-bold text-white">89%</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-xs text-slate-500">Tempo decisione</p>
                      <p className="text-lg font-bold text-white">9 giorni</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-xs text-slate-500">Ricerche affini</p>
                      <p className="text-lg font-bold text-white">+42%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-8 mb-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent blur-2xl rounded-[40px]" />
              <div className="relative bg-slate-900/60 backdrop-blur-xl border border-orange-600/20 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Target Generator</h3>
                    <p className="text-xs text-slate-400">Trasforma il desiderio in un dataset pronto per i seller</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-6">
                  Più dettagli inserisci, più precisi saranno i segnali di mercato che generiamo.
                </p>

                <div className="space-y-4">
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Es: 'Vorrei cambiare l'arredamento del mio ufficio...'"
                    className="w-full px-6 py-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors resize-none h-24"
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
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
              <div className="absolute -top-20 right-0 w-56 h-56 bg-orange-600/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-orange-600/20 flex items-center justify-center border border-orange-500/30">
                    <BarChart3 className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-orange-300 font-bold tracking-widest">INSIGHT PREVIEW</p>
                    <h3 className="text-xl font-black text-white">Segnali pronti per i seller</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-200">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Crescita categoria "Mobilità elettrica"
                    </div>
                    <span className="text-xs font-semibold text-emerald-300">+38%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-200">
                      <Zap className="w-4 h-4 text-orange-400" />
                      Picco ricerche negli ultimi 7 giorni
                    </div>
                    <span className="text-xs font-semibold text-orange-300">Top 3</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-200">
                      <Users className="w-4 h-4 text-blue-400" />
                      Fascia 25-34 con conversione più alta
                    </div>
                    <span className="text-xs font-semibold text-blue-300">Cluster premium</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs text-slate-500">Budget medio</p>
                    <p className="text-lg font-bold text-white">€3.8k</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs text-slate-500">Regioni attive</p>
                    <p className="text-lg font-bold text-white">12</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs text-slate-500">Intento caldo</p>
                    <p className="text-lg font-bold text-white">67%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-slate-300 mb-4">
              <Database className="w-4 h-4 text-orange-400" />
              Quattro strati di dati granulari
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">La materia prima che monetizzi</h2>
            <p className="text-slate-400 max-w-3xl mx-auto">
              Ogni buyer arricchisce il tuo marketplace con segnali proprietari pronti per la vendita.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {DATA_SIGNAL_LAYERS.map((layer) => {
              const Icon = layer.icon;
              return (
                <div
                  key={layer.title}
                  className={`group relative overflow-hidden rounded-3xl border ${layer.border} bg-gradient-to-br ${layer.glow} p-6`}
                >
                  <div className="absolute inset-0 bg-slate-950/70 opacity-80 group-hover:opacity-60 transition-opacity" />
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl border ${layer.border} bg-slate-950/60 flex items-center justify-center mb-5`}>
                      <Icon className={`w-6 h-6 ${layer.accent}`} />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">{layer.title}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{layer.description}</p>
                    <div className={`mt-4 inline-flex items-center gap-2 text-xs font-semibold ${layer.accent}`}>
                      Segnale proprietario
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600/10 border border-orange-600/30 text-xs text-orange-300 mb-4">
              <TrendingUp className="w-4 h-4" />
              Intelligence vendibile
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Insight che i seller non trovano altrove</h2>
            <p className="text-slate-400 max-w-3xl mx-auto">
              Trasforma la domanda latente in vantaggio competitivo: dati unici, aggiornati e pronti per l'azione.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-20">
            {INSIGHT_PACKS.map((pack) => {
              const Icon = pack.icon;
              return (
                <div
                  key={pack.title}
                  className={`group relative overflow-hidden rounded-3xl border ${pack.border} bg-gradient-to-br ${pack.glow} p-7`}
                >
                  <div className="absolute inset-0 bg-slate-950/70 opacity-80 group-hover:opacity-60 transition-opacity" />
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl border ${pack.border} bg-slate-950/60 flex items-center justify-center mb-5`}>
                      <Icon className={`w-6 h-6 ${pack.accent}`} />
                    </div>
                    <h3 className="text-xl font-black text-white mb-3">{pack.title}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6">{pack.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Aggiornamento live</span>
                      <span className={`font-semibold ${pack.accent}`}>Premium</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-transparent p-12 md:p-16 rounded-3xl border border-orange-600/30 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjAuNSIgY3g9IjMwIiBjeT0iMzAiIHI9IjE1Ii8+PC9nPjwvc3ZnPg==')] opacity-20" />
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <Logo size={80} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Trasforma la domanda in revenue.
              </h2>
              <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Ogni richiesta buyer diventa un insight vendibile. Ogni insight sposta il vantaggio competitivo a tuo favore.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => onGetStarted('buyer')}
                  className="px-12 py-5 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black text-lg hover:from-orange-500 hover:to-orange-400 transition-all shadow-2xl shadow-orange-600/40 hover:scale-105"
                >
                  Pubblica un target
                </button>
                <button
                  onClick={() => onGetStarted('seller')}
                  className="px-12 py-5 rounded-3xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white font-black text-lg hover:bg-white/20 transition-all"
                >
                  Vendi con insight
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
