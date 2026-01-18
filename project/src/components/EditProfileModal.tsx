import { useState, useEffect } from 'react';
import { X, Mail, Phone, User, MapPin, Save, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    phone_number: '',
    full_name: '',
    city: '',
  });

  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        full_name: profile.full_name || '',
        city: profile.city || '',
      });
      setError(null);
      setSuccess(null);
      setEmailError(null);
      setPhoneError(null);
    }
  }, [profile, isOpen]);

  // Validazione email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validazione telefono
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+39|0039)?[\s]?[0-9]{2,3}[\s]?[0-9]{6,7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setError(null);
    setSuccess(null);
    setEmailError(null);
    setPhoneError(null);

    // Validazione email
    if (!formData.email || !formData.email.trim()) {
      setEmailError('L\'email è obbligatoria');
      return;
    }
    if (!validateEmail(formData.email)) {
      setEmailError('Inserisci un indirizzo email valido (es: nome@dominio.com)');
      return;
    }

    // Validazione telefono
    if (!formData.phone_number || !formData.phone_number.trim()) {
      setPhoneError('Il numero di telefono è obbligatorio');
      return;
    }
    if (!validatePhone(formData.phone_number)) {
      setPhoneError('Inserisci un numero di telefono valido (es: +39 123 456 7890)');
      return;
    }

    setLoading(true);

    try {
      // Aggiorna email in auth.users (se cambiata)
      if (formData.email !== profile.email) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({
          email: formData.email.trim(),
        });
        if (emailUpdateError) throw emailUpdateError;
      }

      // Aggiorna profilo in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: formData.email.trim(),
          phone_number: formData.phone_number.trim(),
          full_name: formData.full_name.trim(),
          city: formData.city.trim(),
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Refresh profile per aggiornare i dati
      await refreshProfile();

      setSuccess('Profilo aggiornato con successo!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full border border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-orange-500" />
            Modifica Profilo
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-900/30 border border-red-500/50 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-green-900/30 border border-green-500/50">
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-500" />
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setEmailError(null);
              }}
              className={`w-full px-4 py-3 rounded-2xl bg-slate-800 border ${
                emailError ? 'border-red-500' : 'border-slate-700'
              } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent`}
              placeholder="tuo@email.com"
              pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
              title="Inserisci un indirizzo email valido"
            />
            {emailError && <p className="text-xs text-red-400 mt-1">{emailError}</p>}
          </div>

          {/* Telefono */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-500" />
              Numero di Telefono *
            </label>
            <input
              type="tel"
              required
              value={formData.phone_number}
              onChange={(e) => {
                setFormData({ ...formData, phone_number: e.target.value });
                setPhoneError(null);
              }}
              className={`w-full px-4 py-3 rounded-2xl bg-slate-800 border ${
                phoneError ? 'border-red-500' : 'border-slate-700'
              } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent`}
              placeholder="+39 123 456 7890"
              pattern="[\+\s0-9]{8,15}"
              title="Inserisci un numero di telefono valido"
            />
            {phoneError ? (
              <p className="text-xs text-red-400 mt-1">{phoneError}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Formato: +39 123 456 7890 o 123 456 7890</p>
            )}
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              placeholder="Mario Rossi"
            />
          </div>

          {/* Città */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              Città *
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              placeholder="Milano"
            />
          </div>

          {/* Bottoni */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 hover:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salva Modifiche
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
