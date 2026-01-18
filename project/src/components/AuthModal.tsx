import { useState } from 'react';
import { X, Loader2, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ACQUISITION_SOURCES, GENDERS, AGE_RANGES, BUSINESS_SECTORS } from '../lib/types';
import type { UserRole } from '../lib/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
}

export function AuthModal({ isOpen, onClose, initialRole = 'buyer' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [sellerType, setSellerType] = useState<'business' | 'individual'>('business');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    city: '',
    fonte_acquisizione: ACQUISITION_SOURCES[0],
    // Campi per Buyer e Seller Privato
    gender: '',
    age_range: '',
    // Campi per Seller Azienda
    business_name: '',
    vat_number: '',
    primary_sector: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTermsError(null);
    setSuccessMessage(null);

    // Validazione checkbox per registrazione
    if (mode === 'register' && !acceptTerms) {
      setTermsError('Devi accettare l\'informativa privacy e i termini per registrarti.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        onClose();
      } else {
        const profileData: any = {
          full_name: formData.full_name,
          city: formData.city,
          fonte_acquisizione: formData.fonte_acquisizione,
          role,
        };

        if (role === 'buyer') {
          profileData.gender = formData.gender;
          profileData.age_range = formData.age_range;
        } else {
          profileData.seller_type = sellerType;
          if (sellerType === 'business') {
            profileData.business_name = formData.business_name;
            profileData.vat_number = formData.vat_number;
            profileData.primary_sector = formData.primary_sector;
          } else {
            profileData.gender = formData.gender;
            profileData.age_range = formData.age_range;
          }
        }

        const { error } = await signUp(formData.email, formData.password, profileData);
        if (error) throw error;

        setSuccessMessage('Registrazione completata! Controlla la tua email per verificare il tuo account.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  const roleColor = role === 'buyer' ? 'blue' : 'orange';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Accedi' : 'Registrati'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Tipo di Account
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      role === 'buyer'
                        ? 'border-orange-600 bg-orange-600/10 text-white'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold mb-1">Acquirente</div>
                    <div className="text-xs">Cerco prodotti</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('seller')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      role === 'seller'
                        ? 'border-orange-600 bg-orange-600/10 text-white'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold mb-1">Venditore</div>
                    <div className="text-xs">Vendo prodotti</div>
                  </button>
                </div>
              </div>

              {role === 'seller' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Tipologia di Venditore
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSellerType('business')}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        sellerType === 'business'
                          ? 'border-orange-600 bg-orange-600/10 text-white'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-semibold mb-1">Azienda</div>
                      <div className="text-xs">Commerciante/P.IVA</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellerType('individual')}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        sellerType === 'individual'
                          ? 'border-orange-600 bg-orange-600/10 text-white'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-semibold mb-1">Privato</div>
                      <div className="text-xs">Persona fisica</div>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              placeholder="tuo@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {role === 'seller' && sellerType === 'business' ? 'Nome Attività' : 'Nome Completo'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  placeholder={role === 'seller' && sellerType === 'business' ? 'Nome della tua attività' : 'Mario Rossi'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Città
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

              {role === 'buyer' || (role === 'seller' && sellerType === 'individual') ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Genere
                    </label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                    >
                      <option value="">Seleziona</option>
                      {GENDERS.map((gender) => (
                        <option key={gender} value={gender}>
                          {gender}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fascia d'Età
                    </label>
                    <select
                      required
                      value={formData.age_range}
                      onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                    >
                      <option value="">Seleziona</option>
                      {AGE_RANGES.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Partita IVA / Codice Fiscale
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vat_number}
                      onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                      placeholder="IT12345678901"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Settore Prevalente
                    </label>
                    <select
                      required
                      value={formData.primary_sector}
                      onChange={(e) => setFormData({ ...formData, primary_sector: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                    >
                      <option value="">Seleziona settore</option>
                      {BUSINESS_SECTORS.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Come ci hai conosciuto? *
                </label>
                <select
                  required
                  value={formData.fonte_acquisizione}
                  onChange={(e) => setFormData({ ...formData, fonte_acquisizione: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                >
                  {ACQUISITION_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-6 rounded-2xl bg-green-500/10 border-2 border-green-500/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Registrazione Completata!</h3>
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-300 space-y-2">
                    <p className="font-semibold text-green-400">
                      Abbiamo inviato un'email di verifica a {formData.email}
                    </p>
                    <p>
                      Per completare la registrazione:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400">
                      <li>Apri la tua casella email</li>
                      <li>Cerca l'email da MY TARGET</li>
                      <li>Clicca sul pulsante "Conferma indirizzo email"</li>
                    </ol>
                    <p className="text-xs text-slate-500 mt-3">
                      Non trovi l'email? Controlla la cartella spam o richiedi un nuovo link.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    setTermsError(null);
                  }}
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-orange-600 focus:ring-2 focus:ring-orange-600 focus:ring-offset-0 focus:ring-offset-slate-900 cursor-pointer"
                />
                <label htmlFor="accept-terms" className="text-sm text-slate-300 leading-relaxed cursor-pointer">
                  Accetto l'<a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 hover:underline font-semibold">Informativa sulla Privacy</a> e i <a href="/termini" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 hover:underline font-semibold">Termini e Condizioni d'uso</a>
                </label>
              </div>
              {termsError && (
                <p className="text-sm text-red-500 ml-7">{termsError}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'register' && !acceptTerms)}
            className={`w-full py-3 rounded-2xl font-semibold text-white transition-all ${
              role === 'buyer'
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-orange-600 hover:bg-orange-700'
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {mode === 'login' ? 'Accedi' : 'Registrati'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
