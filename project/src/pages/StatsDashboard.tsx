import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Download, TrendingUp, Package, Euro, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';

interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
  avgBudget: number;
}

interface MonthlyTrend {
  month: string;
  requests: number;
  avgBudget: number;
}

interface BudgetDistribution {
  range: string;
  count: number;
}

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#dc2626', '#b91c1c', '#991b1b'];

export function StatsDashboard() {
  const { user, profile } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats data
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [budgetDistribution, setBudgetDistribution] = useState<BudgetDistribution[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [avgBudget, setAvgBudget] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    if (!adminLoading && !subscriptionLoading) {
      checkAccess();
    }
  }, [adminLoading, subscriptionLoading, isAdmin, subscription]);

  useEffect(() => {
    if (user && (isAdmin || isPremiumSeller())) {
      loadStats();
    }
  }, [user, isAdmin, subscription]);

  const isPremiumSeller = () => {
    return profile?.role === 'seller' && (subscription?.plan === 'plus' || subscription?.plan === 'pro' || subscription?.plan === 'enterprise');
  };

  const checkAccess = () => {
    if (!user) {
      setError('Devi essere autenticato per accedere alle statistiche');
      window.location.href = '/';
      return;
    }

    if (!isAdmin && !isPremiumSeller()) {
      setError('Accesso negato. Solo admin e venditori premium possono accedere alle statistiche.');
      window.location.href = '/';
      return;
    }
  };

  const loadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all targets
      const { data: targets, error: targetsError } = await supabase
        .from('targets')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (targetsError) throw targetsError;

      const targetsData = targets || [];

      // Calculate total requests
      setTotalRequests(targetsData.length);

      // Calculate category statistics
      const categoryMap = new Map<string, { count: number; totalBudget: number }>();
      targetsData.forEach((target) => {
        const cat = target.category || 'Altro';
        const existing = categoryMap.get(cat) || { count: 0, totalBudget: 0 };
        categoryMap.set(cat, {
          count: existing.count + 1,
          totalBudget: existing.totalBudget + (target.budget || 0),
        });
      });

      const categoryStatsArray: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        percentage: (data.count / targetsData.length) * 100,
        avgBudget: data.count > 0 ? Math.round(data.totalBudget / data.count) : 0,
      }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setCategoryStats(categoryStatsArray);

      // Calculate monthly trends (last 6 months)
      const monthlyMap = new Map<string, { count: number; totalBudget: number }>();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      targetsData
        .filter((target) => new Date(target.created_at) >= sixMonthsAgo)
        .forEach((target) => {
          const month = new Date(target.created_at).toLocaleDateString('it-IT', { year: 'numeric', month: 'short' });
          const existing = monthlyMap.get(month) || { count: 0, totalBudget: 0 };
          monthlyMap.set(month, {
            count: existing.count + 1,
            totalBudget: existing.totalBudget + (target.budget || 0),
          });
        });

      const monthlyTrendsArray: MonthlyTrend[] = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          requests: data.count,
          avgBudget: data.count > 0 ? Math.round(data.totalBudget / data.count) : 0,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      setMonthlyTrends(monthlyTrendsArray);

      // Calculate budget distribution
      const budgetRanges = [
        { label: '0-100€', min: 0, max: 100 },
        { label: '101-500€', min: 101, max: 500 },
        { label: '501-1000€', min: 501, max: 1000 },
        { label: '1001-5000€', min: 1001, max: 5000 },
        { label: '5000+€', min: 5001, max: Infinity },
      ];

      const distributionMap = new Map<string, number>();
      budgetRanges.forEach((range) => {
        distributionMap.set(range.label, 0);
      });

      targetsData.forEach((target) => {
        const budget = target.budget || 0;
        for (const range of budgetRanges) {
          if (budget >= range.min && budget <= range.max) {
            distributionMap.set(range.label, (distributionMap.get(range.label) || 0) + 1);
            break;
          }
        }
      });

      const budgetDistributionArray: BudgetDistribution[] = Array.from(distributionMap.entries()).map(([range, count]) => ({
        range,
        count,
      }));

      setBudgetDistribution(budgetDistributionArray);

      // Calculate overall average budget
      const budgetsWithValues = targetsData.filter((t) => t.budget && t.budget > 0).map((t) => t.budget || 0);
      const avg = budgetsWithValues.length > 0
        ? Math.round(budgetsWithValues.reduce((a, b) => a + b, 0) / budgetsWithValues.length)
        : 0;
      setAvgBudget(avg);

      const total = budgetsWithValues.reduce((a, b) => a + b, 0);
      setTotalBudget(total);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const data = [
      ['Statistiche Ricerche Buyer'],
      [],
      ['Categoria', 'Numero Richieste', 'Percentuale', 'Budget Medio (€)'],
      ...categoryStats.map((stat) => [
        stat.category,
        stat.count,
        `${stat.percentage.toFixed(1)}%`,
        stat.avgBudget,
      ]),
      [],
      ['Totale Richieste', totalRequests],
      ['Budget Medio', `€${avgBudget}`],
      ['Budget Totale', `€${totalBudget}`],
    ];

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statistiche-ricerche-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToTXT = () => {
    let txt = 'STATISTICHE RICERCHE BUYER\n';
    txt += '='.repeat(50) + '\n\n';

    txt += 'Riepilogo Generale:\n';
    txt += `- Totale Richieste: ${totalRequests}\n`;
    txt += `- Budget Medio: €${avgBudget}\n`;
    txt += `- Budget Totale: €${totalBudget}\n\n`;

    txt += 'Statistiche per Categoria:\n';
    txt += '-'.repeat(50) + '\n';
    categoryStats.forEach((stat) => {
      txt += `${stat.category}: ${stat.count} richieste (${stat.percentage.toFixed(1)}%), Budget medio €${stat.avgBudget}\n`;
    });

    txt += '\nTrend Mensili (Ultimi 6 mesi):\n';
    txt += '-'.repeat(50) + '\n';
    monthlyTrends.forEach((trend) => {
      txt += `${trend.month}: ${trend.requests} richieste, Budget medio €${trend.avgBudget}\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statistiche-ricerche-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Statistiche Ricerche Buyer', 14, 20);

    doc.setFontSize(12);
    doc.text(`Totale Richieste: ${totalRequests}`, 14, 35);
    doc.text(`Budget Medio: €${avgBudget}`, 14, 42);
    doc.text(`Budget Totale: €${totalBudget}`, 14, 49);

    let y = 60;
    doc.text('Statistiche per Categoria:', 14, y);
    y += 8;

    categoryStats.slice(0, 10).forEach((stat, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(
        `${stat.category}: ${stat.count} (${stat.percentage.toFixed(1)}%), Media €${stat.avgBudget}`,
        14,
        y
      );
      y += 7;
    });

    doc.save(`statistiche-ricerche-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToXLS = () => {
    const ws1 = XLSX.utils.json_to_sheet(categoryStats.map((stat) => ({
      Categoria: stat.category,
      'Numero Richieste': stat.count,
      Percentuale: `${stat.percentage.toFixed(1)}%`,
      'Budget Medio (€)': stat.avgBudget,
    })));

    const ws2 = XLSX.utils.json_to_sheet(monthlyTrends.map((trend) => ({
      Mese: trend.month,
      Richieste: trend.requests,
      'Budget Medio (€)': trend.avgBudget,
    })));

    const ws3 = XLSX.utils.json_to_sheet([
      { Metrica: 'Totale Richieste', Valore: totalRequests },
      { Metrica: 'Budget Medio (€)', Valore: avgBudget },
      { Metrica: 'Budget Totale (€)', Valore: totalBudget },
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Categorie');
    XLSX.utils.book_append_sheet(wb, ws2, 'Trend Mensili');
    XLSX.utils.book_append_sheet(wb, ws3, 'Riepilogo');

    XLSX.writeFile(wb, `statistiche-ricerche-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading || adminLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-slate-900 text-xl">Caricamento statistiche...</div>
      </div>
    );
  }

  if (error || (!isAdmin && !isPremiumSeller())) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Accesso Negato</h1>
          <p className="text-slate-600">{error || 'Solo admin e venditori premium possono accedere alle statistiche.'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-black text-slate-900">Statistiche Ricerche Buyer</h1>
              <p className="text-xs text-slate-500">
                {isAdmin ? 'Admin Dashboard' : 'Premium Dashboard'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{profile?.full_name}</span>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-semibold"
            >
              Torna al Sito
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-orange-600" />
              <h3 className="text-sm font-semibold text-slate-600">Totale Richieste</h3>
            </div>
            <p className="text-3xl font-black text-slate-900">{totalRequests}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Euro className="w-6 h-6 text-green-600" />
              <h3 className="text-sm font-semibold text-slate-600">Budget Medio</h3>
            </div>
            <p className="text-3xl font-black text-slate-900">€{avgBudget}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-600">Budget Totale</h3>
            </div>
            <p className="text-3xl font-black text-slate-900">€{totalBudget.toLocaleString('it-IT')}</p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={exportToTXT}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            Export TXT
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={exportToXLS}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            Export XLS
          </button>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Stats Bar Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Richieste per Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#f97316" name="Numero Richieste" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget Distribution Pie Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Distribuzione Budget</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {budgetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends Line Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Trend Mensili (Ultimi 6 mesi)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="requests" stroke="#f97316" name="Richieste" strokeWidth={2} />
              <Line type="monotone" dataKey="avgBudget" stroke="#ea580c" name="Budget Medio (€)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Stats with Budget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Statistiche Dettagliate per Categoria</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Categoria</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Richieste</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Percentuale</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Budget Medio</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((stat, index) => (
                  <tr key={stat.category} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                    <td className="py-3 px-4 font-medium text-slate-900">{stat.category}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{stat.count}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{stat.percentage.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right font-semibold text-orange-600">€{stat.avgBudget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
