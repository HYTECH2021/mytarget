import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, MapPin, Calendar, Filter, Target, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Target as TargetType, Offer, Profile, AgeRange } from '../lib/types';
import { AGE_RANGES } from '../lib/types';

interface TargetWithProfile extends TargetType {
  profile: Profile;
}

interface FutureDemandData {
  category: string;
  currentWeek: number;
  predictedNextWeek: number;
  growthRate: number; // percentage
}

interface CompetitionData {
  category: string;
  sellerCount: number;
  offerCount: number;
  targetsCount: number;
}

const ITALIAN_REGIONS = [
  'Tutte',
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
];

// Helper to extract region from location
function getRegionFromLocation(location: string): string {
  const loc = location.toLowerCase();
  
  const regionMap: Record<string, string> = {
    'milano': 'Lombardia',
    'roma': 'Lazio',
    'napoli': 'Campania',
    'torino': 'Piemonte',
    'palermo': 'Sicilia',
    'genova': 'Liguria',
    'bologna': 'Emilia-Romagna',
    'firenze': 'Toscana',
    'bari': 'Puglia',
    'venezia': 'Veneto',
    'verona': 'Veneto',
    'padova': 'Veneto',
    'cagliari': 'Sardegna',
    'foggia': 'Puglia',
    'salerno': 'Campania',
  };
  
  for (const [city, region] of Object.entries(regionMap)) {
    if (loc.includes(city)) return region;
  }
  
  for (const region of ITALIAN_REGIONS.slice(1)) {
    if (loc.includes(region.toLowerCase())) return region;
  }
  
  return 'Non specificata';
}

