import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { TargetWithProfile } from '../lib/types';

interface SendOfferModalProps {
  target: TargetWithProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendOfferModal({ target, onClose, onSuccess }: SendOfferModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    message: '',
    proposed_price: target.budget?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setError(null);
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('offers').insert({
        target_id: target.id,
        seller_id: profile.id,
        message: formData.message,
        proposed_price: formData.proposed_price ? parseFloat(formData.proposed_price) : null,
      });

      if (insertError) throw insertError;

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <h2 className="text-2xl font-bold text-white">Invia Offerta</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-800 bg-slate-800/30">
          <h3 className="font-semibold text-white mb-2">{target.title}</h3>
          <p className="text-sm text-slate-400">
            Richiesta da: {target.profile.full_name} • {target.profile.city}
          </p>
          {target.budget && (
            <p className="text-sm text-orange-400 mt-2">
              Budget indicativo: €{target.budget}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Il tuo messaggio *
            </label>
            <textarea
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent resize-none"
              placeholder="Descrivi la tua offerta in dettaglio: cosa puoi fornire, tempi di consegna, garanzie, ecc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prezzo Proposto (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.proposed_price}
              onChange={(e) => setFormData({ ...formData, proposed_price: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              placeholder="Es: 999.99"
            />
            <p className="text-xs text-slate-500 mt-2">
              Lascia vuoto se preferisci non specificare un prezzo
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
            <p className="text-sm text-orange-300 font-medium mb-1">
              Commissione Piattaforma
            </p>
            <p className="text-xs text-slate-400">
              I-LOOK For trattiene una commissione del 5% sul valore della vendita conclusa.
              Il prezzo che proponi all'acquirente è quello finale che riceverai meno la commissione.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Invia Offerta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
