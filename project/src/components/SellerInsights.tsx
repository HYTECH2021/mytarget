import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Euro, TrendingDown, AlertCircle, Flame, TrendingUp, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Target, Offer, Profile, AgeRange } from '../lib/types';
import { AGE_RANGES } from '../lib/types';

interface TargetWithProfile extends Target {
  profile: Profile;
}

interface RegionHeatmapData {
  region: string;
  count: number;
  intensity: number; // 0-100 for heatmap color
}

interface BudgetByAgeData {
  ageRange: AgeRange;
  avgBudget: number;
  requestCount: number;
}

interface MarketGapData {
  category: string;
  requestCount: number;
  offerCount: number;
  gapScore: number; // Ratio of requests to offers
}

interface MarketTrend {
  region: string;
  requests: number;
  avgBudget: number;
  topCategory: string;
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
];

// Helper to normalize city to region (simplified mapping)
function getRegionFromLocation(location: string): string {
  const loc = location.toLowerCase();
  
  // Simple mapping - in production, you'd use a proper geocoding service
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
    'catanzaro': 'Calabria',
    'venezia': 'Veneto',
    'verona': 'Veneto',
    'messina': 'Sicilia',
    'padova': 'Veneto',
    'trieste': 'Friuli-Venezia Giulia',
    'brescia': 'Lombardia',
    'parma': 'Emilia-Romagna',
    'modena': 'Emilia-Romagna',
    'perugia': 'Umbria',
    'livorno': 'Toscana',
    'reggio': 'Emilia-Romagna',
    'cagliari': 'Sardegna',
    'foggia': 'Puglia',
    'rimini': 'Emilia-Romagna',
    'salerno': 'Campania',
    'urbino': 'Marche',
    'terni': 'Umbria',
    'pescara': 'Abruzzo',
    'l\'aquila': 'Abruzzo',
    'potenza': 'Basilicata',
    'catanzaro': 'Calabria',
    'ancona': 'Marche',
    'campobasso': 'Molise',
    'trento': 'Trentino-Alto Adige',
    'bolzano': 'Trentino-Alto Adige',
    'aosta': "Valle d'Aosta",
  };
  
  for (const [city, region] of Object.entries(regionMap)) {
    if (loc.includes(city)) {
      return region;
    }
  }
  
  // If not found, try direct match
  for (const region of ITALIAN_REGIONS) {
    if (loc.includes(region.toLowerCase())) {
      return region;
    }
  }
  
  return 'Non specificata';
}

