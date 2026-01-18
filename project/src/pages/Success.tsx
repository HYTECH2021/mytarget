import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';

export function Success() {
  const { user } = useAuth();
  const { subscription, loading } = useSubscription();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Get session_id from URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId && user) {
      // Wait a bit for Stripe webhook to process
      setTimeout(() => {
        setProcessing(false);
      }, 3000);
    } else {
      setProcessing(false);
    }
  }, [user]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Elaborazione pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">
          Pagamento Completato!
        </h1>
        <p className="text-slate-600 mb-6">
          Il tuo abbonamento è stato attivato con successo.
        </p>
        {subscription && (
          <div className="bg-slate-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-slate-600 mb-1">Piano Attivo:</p>
            <p className="text-2xl font-bold text-orange-600 uppercase">
              {subscription.plan}
            </p>
          </div>
        )}
        <button
          onClick={() => window.location.href = '/'}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all"
        >
          Vai alla Dashboard
        </button>
      </div>
    </div>
  );
}
