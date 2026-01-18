import { useState } from 'react';
import { Check, Sparkles, TrendingUp, MessageCircle, BarChart3, Zap, Shield } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import type { SubscriptionPlan } from '../lib/types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const plans = [
  {
    name: 'free' as SubscriptionPlan,
    displayName: 'Gratuito',
    price: '0',
    period: 'sempre',
    description: 'Perfetto per iniziare',
    features: [
      'Accesso base alle richieste',
      'Visualizza fino a 30 richieste al mese',
      'Invia fino a 10 offerte al mese',
      'Supporto via email',
      'Profilo base',
    ],
    color: 'slate',
    cta: 'Piano Attuale',
    disabled: false,
  },
  {
    name: 'plus' as SubscriptionPlan,
    displayName: 'Plus',
    price: '19',
    period: '/mese',
    description: 'Statistiche e insights',
    features: [
      'Tutto di Gratuito, plus:',
      'Statistiche base',
      'Richieste illimitate',
      'Offerte illimitate',
      'Dashboard analytics',
      'Export dati CSV',
      'Supporto prioritario',
    ],
    color: 'blue',
    cta: 'Sottoscrivi Plus',
    popular: false,
  },
  {
    name: 'pro' as SubscriptionPlan,
    displayName: 'Pro',
    price: '49',
    period: '/mese',
    description: 'Forecast AI e priorità',
    features: [
      'Tutto di Plus, plus:',
      'Forecast AI avanzato',
      'Chat prioritarie',
      'Market Intelligence',
      'Analisi predittive',
      'Report personalizzati',
      'Export avanzato (PDF, XLS)',
      'Account manager dedicato',
    ],
    color: 'orange',
    cta: 'Sottoscrivi Pro',
    popular: true,
  },
] as const;

export function Pricing() {
  const { user, profile } = useAuth();
  const { subscription, loading } = useSubscription();
  const [processing, setProcessing] = useState<string | null>(null);

  const currentPlan = subscription?.plan || 'free';

  const handleSubscribe = async (planName: SubscriptionPlan) => {
    if (!user) {
      alert('Devi essere autenticato per sottoscrivere un piano');
      window.location.href = '/';
      return;
    }

    if (planName === 'free') {
      alert('Sei già sul piano gratuito');
      return;
    }

    setProcessing(planName);

    try {
      // Crea checkout session con Stripe via Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession) {
        throw new Error('Sessione non valida');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          plan: planName,
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nella creazione della sessione di checkout');
      }

      const { sessionId } = await response.json();

      // Redirect a Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe non configurato correttamente');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Errore durante la sottoscrizione. Riprova più tardi.');
      setProcessing(null);
    }
  };

  const handleUpgrade = async (planName: SubscriptionPlan) => {
    if (!user) {
      alert('Devi essere autenticato per aggiornare il piano');
      return;
    }

    if (planName === currentPlan) {
      alert('Sei già su questo piano');
      return;
    }

    // Se è un upgrade a Plus o Pro, usa Stripe
    if (planName === 'plus' || planName === 'pro') {
      await handleSubscribe(planName);
      return;
    }

    // Se è downgrade a free, gestisci direttamente
    alert('Per tornare al piano gratuito, contatta il supporto.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-black text-white">MY TARGET</h1>
          </div>
          {user ? (
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm font-semibold"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-colors text-sm font-semibold"
            >
              Accedi
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Scegli il Piano Giusto
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Sblocca tutte le funzionalità e fai crescere il tuo business con MY TARGET
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.name;
            const isProcessing = processing === plan.name;
            const borderColor =
              plan.color === 'orange'
                ? 'border-orange-600'
                : plan.color === 'blue'
                ? 'border-blue-600'
                : 'border-slate-700';
            const bgColor =
              plan.color === 'orange'
                ? 'bg-orange-600'
                : plan.color === 'blue'
                ? 'bg-blue-600'
                : 'bg-slate-700';

            return (
              <div
                key={plan.name}
                className={`relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border-2 ${borderColor} p-8 ${
                  plan.popular ? 'scale-105 shadow-2xl shadow-orange-600/20' : ''
                } transition-all hover:scale-[1.02]`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">
                    PIÙ POPOLARE
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-black text-white mb-2">{plan.displayName}</h3>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-white">€{plan.price}</span>
                    <span className="text-slate-400 text-lg">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={isCurrentPlan || isProcessing || loading}
                  className={`w-full py-4 rounded-2xl font-bold text-white transition-all ${
                    isCurrentPlan
                      ? 'bg-slate-700 cursor-not-allowed'
                      : plan.color === 'orange'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400'
                      : plan.color === 'blue'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'
                      : 'bg-slate-700 hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isProcessing ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      Elaborazione...
                    </>
                  ) : isCurrentPlan ? (
                    'Piano Attuale'
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8">
          <h3 className="text-2xl font-black text-white mb-8 text-center">
            Confronto Funzionalità
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-4 px-4 font-bold text-slate-300">Funzionalità</th>
                  <th className="text-center py-4 px-4 font-bold text-slate-300">Gratuito</th>
                  <th className="text-center py-4 px-4 font-bold text-blue-400">Plus</th>
                  <th className="text-center py-4 px-4 font-bold text-orange-400">Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 px-4 text-slate-300">Richieste visualizzate</td>
                  <td className="py-4 px-4 text-center text-slate-400">30/mese</td>
                  <td className="py-4 px-4 text-center text-green-400">Illimitate</td>
                  <td className="py-4 px-4 text-center text-green-400">Illimitate</td>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 px-4 text-slate-300">Offerte inviate</td>
                  <td className="py-4 px-4 text-center text-slate-400">10/mese</td>
                  <td className="py-4 px-4 text-center text-green-400">Illimitate</td>
                  <td className="py-4 px-4 text-center text-green-400">Illimitate</td>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 px-4 text-slate-300">Statistiche base</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 px-4 text-slate-300">Export CSV</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 px-4 text-slate-300">Forecast AI</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 px-4 text-slate-300">Chat prioritarie</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 px-4 text-slate-300">Export PDF/XLS</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-300">Supporto</td>
                  <td className="py-4 px-4 text-center text-slate-400">Email</td>
                  <td className="py-4 px-4 text-center text-green-400">Prioritario</td>
                  <td className="py-4 px-4 text-center text-green-400">Dedicato</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-black text-white mb-8">Domande Frequenti</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 text-left">
              <h4 className="font-bold text-white mb-2">Posso cambiare piano in qualsiasi momento?</h4>
              <p className="text-slate-400 text-sm">
                Sì, puoi aggiornare o downgrade il tuo piano in qualsiasi momento. Le modifiche entrano in vigore immediatamente.
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 text-left">
              <h4 className="font-bold text-white mb-2">Cosa succede se annullo l'abbonamento?</h4>
              <p className="text-slate-400 text-sm">
                Passerai automaticamente al piano gratuito. I dati rimangono accessibili secondo i limiti del piano gratuito.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
