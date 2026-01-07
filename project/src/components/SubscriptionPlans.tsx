import { Check, Sparkles } from 'lucide-react';
import type { SubscriptionPlan } from '../lib/types';

interface SubscriptionPlansProps {
  currentPlan: SubscriptionPlan;
  onUpgrade: () => void;
}

const plans = [
  {
    name: 'free',
    displayName: 'Free',
    price: '0',
    description: 'Perfetto per iniziare',
    features: [
      'Visualizza fino a 10 richieste al giorno',
      'Invia fino a 3 offerte al giorno',
      'Supporto via email',
      'Profilo base',
    ],
    color: 'slate',
  },
  {
    name: 'pro',
    displayName: 'Pro',
    price: '49',
    description: 'Per aziende in crescita',
    features: [
      'Richieste illimitate',
      'Offerte illimitate',
      'Priorità nei risultati di ricerca',
      'Badge "Business Verificato"',
      'Statistiche avanzate',
      'Supporto prioritario',
    ],
    color: 'orange',
    popular: true,
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: '199',
    description: 'Per grandi aziende',
    features: [
      'Tutto di Pro, plus:',
      'Market Intelligence Dashboard',
      'Analisi demografica clienti',
      'Report mensili personalizzati',
      'Account manager dedicato',
      'API access',
      'White-label options',
    ],
    color: 'orange',
  },
] as const;

export function SubscriptionPlans({ currentPlan, onUpgrade }: SubscriptionPlansProps) {
  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">
          Scegli il piano giusto per te
        </h2>
        <p className="text-xl text-slate-400">
          Sblocca tutte le funzionalità e fai crescere il tuo business
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.name;
          const borderColor =
            plan.color === 'orange'
              ? 'border-orange-600'
              : 'border-slate-700';
          const bgColor =
            plan.color === 'orange'
              ? 'bg-orange-600'
              : 'bg-slate-700';

          return (
            <div
              key={plan.name}
              className={`bg-slate-900/50 backdrop-blur-sm rounded-3xl border-2 p-8 transition-all hover:scale-105 relative ${
                plan.popular
                  ? 'border-orange-600 shadow-xl shadow-orange-600/20'
                  : borderColor
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-1 rounded-full bg-orange-600 text-white text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    Più Popolare
                  </div>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-semibold">
                    Piano Attuale
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.displayName}
                </h3>
                <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">€{plan.price}</span>
                  <span className="text-slate-400">/mese</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 text-${plan.color}-600`} />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onUpgrade}
                disabled={isCurrentPlan}
                className={`w-full py-3 rounded-2xl font-semibold transition-all ${
                  isCurrentPlan
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : `${bgColor} text-white hover:opacity-90`
                }`}
              >
                {isCurrentPlan ? 'Piano Corrente' : 'Passa a ' + plan.displayName}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-8 bg-gradient-to-r from-orange-600/20 to-orange-500/10 rounded-3xl border border-orange-600/30 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          Hai bisogno di una soluzione personalizzata?
        </h3>
        <p className="text-slate-300 mb-6">
          Contattaci per un piano su misura per le esigenze della tua azienda
        </p>
        <button className="px-8 py-3 rounded-2xl bg-white text-slate-950 font-semibold hover:bg-slate-100 transition-all">
          Contatta il Reparto Vendite
        </button>
      </div>
    </div>
  );
}
