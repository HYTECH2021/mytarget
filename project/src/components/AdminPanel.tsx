import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X, TrendingUp, Users, Package, AlertCircle, BarChart3, PieChart, Activity, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PendingCategory {
  id: string;
  name: string;
  status: string;
  suggested_by: string;
  created_at: string;
  suggester?: {
    full_name: string;
    city: string;
  };
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  city: string;
  profession: string;
  age_range: string;
  created_at: string;
}

interface AnalyticsData {
  trendingCategories: { category: string; count: number }[];
  professionStats: { profession: string; count: number }[];
  ageStats: { age_range: string; count: number }[];
  matchingRate: number;
  totalConversations: number;
}

type TabMode = 'categories' | 'analytics' | 'users';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabMode>('categories');
  const [pendingCategories, setPendingCategories] = useState<PendingCategory[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    trendingCategories: [],
    professionStats: [],
    ageStats: [],
    matchingRate: 0,
    totalConversations: 0,
  });
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    pendingSuggestions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      activeTab === 'categories' && loadPendingCategories(),
      activeTab === 'analytics' && loadAnalytics(),
      activeTab === 'users' && loadUsers(),
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    const [requestsRes, usersRes, buyersRes, sellersRes, suggestionsRes] = await Promise.all([
      supabase.from('targets').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'buyer'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller'),
      supabase.from('category_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    setStats({
      totalRequests: requestsRes.count || 0,
      totalUsers: usersRes.count || 0,
      totalBuyers: buyersRes.count || 0,
      totalSellers: sellersRes.count || 0,
      pendingSuggestions: suggestionsRes.count || 0,
    });
  };

  const loadPendingCategories = async () => {
    const { data, error } = await supabase
      .from('category_suggestions')
      .select(`
        *,
        suggester:profiles!category_suggestions_suggested_by_fkey(full_name, city)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading pending categories:', error);
    } else {
      setPendingCategories(data || []);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, city, profession, age_range, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading users:', error);
    } else {
      setUsers(data || []);
    }
  };

  const loadAnalytics = async () => {
    const { data: requests } = await supabase
      .from('targets')
      .select('category');

    const { data: profiles } = await supabase
      .from('profiles')
      .select('profession, age_range');

    const { data: conversations } = await supabase
      .from('conversations')
      .select('id');

    const { data: offers } = await supabase
      .from('offers')
      .select('id');

    const categoryCount: Record<string, number> = {};
    requests?.forEach(r => {
      categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
    });

    const professionCount: Record<string, number> = {};
    const ageCount: Record<string, number> = {};

    profiles?.forEach(p => {
      if (p.profession) {
        professionCount[p.profession] = (professionCount[p.profession] || 0) + 1;
      }
      if (p.age_range) {
        ageCount[p.age_range] = (ageCount[p.age_range] || 0) + 1;
      }
    });

    const trendingCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    const professionStats = Object.entries(professionCount)
      .sort((a, b) => b[1] - a[1])
      .map(([profession, count]) => ({ profession, count }));

    const ageStats = Object.entries(ageCount)
      .sort((a, b) => b[1] - a[1])
      .map(([age_range, count]) => ({ age_range, count }));

    const matchingRate = offers?.length && requests?.length
      ? Math.round((offers.length / requests.length) * 100)
      : 0;

    setAnalytics({
      trendingCategories,
      professionStats,
      ageStats,
      matchingRate,
      totalConversations: conversations?.length || 0,
    });
  };

  const handleApproveCategory = async (category: PendingCategory) => {
    const slug = category.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { error: categoryError } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        slug: slug,
        is_active: true,
      });

    if (categoryError) {
      console.error('Error creating category:', categoryError);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from('category_suggestions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq('id', category.id);

    if (updateError) {
      console.error('Error updating category:', updateError);
    } else {
      await loadData();
    }
  };

  const handleRejectCategory = async (categoryId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('category_suggestions')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq('id', categoryId);

    if (error) {
      console.error('Error rejecting category:', error);
    } else {
      await loadData();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">Admin Control Panel</h2>
          <p className="text-sm text-orange-500 font-bold">HYTECH srl • Accesso Amministratore</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 backdrop-blur-sm p-6 rounded-3xl border border-orange-600/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/30 flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-orange-300 font-bold">Target Totali</p>
              <p className="text-3xl font-black text-white">{stats.totalRequests}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-green-600/20 to-green-500/10 backdrop-blur-sm p-6 rounded-3xl border border-green-600/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-600/30 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-green-300 font-bold">Cacciatori</p>
              <p className="text-3xl font-black text-white">{stats.totalBuyers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 backdrop-blur-sm p-6 rounded-3xl border border-orange-600/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/30 flex items-center justify-center">
              <UserX className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-orange-300 font-bold">Business Hunter</p>
              <p className="text-3xl font-black text-white">{stats.totalSellers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 backdrop-blur-sm p-6 rounded-3xl border border-orange-600/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-orange-300 font-bold">In Attesa</p>
              <p className="text-3xl font-black text-white">{stats.pendingSuggestions}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-2 p-2 bg-slate-900/50 rounded-3xl border border-slate-800">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all ${
            activeTab === 'categories'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5 inline-block mr-2" />
          Gestione Categorie
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5 inline-block mr-2" />
          Analytics Hub
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5 inline-block mr-2" />
          User Management
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-orange-600/30 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <>
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {pendingCategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 backdrop-blur-sm p-6 rounded-3xl border border-orange-600/30"
                >
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    Categorie in Attesa di Approvazione ({pendingCategories.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingCategories.map((category) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-900/50 p-5 rounded-2xl border border-orange-600/30 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">
                            {category.name}
                          </h4>
                          {category.suggester && (
                            <p className="text-sm text-slate-400">
                              Suggerita da: <span className="text-orange-400 font-bold">{category.suggester.full_name}</span> ({category.suggester.city})
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(category.created_at).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleApproveCategory(category)}
                            className="p-3 rounded-2xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg"
                          >
                            <Check className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRejectCategory(category.id)}
                            className="p-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg"
                          >
                            <X className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {pendingCategories.length === 0 && (
                <div className="text-center py-12 bg-slate-900/30 rounded-3xl border border-slate-800">
                  <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg font-bold">Nessuna categoria in attesa</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 backdrop-blur-sm p-6 rounded-3xl border border-orange-600/30"
                >
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    Top 5 Categorie Trending
                  </h3>
                  <div className="space-y-3">
                    {analytics.trendingCategories.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-600/30 flex items-center justify-center">
                          <span className="text-sm font-black text-orange-400">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-white font-bold">{item.category}</span>
                            <span className="text-orange-400 font-bold">{item.count}</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
                              style={{ width: `${(item.count / analytics.trendingCategories[0]?.count) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-green-600/20 to-green-500/10 backdrop-blur-sm p-6 rounded-3xl border border-green-600/30"
                >
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    Tasso di Matching
                  </h3>
                  <div className="text-center">
                    <div className="relative inline-block">
                      <svg className="w-48 h-48 transform -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-slate-800"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 80}`}
                          strokeDashoffset={`${2 * Math.PI * 80 * (1 - analytics.matchingRate / 100)}`}
                          className="text-green-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div>
                          <p className="text-5xl font-black text-white">{analytics.matchingRate}%</p>
                          <p className="text-sm text-green-400 font-bold">Success Rate</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-400 mt-4">
                      <span className="text-white font-bold">{analytics.totalConversations}</span> conversazioni attive
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 backdrop-blur-sm p-6 rounded-3xl border border-orange-600/30"
                >
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-400" />
                    Demografia: Professioni
                  </h3>
                  <div className="space-y-3">
                    {analytics.professionStats.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-600/30 flex items-center justify-center">
                          <span className="text-xs font-black text-orange-400">{item.count}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-white font-bold text-sm">{item.profession || 'Non specificata'}</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
                              style={{ width: `${(item.count / analytics.professionStats[0]?.count) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 backdrop-blur-sm p-6 rounded-3xl border border-orange-600/30"
                >
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-orange-400" />
                    Demografia: Età
                  </h3>
                  <div className="space-y-3">
                    {analytics.ageStats.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-600/30 flex items-center justify-center">
                          <span className="text-xs font-black text-orange-400">{item.count}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-white font-bold text-sm">{item.age_range || 'Non specificata'}</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
                              style={{ width: `${(item.count / analytics.ageStats[0]?.count) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-800"
            >
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Utenti Registrati ({users.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 text-slate-400 font-bold text-sm">Nome</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-bold text-sm">Email</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-bold text-sm">Ruolo</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-bold text-sm">Città</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-bold text-sm">Professione</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-bold text-sm">Età</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-bold text-sm">Registrato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-white font-bold">{user.full_name}</td>
                        <td className="py-3 px-4 text-slate-400 text-sm">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.role === 'buyer'
                              ? 'bg-green-600/20 text-green-400'
                              : user.role === 'seller'
                              ? 'bg-orange-600/20 text-orange-400'
                              : 'bg-orange-600/20 text-orange-400'
                          }`}>
                            {user.role === 'buyer' ? 'Cacciatore' : user.role === 'seller' ? 'Business Hunter' : 'Admin'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-sm">{user.city}</td>
                        <td className="py-3 px-4 text-slate-400 text-sm">{user.profession || '-'}</td>
                        <td className="py-3 px-4 text-slate-400 text-sm">{user.age_range || '-'}</td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {new Date(user.created_at).toLocaleDateString('it-IT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