export function PremiumInsights() {
  const [targets, setTargets] = useState<TargetWithProfile[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    region: string;
    ageRange: string;
  }>({
    region: 'Tutte',
    ageRange: 'Tutte',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Load targets with profiles
    const { data: targetsData } = await supabase
      .from('targets')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Load offers
    const { data: offersData } = await supabase
      .from('offers')
      .select('*');

    if (targetsData) {
      setTargets(targetsData as TargetWithProfile[]);
    }
    if (offersData) {
      setOffers(offersData);
    }

    setLoading(false);
  };

  // Filter targets based on region and age range
  const filteredTargets = useMemo(() => {
    return targets.filter((target) => {
      // Filter by region
      if (filters.region !== 'Tutte') {
        const targetRegion = getRegionFromLocation(target.location);
        if (targetRegion !== filters.region) return false;
      }

      // Filter by age range
      if (filters.ageRange !== 'Tutte') {
        const buyerAgeRange = target.profile?.age_range;
        if (buyerAgeRange !== filters.ageRange) return false;
      }

      return true;
    });
  }, [targets, filters]);

  // Calculate Future Demand (based on last week trends)
  const futureDemandData = useMemo((): FutureDemandData[] => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Group by category and week
    const categoryData = new Map<string, { week1: number; week2: number }>();

    filteredTargets.forEach((target) => {
      const createdDate = new Date(target.created_at);
      const category = target.category;

      if (!categoryData.has(category)) {
        categoryData.set(category, { week1: 0, week2: 0 });
      }

      const data = categoryData.get(category)!;

      if (createdDate >= oneWeekAgo && createdDate <= now) {
        data.week1 += 1;
      } else if (createdDate >= twoWeeksAgo && createdDate < oneWeekAgo) {
        data.week2 += 1;
      }
    });

    // Calculate predictions
    const predictions: FutureDemandData[] = Array.from(categoryData.entries())
      .map(([category, data]) => {
        const growthRate = data.week2 > 0 
          ? ((data.week1 - data.week2) / data.week2) * 100 
          : data.week1 > 0 ? 100 : 0;
        
        // Predict next week based on growth rate
        const predictedNextWeek = Math.round(
          data.week1 * (1 + growthRate / 100)
        );

        return {
          category,
          currentWeek: data.week1,
          predictedNextWeek: Math.max(0, predictedNextWeek),
          growthRate,
        };
      })
      .filter(data => data.currentWeek > 0 || data.predictedNextWeek > 0)
      .sort((a, b) => b.predictedNextWeek - a.predictedNextWeek)
      .slice(0, 10);

    return predictions;
  }, [filteredTargets]);

  // Calculate Competition Analysis
  const competitionData = useMemo((): CompetitionData[] => {
    const categoryMap = new Map<string, {
      sellers: Set<string>;
      offers: number;
      targets: number;
    }>();

    filteredTargets.forEach((target) => {
      const category = target.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          sellers: new Set(),
          offers: 0,
          targets: 1,
        });
      } else {
        categoryMap.get(category)!.targets += 1;
      }
    });

    // Count offers and sellers per category
    offers.forEach((offer) => {
      const target = filteredTargets.find(t => t.id === offer.target_id);
      if (target) {
        const category = target.category;
        const data = categoryMap.get(category);
        if (data) {
          data.offers += 1;
          data.sellers.add(offer.seller_id);
        }
      }
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        sellerCount: data.sellers.size,
        offerCount: data.offers,
        targetsCount: data.targets,
      }))
      .filter(data => data.targetsCount > 0)
      .sort((a, b) => b.sellerCount - a.sellerCount)
      .slice(0, 10);
  }, [filteredTargets, offers]);

  const maxFutureDemand = Math.max(
    ...futureDemandData.map(d => Math.max(d.currentWeek, d.predictedNextWeek)),
    1
  );
  const maxCompetition = Math.max(...competitionData.map(d => d.sellerCount), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950/50 via-purple-900/20 to-slate-950/50 p-8 border border-purple-900/30"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold mb-4 border border-purple-500/20">
            PREMIUM INSIGHTS
          </div>
          <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Analisi Avanzata
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl">
            Previsioni di domanda futura, analisi della concorrenza e filtri demo-geografici per identificare nicchie di mercato.
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 p-6 border border-slate-800"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <Filter className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Filtri Demo-Geografici</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              Regione
            </label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border-2 border-slate-700/50 text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all appearance-none cursor-pointer"
            >
              {ITALIAN_REGIONS.map((region) => (
                <option key={region} value={region} className="bg-slate-800 text-white">
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Fascia d'Età
            </label>
            <select
              value={filters.ageRange}
              onChange={(e) => setFilters({ ...filters, ageRange: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border-2 border-slate-700/50 text-white focus:outline-none focus:border-purple-500/50 focus:bg-slate-800 transition-all appearance-none cursor-pointer"
            >
              <option value="Tutte" className="bg-slate-800 text-white">Tutte</option>
              {AGE_RANGES.map((ageRange) => (
                <option key={ageRange} value={ageRange} className="bg-slate-800 text-white">
                  {ageRange} anni
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Future Demand Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 p-8 border border-slate-800"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Domanda Futura</h3>
              <p className="text-sm text-slate-400 mt-1">
                Previsione delle ricerche basata sui trend dell'ultima settimana
              </p>
            </div>
          </div>

          {futureDemandData.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nessun dato disponibile per i filtri selezionati</p>
            </div>
          ) : (
            <div className="space-y-6">
              {futureDemandData.map((data, index) => {
                const currentHeight = (data.currentWeek / maxFutureDemand) * 100;
                const predictedHeight = (data.predictedNextWeek / maxFutureDemand) * 100;
                const isGrowing = data.growthRate > 0;

                return (
                  <motion.div
                    key={data.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-bold text-white">{data.category}</h4>
                        {isGrowing && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{data.growthRate.toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <div>Questa settimana: <span className="font-bold text-white">{data.currentWeek}</span></div>
                        <div>Previsione: <span className="font-bold text-green-400">{data.predictedNextWeek}</span></div>
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="relative h-32 bg-slate-800/30 rounded-xl p-4 flex items-end gap-4 border border-slate-700/50">
                      {/* Current Week Bar */}
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${currentHeight}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                          className="relative w-full rounded-t-xl bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 shadow-lg group cursor-pointer max-h-full"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="absolute inset-0 rounded-t-xl bg-gradient-to-t from-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                        <span className="text-xs text-slate-400">Settimana attuale</span>
                      </div>

                      {/* Predicted Next Week Bar */}
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${predictedHeight}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                          className="relative w-full rounded-t-xl bg-gradient-to-t from-green-600 via-emerald-500 to-teal-400 shadow-lg group cursor-pointer max-h-full border-2 border-green-400/50"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="absolute inset-0 rounded-t-xl bg-gradient-to-t from-green-400/50 to-transparent animate-pulse" />
                          {/* Sparkles effect for predicted */}
                          <div className="absolute -top-2 -right-2">
                            <Sparkles className="w-4 h-4 text-green-400" />
                          </div>
                        </motion.div>
                        <span className="text-xs text-green-400 font-semibold">Previsione</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Competition Analysis Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 p-8 border border-slate-800"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-red-600/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
              <Users className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Analisi della Concorrenza</h3>
              <p className="text-sm text-slate-400 mt-1">
                Quanti altri venditori stanno guardando la stessa categoria
              </p>
            </div>
          </div>

          {competitionData.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nessun dato disponibile per i filtri selezionati</p>
            </div>
          ) : (
            <div className="space-y-6">
              {competitionData.map((data, index) => {
                const heightPercent = (data.sellerCount / maxCompetition) * 100;
                const competitionLevel = data.sellerCount < 3 ? 'Bassa' : data.sellerCount < 10 ? 'Media' : 'Alta';
                const competitionColor = data.sellerCount < 3 ? 'from-green-600 to-emerald-500' : 
                                       data.sellerCount < 10 ? 'from-yellow-600 to-orange-500' : 
                                       'from-red-600 to-pink-500';

                return (
                  <motion.div
                    key={data.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-bold text-white">{data.category}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          data.sellerCount < 3 
                            ? 'bg-green-500/20 text-green-400' 
                            : data.sellerCount < 10
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {competitionLevel}
                        </span>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <div><span className="font-bold text-white">{data.sellerCount}</span> venditori</div>
                        <div><span className="font-bold text-white">{data.targetsCount}</span> richieste</div>
                        <div className="text-xs text-slate-500">
                          {data.offerCount} offerte totali
                        </div>
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="relative h-24 bg-slate-800/30 rounded-xl p-4 flex items-end border border-slate-700/50">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                        className={`relative w-full rounded-t-xl bg-gradient-to-t ${competitionColor} shadow-lg group cursor-pointer max-h-full`}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="absolute inset-0 rounded-t-xl bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <p className="text-sm font-bold text-white">
                            {data.sellerCount} venditore{data.sellerCount !== 1 ? 'i' : ''}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Competition Ratio */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                      <span>Rapporto venditori/richieste</span>
                      <span className="font-semibold text-slate-400">
                        {(data.sellerCount / Math.max(data.targetsCount, 1)).toFixed(2)}x
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
