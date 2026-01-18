import { useState } from 'react';
import { Bell, X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NotificationConsentProps {
  onComplete: () => void;
}

export function NotificationConsent({ onComplete }: NotificationConsentProps) {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    await savePreference(true);
  };

  const handleDecline = async () => {
    await savePreference(false);
  };

  const savePreference = async (enabled: boolean) => {
    if (!profile) return;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ notifications_enabled: enabled })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Request notification permission if enabled
      if (enabled && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Refresh profile to get updated data
      await refreshProfile();

      onComplete();
    } catch (err) {
      console.error('Error saving notification preference:', err);
      setError('Errore nel salvataggio della preferenza. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-2 border-orange-500/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-white mb-1">
                Notifiche in Tempo Reale
              </h3>
              <p className="text-sm text-orange-100">
                Non perdere mai un'opportunità
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-700 text-base leading-relaxed mb-6">
            Vuoi ricevere avvisi in tempo reale per le nuove offerte?
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Ti avviseremo immediatamente quando riceverai nuove offerte o messaggi importanti sulla tua ricerca.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <X className="w-5 h-5" />
                  Non ora
                </>
              )}
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Attiva Notifiche
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