export function SellerInsights() {
  const [heatmapData, setHeatmapData] = useState<RegionHeatmapData[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetByAgeData[]>([]);
  const [gapData, setGapData] = useState<MarketGapData[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);

    // Load all active targets with profiles
    const { data: targets } = await supabase
      .from('targets')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('status', 'active');

    // Load all offers
    const { data: offers } = await supabase
      .from('offers')
      .select('target_id');

    if (!targets) {
      setLoading(false);
      return;
    }

    const targetsWithProfile = targets as TargetWithProfile[];

    // Process Heatmap Data
    const regionMap = new Map<string, number>();
    targetsWithProfile.forEach((target) => {
      const region = getRegionFromLocation(target.location);
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
    });

    const maxCount = Math.max(...Array.from(regionMap.values()), 1);
    const heatmapDataArray: RegionHeatmapData[] = ITALIAN_REGIONS.map((region) => {
      const count = regionMap.get(region) || 0;
      return {
        region,
        count,
        intensity: (count / maxCount) * 100,
      };
    }).sort((a, b) => b.count - a.count);

    setHeatmapData(heatmapDataArray);

    // Process Budget by Age Data
    const ageBudgetMap = new Map<AgeRange, { totalBudget: number; budgetCount: number; requestCount: number }>();
    
    targetsWithProfile.forEach((target) => {
      const ageRange = target.profile?.age_range;
      if (ageRange && AGE_RANGES.includes(ageRange)) {
        const current = ageBudgetMap.get(ageRange) || { totalBudget: 0, budgetCount: 0, requestCount: 0 };
        current.requestCount += 1;
        if (target.budget) {
          current.totalBudget += target.budget;
          current.budgetCount += 1;
        }
        ageBudgetMap.set(ageRange, current);
      }
    });

    const budgetDataArray: BudgetByAgeData[] = AGE_RANGES.map((ageRange) => {
      const data = ageBudgetMap.get(ageRange) || { totalBudget: 0, budgetCount: 0, requestCount: 0 };
      return {
        ageRange,
        avgBudget: data.budgetCount > 0 ? data.totalBudget / data.budgetCount : 0,
        requestCount: data.requestCount,
      };
    });

    setBudgetData(budgetDataArray);

    // Process Market Gap Data
    const categoryRequestMap = new Map<string, number>();
    const categoryOfferMap = new Map<string, number>();

    targetsWithProfile.forEach((target) => {
      categoryRequestMap.set(
        target.category,
        (categoryRequestMap.get(target.category) || 0) + 1
      );
    });

    // Get target IDs for offers
    const offerTargetIds = new Set(offers?.map((o) => o.target_id) || []);

    // Count offers per category by matching with targets
    targetsWithProfile.forEach((target) => {
      if (offerTargetIds.has(target.id)) {
        const offerCount = offers?.filter((o) => o.target_id === target.id).length || 0;
        categoryOfferMap.set(
          target.category,
          (categoryOfferMap.get(target.category) || 0) + offerCount
        );
      }
    });

    const gapDataArray: MarketGapData[] = Array.from(categoryRequestMap.entries())
      .map(([category, requestCount]) => {
        const offerCount = categoryOfferMap.get(category) || 0;
        // Gap score: higher means more requests than offers (opportunity)
        const gapScore = offerCount > 0 ? requestCount / offerCount : requestCount * 10;
        return {
          category,
          requestCount,
          offerCount,
          gapScore,
        };
      })
      .filter((data) => data.requestCount >= 3) // Only show categories with meaningful data
      .sort((a, b) => b.gapScore - a.gapScore)
      .slice(0, 10);

    setGapData(gapDataArray);

    // Calculate Market Trends per Region
    const regionTrendsMap = new Map<string, {
      requests: number;
      totalBudget: number;
      budgetCount: number;
      categories: Map<string, number>;
    }>();

    targetsWithProfile.forEach((target) => {
      const region = getRegionFromLocation(target.location);
      const current = regionTrendsMap.get(region) || {
        requests: 0,
        totalBudget: 0,
        budgetCount: 0,
        categories: new Map<string, number>(),
      };

      current.requests += 1;

      if (target.budget) {
        current.totalBudget += target.budget;
        current.budgetCount += 1;
      }

      // Count categories per region
      const categoryCount = current.categories.get(target.category) || 0;
      current.categories.set(target.category, categoryCount + 1);

      regionTrendsMap.set(region, current);
    });

    const trendsArray: MarketTrend[] = Array.from(regionTrendsMap.entries())
      .map(([region, data]) => {
        // Find top category for this region
        let topCategory = 'Nessuna';
        let maxCategoryCount = 0;
        data.categories.forEach((count, category) => {
          if (count > maxCategoryCount) {
            maxCategoryCount = count;
            topCategory = category;
          }
        });

        return {
          region,
          requests: data.requests,
          avgBudget: data.budgetCount > 0 ? data.totalBudget / data.budgetCount : 0,
          topCategory,
        };
      })
      .filter((trend) => trend.requests > 0) // Only regions with requests
      .sort((a, b) => b.requests - a.requests); // Sort by request count

    setMarketTrends(trendsArray);
    setLoading(false);
  };

  const maxBudget = Math.max(...budgetData.map((d) => d.avgBudget), 1);
  const topRegions = heatmapData.filter((d) => d.count > 0).slice(0, 10);

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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950/50 via-orange-900/20 to-slate-950/50 p-8 border border-orange-900/30"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold mb-4 border border-orange-500/20">
            SELLER INSIGHTS
          </div>
          <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Dashboard Analisi Venditori
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl">
            Visualizza le opportunità di mercato, analizza la domanda per fascia d'età e identifica i gap dove puoi intervenire.
          </p>
        </div>
      </motion.div>

      {/* Heatmap della Domanda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 p-8 border border-slate-800"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <MapPin className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Heatmap della Domanda</h3>
              <p className="text-sm text-slate-400 mt-1">Richieste attive per regione</p>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {ITALIAN_REGIONS.map((region) => {
              const data = heatmapData.find((d) => d.region === region);
              const intensity = data?.intensity || 0;
              const count = data?.count || 0;

              // Calculate color based on intensity
              const opacity = Math.max(0.2, intensity / 100);
              const isHot = intensity > 50;

              return (
                <motion.div
                  key={region}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`relative rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                    isHot
                      ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/20 to-red-500/10'
                      : 'border-slate-700/50 bg-slate-800/30'
                  }`}
                  style={{
                    boxShadow: isHot
                      ? `0 0 20px rgba(249, 115, 22, ${opacity})`
                      : 'none',
                  }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300">{region}</span>
                      {count > 0 && (
                        <Flame className={`w-4 h-4 ${isHot ? 'text-orange-400' : 'text-slate-600'}`} />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{count}</span>
                      <span className="text-xs text-slate-500">richieste</span>
                    </div>
                    {/* Intensity Bar */}
                    <div className="mt-3 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${intensity}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-full ${
                          isHot
                            ? 'bg-gradient-to-r from-orange-500 to-red-500'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Top Regions List */}
          {topRegions.length > 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50">
              <p className="text-sm font-semibold text-slate-400 mb-3">Top Regioni</p>
              <div className="flex flex-wrap gap-2">
                {topRegions.map((region, index) => (
                  <div
                    key={region.region}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                  >
                    <span className="text-xs font-bold text-blue-400">#{index + 1}</span>
                    <span className="text-sm text-white">{region.region}</span>
                    <span className="text-xs text-slate-400">({region.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Analisi del Budget per Fascia d'Età */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 p-8 border border-slate-800"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Euro className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Analisi del Budget</h3>
              <p className="text-sm text-slate-400 mt-1">Budget medio per fascia d'età</p>
            </div>
          </div>

          {/* Bar Chart with Tailwind Divs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {budgetData.map((data, index) => {
              const heightPercent = maxBudget > 0 ? (data.avgBudget / maxBudget) * 100 : 0;
              const hasData = data.avgBudget > 0 && data.requestCount > 0;

              return (
                <motion.div
                  key={data.ageRange}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  {/* Chart Bar */}
                  <div className="relative w-full h-64 flex items-end justify-center mb-4">
                    {hasData ? (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                        className="relative w-full max-w-16 rounded-t-2xl bg-gradient-to-t from-purple-600 via-pink-500 to-orange-400 shadow-lg group cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <p className="text-sm font-bold text-white">
                            €{data.avgBudget.toFixed(0)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {data.requestCount} richieste
                          </p>
                        </div>
                        {/* Animated glow effect */}
                        <div className="absolute inset-0 rounded-t-2xl bg-gradient-to-t from-purple-400/50 to-transparent animate-pulse" />
                      </motion.div>
                    ) : (
                      <div className="w-full max-w-16 h-2 rounded-full bg-slate-700/30" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-center">
                    <p className="text-sm font-bold text-white mb-1">{data.ageRange}</p>
                    {hasData ? (
                      <>
                        <p className="text-xs text-purple-400 font-semibold">
                          €{data.avgBudget.toFixed(0)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {data.requestCount} rich.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-600">Nessun dato</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Market Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 p-8 border border-slate-800"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Trend di Mercato</h3>
              <p className="text-sm text-slate-400 mt-1">
                Analisi per regione: richieste, budget medio e categoria principale
              </p>
            </div>
          </div>

          {marketTrends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Nessun trend di mercato disponibile al momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketTrends.map((trend, index) => {
                const isTop = index < 3;
                const hasBudget = trend.avgBudget > 0;

                return (
                  <motion.div
                    key={trend.region}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`relative overflow-hidden rounded-2xl p-6 border-2 transition-all group ${
                      isTop
                        ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5'
                        : 'border-slate-700/50 bg-slate-800/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
                    {isTop && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                        <span className="text-xs font-bold text-green-400">#{index + 1}</span>
                      </div>
                    )}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                            <MapPin className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">{trend.region}</h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {trend.requests} {trend.requests === 1 ? 'richiesta' : 'richieste'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Budget Average */}
                        {hasBudget ? (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                            <Euro className="w-4 h-4 text-emerald-400" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-400">Budget Medio</p>
                              <p className="text-lg font-bold text-white">
                                €{trend.avgBudget.toFixed(0)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                            <Euro className="w-4 h-4 text-slate-600" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">Budget Medio</p>
                              <p className="text-sm text-slate-600">Non disponibile</p>
                            </div>
                          </div>
                        )}

                        {/* Top Category */}
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                          <Package className="w-4 h-4 text-green-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 mb-1">Categoria Principale</p>
                            <p className="text-sm font-semibold text-white truncate">
                              {trend.topCategory}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Visual Indicator */}
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-slate-400">Intensità Mercato</span>
                          <span className="font-bold text-green-400">
                            {Math.min(100, (trend.requests / Math.max(...marketTrends.map(t => t.requests), 1)) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${Math.min(100, (trend.requests / Math.max(...marketTrends.map(t => t.requests), 1)) * 100)}%` 
                            }}
                            transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                            className={`h-full rounded-full ${
                              isTop
                                ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'
                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Gap di Mercato */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 p-8 border border-slate-800"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-orange-600/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Gap di Mercato</h3>
              <p className="text-sm text-slate-400 mt-1">
                Categorie con molte richieste ma poche offerte dai venditori
              </p>
            </div>
          </div>

          {gapData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Nessun gap di mercato rilevato al momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gapData.map((gap, index) => {
                const opportunityScore = Math.min(100, gap.gapScore * 10);
                const isHighOpportunity = opportunityScore > 50;

                return (
                  <motion.div
                    key={gap.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`relative overflow-hidden rounded-2xl p-6 border-2 transition-all ${
                      isHighOpportunity
                        ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-red-500/5'
                        : 'border-slate-700/50 bg-slate-800/30'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">
                            {gap.category}
                          </h4>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-blue-400" />
                              <span className="text-slate-400">
                                <span className="font-bold text-white">{gap.requestCount}</span> richieste
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-400" />
                              <span className="text-slate-400">
                                <span className="font-bold text-white">{gap.offerCount}</span> offerte
                              </span>
                            </div>
                          </div>
                        </div>
                        {isHighOpportunity && (
                          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                            <span className="text-xs font-bold text-orange-400">Alta Opportunità</span>
                          </div>
                        )}
                      </div>

                      {/* Gap Visualization */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Gap Score</span>
                          <span className="font-bold text-orange-400">
                            {opportunityScore.toFixed(0)}/100
                          </span>
                        </div>
                        <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${opportunityScore}%` }}
                            transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                            className={`h-full rounded-full ${
                              isHighOpportunity
                                ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500'
                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                            }`}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                          <span className="text-xs text-slate-400">
                            Rapporto richieste/offerte: <span className="font-bold text-white">{(gap.requestCount / Math.max(gap.offerCount, 1)).toFixed(1)}x</span>
                          </span>
                          <span className="text-xs text-orange-400 font-semibold">
                            Opportunità di mercato {isHighOpportunity ? 'alta' : 'media'}
                          </span>
                        </div>
                      </div>
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
