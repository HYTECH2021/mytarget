import { useState, useEffect } from 'react';
import { Target, Crosshair, MapPin, Euro, TrendingUp, CreditCard, LogOut, Send, BarChart3, Shield, SlidersHorizontal, Lock, Unlock, MessageCircle, AlertCircle, LogIn, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { TargetWithProfile, CategoryData } from '../lib/types';
import { SendOfferModal } from './SendOfferModal';
import { SubscriptionPlans } from './SubscriptionPlans';
import { MarketIntelligence } from './MarketIntelligence';
import { AdminPanel } from './AdminPanel';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useSubscription } from '../hooks/useSubscription';
import { NotificationSystem } from './NotificationSystem';
import { PrivateChat } from './PrivateChat';
import { Footer } from './Footer';

type ViewMode = 'feed' | 'conversations' | 'subscriptions' | 'analytics' | 'admin';

interface ConversationWithDetails {
  id: string;
  target_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  buyer: {
    full_name: string;
    city: string;
  };
  target: {
    title: string;
  };
}

interface SellerDashboardProps {
  isGuest?: boolean;
  onAuthRequired?: (role: 'buyer' | 'seller') => void;
  onBack?: () => void;
}

export function SellerDashboard({ isGuest = false, onAuthRequired, onBack }: SellerDashboardProps = {}) {
  const { profile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { subscription, dailyLimits, upgradePlan, checkCanSendOffers, incrementOffersSent } = useSubscription();
  const [targets, setTargets] = useState<TargetWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [selectedTarget, setSelectedTarget] = useState<TargetWithProfile | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [unlockedLeads, setUnlockedLeads] = useState<Set<string>>(new Set());
  const [selectedChat, setSelectedChat] = useState<{ 
    conversationId: string;
    targetId: string;
    buyerId: string;
    sellerId: string;
    otherParty: string; 
    target: string;
  } | null>(null);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [filters, setFilters] = useState({
    category: 'Tutte',
    location: '',
  });

  useEffect(() => {
    loadTargets();
    loadCategories();
    if (profile && !isGuest) {
      loadUnlockedLeads();
      loadConversations();
    }
  }, [profile, isGuest]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const loadTargets = async () => {
    const { data, error } = await supabase
      .from('targets')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading targets:', error);
    } else {
      setTargets(data || []);
    }
    setLoading(false);
  };


  const loadUnlockedLeads = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('unlocked_leads')
      .select('target_id')
      .eq('seller_id', profile.id);

    if (error) {
      console.error('Error loading unlocked leads:', error);
    } else if (data) {
      setUnlockedLeads(new Set(data.map(ul => ul.target_id)));
    }
  };

  const loadConversations = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        buyer:profiles!conversations_buyer_id_fkey(full_name, city),
        target:targets(title)
      `)
      .eq('seller_id', profile.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
    } else {
      setConversations(data || []);
    }
  };

  const handleUnlockLead = async (targetId: string) => {
    if (!profile) return;

    const { error } = await supabase
      .from('unlocked_leads')
      .insert({
        seller_id: profile.id,
        target_id: targetId
      });

    if (error) {
      console.error('Error unlocking lead:', error);
    } else {
      setUnlockedLeads(prev => new Set([...prev, targetId]));
    }
  };

  const filteredTargets = targets.filter((req) => {
    if (filters.category !== 'Tutte' && req.category !== filters.category) {
      return false;
    }
    if (filters.location && !req.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    return true;
  });

  const canAccessAnalytics = subscription?.plan === 'enterprise';

  return (
    <div className="min-h-screen bg-gray-200">
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-gray-100 text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors border border-slate-200 hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Logo size={44} showText={false} blackBg={false} />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight italic">MY TARGET</h1>
              <p className="text-xs text-orange-600 font-medium">
                {isGuest ? 'Modalità Ospite' : 'Dashboard Business Hunter'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isGuest ? (
              <button
                onClick={() => onAuthRequired?.('seller')}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <LogIn className="w-5 h-5" />
                Accedi o Registrati
              </button>
            ) : (
              <>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{profile?.full_name}</p>
                  <p className="text-xs text-orange-600 font-bold">
                    {subscription?.plan ? subscription.plan.toUpperCase() : 'FREE'}
                  </p>
                </div>
                <div className="relative">
                  <NotificationSystem />
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-3 rounded-2xl bg-gray-100 text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors border border-slate-200 hover:scale-105 active:scale-95"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isGuest && dailyLimits && dailyLimits.plan === 'free' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-semibold text-white">Limiti Piano FREE</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Offerte Questo Mese</p>
                  <p className="text-sm font-bold text-white">
                    {dailyLimits.offers_sent} / {dailyLimits.offers_limit}
                  </p>
                </div>
                <button
                  onClick={() => setViewMode('subscriptions')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-bold hover:from-orange-500 hover:to-orange-400 transition-all"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-6 rounded-3xl border border-blue-300 mb-8 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <Crosshair className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-black text-slate-900">Feed Target</h2>
          </div>
          <p className="text-slate-700">
            Trova lead caldi prima della concorrenza. Prevedi la domanda e colpisci al momento giusto.
          </p>
        </div>

        {!isGuest && (
          <div className="flex gap-4 mb-6 border-b border-slate-800/50">
            <button
              onClick={() => setViewMode('feed')}
              className={`px-6 py-4 font-bold transition-all relative flex items-center gap-2 ${
                viewMode === 'feed' ? 'text-orange-500' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              Target Disponibili
              {viewMode === 'feed' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setViewMode('conversations')}
              className={`px-6 py-4 font-bold transition-all relative flex items-center gap-2 ${
                viewMode === 'conversations' ? 'text-orange-500' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Conversazioni ({conversations.length})
              {viewMode === 'conversations' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setViewMode('subscriptions')}
              className={`px-6 py-4 font-bold transition-all relative flex items-center gap-2 ${
                viewMode === 'subscriptions' ? 'text-orange-500' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Piano
              {viewMode === 'subscriptions' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              disabled={!canAccessAnalytics}
              className={`px-6 py-4 font-bold transition-all relative flex items-center gap-2 ${
                viewMode === 'analytics'
                  ? 'text-orange-500'
                  : canAccessAnalytics
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Intelligence
              {!canAccessAnalytics && (
                <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded-full font-bold">
                  Enterprise
                </span>
              )}
              {viewMode === 'analytics' && canAccessAnalytics && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-full" />
              )}
            </button>
            {isAdmin && (
              <button
                onClick={() => setViewMode('admin')}
                className={`px-6 py-4 font-bold transition-all relative flex items-center gap-2 ${
                  viewMode === 'admin' ? 'text-orange-500' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
                {viewMode === 'admin' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-full" />
                )}
              </button>
            )}
          </div>
        )}

        {(isGuest || viewMode === 'feed') && (
          <>
            <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-600/20 flex items-center justify-center">
                  <SlidersHorizontal className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Affina la Mira</h3>
                  <p className="text-sm text-slate-400">Filtra i target più rilevanti per te</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3">
                    Categoria Target
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all"
                  >
                    <option value="Tutte">🎯 Tutti i target</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3">
                    Località
                  </label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    placeholder="Filtra per città..."
                    className="w-full px-5 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {loading ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="w-16 h-16 border-4 border-orange-600/30 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="font-bold">Scansione target in corso...</p>
                </div>
              ) : filteredTargets.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800">
                  <Target className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                  <p className="text-slate-300 text-xl font-bold mb-2">Nessun target trovato</p>
                  <p className="text-slate-500 text-sm">
                    Prova a modificare i filtri per trovare nuovi target
                  </p>
                </div>
              ) : (
                filteredTargets.map((target, index) => (
                  <div key={target.id}>
                    {index === 2 && (
                      <div className="relative bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-transparent p-8 rounded-3xl border-2 border-orange-600/40 mb-6 overflow-hidden">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjAuNSIgY3g9IjMwIiBjeT0iMzAiIHI9IjE1Ii8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600/30 border border-orange-500/50">
                              <TrendingUp className="w-4 h-4 text-orange-400" />
                              <span className="text-orange-300 text-xs font-black tracking-wide">POTENZIA LA TUA MIRA</span>
                            </div>
                          </div>
                          <h3 className="text-2xl font-black text-white mb-3">
                            Diventa un Hunter PRO
                          </h3>
                          <p className="text-slate-200 mb-6 leading-relaxed">
                            Lead illimitati, badge verificato e accesso prioritario ai target più caldi. Colpisci prima della concorrenza.
                          </p>
                          <button
                            onClick={() => setViewMode('subscriptions')}
                            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30"
                          >
                            Scopri i Piani PRO
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="group bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-orange-600/50 transition-all hover:bg-slate-900/70">

                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-orange-600/20 flex items-center justify-center flex-shrink-0">
                        <Target className="w-7 h-7 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-white mb-3 group-hover:text-orange-500 transition-colors">
                          {target.title}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm mb-4">
                          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50">
                            <Crosshair className="w-4 h-4 text-orange-500" />
                            {target.category}
                          </span>
                          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            {target.location}
                          </span>
                          {target.budget && (
                            <span className="flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-600/20 to-orange-500/10 text-orange-400 border border-orange-600/30 font-bold">
                              <Euro className="w-4 h-4" />
                              Budget: {target.budget}€
                            </span>
                          )}
                        </div>
                        {target.description && (
                          <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 mb-4">
                            <p className="text-slate-200 leading-relaxed">{target.description}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="font-medium">
                              🎯 <span className={unlockedLeads.has(target.id) ? "text-white font-bold" : "text-slate-600 blur-sm"}>{unlockedLeads.has(target.id) ? target.profile.full_name : "••••••"}</span> • {unlockedLeads.has(target.id) ? target.profile.city : "••••"}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(target.created_at).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                          {isGuest ? (
                            <button
                              onClick={() => onAuthRequired?.('seller')}
                              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 hover:scale-105 active:scale-95"
                            >
                              <LogIn className="w-5 h-5" />
                              Registrati per Inviare Offerta
                            </button>
                          ) : unlockedLeads.has(target.id) ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedTarget(target)}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 hover:scale-105 active:scale-95"
                              >
                                <Send className="w-5 h-5" />
                                Invia Offerta
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleUnlockLead(target.id)}
                              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-600 border-2 border-orange-600/50 text-white font-bold hover:from-slate-600 hover:to-slate-500 transition-all hover:scale-105 active:scale-95"
                            >
                              <Unlock className="w-5 h-5 text-orange-500" />
                              Sblocca Lead
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {!isGuest && viewMode === 'conversations' && (
          <div className="grid gap-6">
            {conversations.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800">
                <MessageCircle className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                <p className="text-slate-300 text-xl font-bold mb-2">Nessuna conversazione</p>
                <p className="text-slate-500 text-sm">
                  Le conversazioni con i buyers appariranno qui quando avvieranno la chat
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="group bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-orange-600/50 transition-all hover:bg-slate-900/70 hover:scale-[1.01] cursor-pointer"
                  onClick={() => {
                    if (!profile) return;
                    setSelectedChat({
                      conversationId: conversation.id,
                      targetId: conversation.target_id,
                      buyerId: conversation.buyer_id,
                      sellerId: profile.id,
                      otherParty: conversation.buyer.full_name,
                      target: conversation.target.title
                    });
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-600/20 flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white group-hover:text-orange-500 transition-colors">
                            {conversation.buyer.full_name}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {conversation.buyer.city}
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 mb-4">
                        <p className="text-sm text-slate-300 mb-1">
                          <span className="text-slate-500">Target:</span> {conversation.target.title}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          Ultima attività: {new Date(conversation.updated_at).toLocaleDateString('it-IT')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          conversation.status === 'active'
                            ? 'bg-green-600/20 text-green-400 border border-green-500/50'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                        }`}>
                          {conversation.status === 'active' ? 'Attiva' : conversation.status === 'archived' ? 'Archiviata' : 'Chiusa'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!profile) return;
                        setSelectedChat({
                          conversationId: conversation.id,
                          targetId: conversation.target_id,
                          buyerId: conversation.buyer_id,
                          sellerId: profile.id,
                          otherParty: conversation.buyer.full_name,
                          target: conversation.target.title
                        });
                      }}
                      className="px-6 py-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all text-sm flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chatta con buyer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!isGuest && viewMode === 'subscriptions' && (
          <SubscriptionPlans
            currentPlan={subscription?.plan || 'free'}
            onUpgrade={upgradePlan}
          />
        )}

        {!isGuest && viewMode === 'analytics' && canAccessAnalytics && <MarketIntelligence />}

        {!isGuest && viewMode === 'admin' && isAdmin && <AdminPanel />}
      </div>

      {!isGuest && selectedTarget && (
        <SendOfferModal
          target={selectedTarget}
          onClose={() => setSelectedTarget(null)}
          onSuccess={() => {
            setSelectedTarget(null);
            loadTargets();
          }}
        />
      )}

      {selectedChat && (
        <PrivateChat
          conversationId={selectedChat.conversationId}
          targetId={selectedChat.targetId}
          buyerId={selectedChat.buyerId}
          sellerId={selectedChat.sellerId}
          otherPartyName={selectedChat.otherParty}
          targetTitle={selectedChat.target}
          onClose={() => setSelectedChat(null)}
        />
      )}

      <Footer />
    </div>
  );
}

                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChat({
                          conversationId: conversation.id,
                          otherParty: conversation.buyer.full_name,
                          target: conversation.target.title
                        });
                      }}
                      className="ml-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Apri Chat
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!isGuest && viewMode === 'subscriptions' && (
          <SubscriptionPlans
            currentPlan={subscription?.plan || 'free'}
            onUpgrade={upgradePlan}
          />
        )}

        {!isGuest && viewMode === 'analytics' && canAccessAnalytics && <MarketIntelligence />}

        {!isGuest && viewMode === 'admin' && isAdmin && <AdminPanel />}
      </div>

      {!isGuest && selectedTarget && (
        <SendOfferModal
          target={selectedTarget}
          onClose={() => setSelectedTarget(null)}
          onSuccess={() => {
            setSelectedTarget(null);
            loadTargets();
          }}
        />
      )}

      {selectedChat && (
        <PrivateChat
          conversationId={selectedChat.conversationId}
          targetId={selectedChat.targetId}
          buyerId={selectedChat.buyerId}
          sellerId={selectedChat.sellerId}
          otherPartyName={selectedChat.otherParty}
          targetTitle={selectedChat.target}
          onClose={() => setSelectedChat(null)}
        />
      )}

      <Footer />
    </div>
  );
}
