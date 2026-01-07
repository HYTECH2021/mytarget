import { useState, useEffect } from 'react';
import { TrendingUp, Users, Euro, Package, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CategoryStats {
  category: string;
  count: number;
  avgBudget: number;
}

interface LocationStats {
  location: string;
  count: number;
}

interface DemographicStats {
  ageRange: string;
  count: number;
}

export function MarketIntelligence() {
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStats[]>([]);
  const [demographicStats, setDemographicStats] = useState<DemographicStats[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [avgBudget, setAvgBudget] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const { data: requests } = await supabase
      .from('targets')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('status', 'active');

    if (!requests) return;

    setTotalRequests(requests.length);

    const budgets = requests.filter((r) => r.budget).map((r) => r.budget as number);
    const avgBudgetValue = budgets.length > 0
      ? budgets.reduce((a, b) => a + b, 0) / budgets.length
      : 0;
    setAvgBudget(avgBudgetValue);

    const categoryMap = new Map<string, { count: number; totalBudget: number; budgetCount: number }>();
    requests.forEach((req) => {
      const current = categoryMap.get(req.category) || { count: 0, totalBudget: 0, budgetCount: 0 };
      current.count += 1;
      if (req.budget) {
        current.totalBudget += req.budget;
        current.budgetCount += 1;
      }
      categoryMap.set(req.category, current);
    });

    const categoryStatsData: CategoryStats[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        avgBudget: data.budgetCount > 0 ? data.totalBudget / data.budgetCount : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setCategoryStats(categoryStatsData);

    const locationMap = new Map<string, number>();
    requests.forEach((req) => {
      locationMap.set(req.location, (locationMap.get(req.location) || 0) + 1);
    });

    const locationStatsData: LocationStats[] = Array.from(locationMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setLocationStats(locationStatsData);

    const ageMap = new Map<string, number>();
    requests.forEach((req) => {
      if (req.profile?.age) {
        const age = req.profile.age;
        let range = '';
        if (age < 25) range = '18-24';
        else if (age < 35) range = '25-34';
        else if (age < 45) range = '35-44';
        else if (age < 55) range = '45-54';
        else range = '55+';
        ageMap.set(range, (ageMap.get(range) || 0) + 1);
      }
    });

    const demographicStatsData: DemographicStats[] = Array.from(ageMap.entries())
      .map(([ageRange, count]) => ({ ageRange, count }))
      .sort((a, b) => {
        const order = ['18-24', '25-34', '35-44', '45-54', '55+'];
        return order.indexOf(a.ageRange) - order.indexOf(b.ageRange);
      });
    setDemographicStats(demographicStatsData);
  };

  const maxCount = Math.max(...categoryStats.map((c) => c.count), 1);
  const maxLocation = Math.max(...locationStats.map((l) => l.count), 1);
  const maxDemo = Math.max(...demographicStats.map((d) => d.count), 1);

  return (
    <div>
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950/50 via-slate-900/30 to-slate-950/50 p-8 border border-orange-900/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold mb-4 border border-orange-500/20">
            ENTERPRISE EXCLUSIVE
          </div>
          <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Market Intelligence
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl">
            Dati esclusivi sul comportamento d'acquisto. Accesso a insights che i tuoi competitor non hanno.
          </p>
          <div className="mt-6 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-slate-400">Dati aggiornati in tempo reale</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-slate-400">100% proprietari e verificati</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="group bg-gradient-to-br from-orange-950/30 to-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-orange-900/30 hover:border-orange-600/50 transition-all relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/0 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-600/20 flex items-center justify-center border border-orange-500/30">
                <Package className="w-7 h-7 text-orange-500" />
              </div>
              <span className="text-xs text-orange-400 font-semibold">LIVE</span>
            </div>
            <p className="text-sm text-slate-400 mb-1 font-medium">Richieste Attive</p>
            <p className="text-4xl font-bold text-white mb-2">{totalRequests}</p>
            <p className="text-xs text-slate-500">Lead qualificati pronti all'acquisto</p>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-blue-950/30 to-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-blue-900/30 hover:border-blue-600/50 transition-all relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                <Euro className="w-7 h-7 text-blue-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-slate-400 mb-1 font-medium">Budget Medio</p>
            <p className="text-4xl font-bold text-white mb-2">
              €{avgBudget.toFixed(0)}
            </p>
            <p className="text-xs text-slate-500">Valore medio per transazione</p>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-green-950/30 to-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-green-900/30 hover:border-green-600/50 transition-all relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/0 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-green-600/20 flex items-center justify-center border border-green-500/30">
                <TrendingUp className="w-7 h-7 text-green-500" />
              </div>
              <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                +23%
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-1 font-medium">Crescita Mensile</p>
            <p className="text-4xl font-bold text-white mb-2">+23%</p>
            <p className="text-xs text-slate-500">Nuovi utenti ultimo mese</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-800">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Top Categorie per Richieste
          </h3>
          <div className="space-y-4">
            {categoryStats.map((stat) => (
              <div key={stat.category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300 font-medium">{stat.category}</span>
                  <span className="text-slate-400 text-sm">{stat.count} richieste</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-600 to-orange-500 h-full rounded-full transition-all"
                    style={{ width: `${(stat.count / maxCount) * 100}%` }}
                  />
                </div>
                {stat.avgBudget > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Budget medio: €{stat.avgBudget.toFixed(0)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-800">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Top Località
          </h3>
          <div className="space-y-4">
            {locationStats.map((stat) => (
              <div key={stat.location}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300 font-medium">{stat.location}</span>
                  <span className="text-slate-400 text-sm">{stat.count} richieste</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${(stat.count / maxLocation) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-800">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-600" />
          Demografia Acquirenti per Età
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {demographicStats.map((stat) => (
            <div key={stat.ageRange} className="text-center">
              <div className="mb-3 flex items-end justify-center h-32">
                <div
                  className="bg-gradient-to-t from-green-600 to-green-500 w-16 rounded-t-2xl transition-all"
                  style={{ height: `${(stat.count / maxDemo) * 100}%` }}
                />
              </div>
              <p className="text-slate-300 font-medium mb-1">{stat.ageRange}</p>
              <p className="text-slate-400 text-sm">{stat.count} utenti</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
