import { useState } from 'react';
import { motion } from 'framer-motion';
import { Euro, MapPin, Calendar, Sparkles } from 'lucide-react';
import type { AgeRange } from '../lib/types';
import { AGE_RANGES } from '../lib/types';

export interface BuyerDemand {
  budget: number | null;
  regione: string;
  age_range: AgeRange | null;
}

interface DemandCaptureProps {
  onSubmit: (demand: BuyerDemand) => void;
  initialValues?: Partial<BuyerDemand>;
  isLoading?: boolean;
}

const ITALIAN_REGIONS = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Friuli-Venezia Giulia',
  'Lazio',
  'Liguria',
  'Lombardia',
  'Marche',
  'Molise',
  'Piemonte',
  'Puglia',
  'Sardegna',
  'Sicilia',
  'Trentino-Alto Adige',
  'Toscana',
  'Umbria',
  "Valle d'Aosta",
  'Veneto',
] as const;

export function DemandCapture({ onSubmit, initialValues, isLoading = false }: DemandCaptureProps) {
  const [formData, setFormData] = useState<BuyerDemand>({
    budget: initialValues?.budget ?? null,
    regione: initialValues?.regione ?? '',
    age_range: initialValues?.age_range ?? null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BuyerDemand, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Partial<Record<keyof BuyerDemand, string>> = {};
    
    if (!formData.regione.trim()) {
      newErrors.regione = 'La regione è obbligatoria';
    }
    
    if (formData.budget !== null && formData.budget < 0) {
      newErrors.budget = 'Il budget non può essere negativo';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-[2rem] p-[2px] bg-gradient-to-br from-blue-500 via-purple-500 to-orange-500 shadow-2xl"
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-orange-600/20 blur-2xl" />
        
        {/* Inner content */}
        <div className="relative bg-slate-900/95 backdrop-blur-sm rounded-[1.875rem] p-8 border border-slate-800/50">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                Cattura Richiesta
              </h2>
              <p className="text-sm text-slate-400 mt-1">Inserisci i dettagli della tua richiesta</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Budget Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Euro className="w-4 h-4 text-orange-400" />
                Budget (€)
              </label>
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-pink-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      budget: value === '' ? null : parseFloat(value),
                    });
                    if (errors.budget) {
                      setErrors({ ...errors, budget: undefined });
                    }
                  }}
                  placeholder="Es: 1500.00"
                  className="relative w-full px-5 py-4 rounded-xl bg-slate-800/50 border-2 border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:bg-slate-800 transition-all duration-300 backdrop-blur-sm"
                />
              </div>
              {errors.budget && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.budget}
                </motion.p>
              )}
            </motion.div>

            {/* Regione Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                Regione *
              </label>
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <select
                  required
                  value={formData.regione}
                  onChange={(e) => {
                    setFormData({ ...formData, regione: e.target.value });
                    if (errors.regione) {
                      setErrors({ ...errors, regione: undefined });
                    }
                  }}
                  className="relative w-full px-5 py-4 rounded-xl bg-slate-800/50 border-2 border-slate-700/50 text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-800 text-slate-400">Seleziona una regione</option>
                  {ITALIAN_REGIONS.map((region) => (
                    <option key={region} value={region} className="bg-slate-800 text-white">
                      {region}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-2 h-2 border-2 border-slate-400 border-t-transparent border-r-transparent rotate-45" />
                </div>
              </div>
              {errors.regione && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.regione}
                </motion.p>
              )}
            </motion.div>

            {/* Age Range Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Fascia d'Età
              </label>
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <select
                  value={formData.age_range ?? ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      age_range: e.target.value === '' ? null : (e.target.value as AgeRange),
                    });
                  }}
                  className="relative w-full px-5 py-4 rounded-xl bg-slate-800/50 border-2 border-slate-700/50 text-white focus:outline-none focus:border-purple-500/50 focus:bg-slate-800 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-800 text-slate-400">Non specificato</option>
                  {AGE_RANGES.map((range) => (
                    <option key={range} value={range} className="bg-slate-800 text-white">
                      {range} anni
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-2 h-2 border-2 border-slate-400 border-t-transparent border-r-transparent rotate-45" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Invio in corso...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Invia Richiesta
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
