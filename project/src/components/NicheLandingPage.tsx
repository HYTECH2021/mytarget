import { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Euro, Package } from 'lucide-react';
import Logo from './Logo';
import { supabase } from '../lib/supabase';
import type { TargetWithProfile } from '../lib/types';
import { AuthModal } from './AuthModal';

interface NicheLandingPageProps {
  category: string;
  location?: string;
  onGetStarted: (role: 'buyer' | 'seller') => void;
}

export function NicheLandingPage({ category, location, onGetStarted }: NicheLandingPageProps) {
  const [requests, setRequests] = useState<TargetWithProfile[]>([]);
  const [stats, setStats] = useState({ count: 0, avgBudget: 0 });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<'buyer' | 'seller'>('seller');

  useEffect(() => {
    loadRequests();
    loadStats();
  }, [category, location]);

  const loadRequests = async () => {
    let query = supabase
      .from('targets')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('status', 'active')
      .eq('category', category);

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading requests:', error);
    } else {
      setRequests(data || []);
    }
  };

  const loadStats = async () => {
    let query = supabase
      .from('targets')
      .select('budget', { count: 'exact' })
      .eq('status', 'active')
      .eq('category', category);

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Error loading stats:', error);
    } else {
      const budgets = (data || []).filter((r) => r.budget).map((r) => r.budget as number);
      const avg = budgets.length > 0 ? budgets.reduce((a, b) => a + b, 0) / budgets.length : 0;
      setStats({ count: count || 0, avgBudget: avg });
    }
  };

  const handleGetStarted = (role: 'buyer' | 'seller') => {
    setAuthRole(role);
    setShowAuthModal(true);
  };

  const categoryDescriptions: Record<string, { title: string; description: string; benefit: string }> = {
    'Elettronica': {
      title: 'Elettronica',
      description: 'Trova i migliori dispositivi elettronici al prezzo giusto',
      benefit: 'Risparmia fino al 40% confrontando offerte da negozi verificati',
    },
    'Auto e Moto': {
      title: 'Auto e Moto',
      description: 'Cerca il veicolo perfetto o vendi il tuo',
      benefit: 'Connettiti con concessionari e privati nella tua zona',
    },
    'Casa e Giardino': {
      title: 'Casa e Giardino',
      description: 'Arreda la tua casa con le migliori offerte',
      benefit: 'Ricevi preventivi personalizzati da professionisti del settore',
    },
    'Moda e Abbigliamento': {
      title: 'Moda e Abbigliamento',
      description: 'Scopri le ultime tendenze della moda',
      benefit: 'Accedi a offerte esclusive dai migliori brand',
    },
  };

  const categoryInfo = categoryDescriptions[category] || {
    title: category,
    description: `Trova quello che cerchi in ${category}`,
    benefit: 'Ricevi offerte personalizzate dalle migliori aziende',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size={40} showText={false} blackBg={true} className="text-blue-600" />
            <div>
              <span className="text-2xl font-bold text-white">I-LOOK For</span>
              <p className="text-xs text-slate-400">Non cercare, fatti trovare</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => handleGetStarted('seller')}
              className="px-6 py-2 rounded-2xl bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors"
            >
              Sono un Venditore
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 text-sm font-semibold mb-6">
            {category} {location && `• ${location}`}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {categoryInfo.title}
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              senza cercare
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            {categoryInfo.description}
          </p>
          <button
            onClick={() => handleGetStarted('buyer')}
            className="px-10 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 hover:scale-105"
          >
            Pubblica la Tua Richiesta Gratis
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-800 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stats.count}</div>
            <p className="text-slate-400">Richieste Attive</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-800 text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-600/10 flex items-center justify-center mx-auto mb-4">
              <Euro className="w-7 h-7 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              €{stats.avgBudget > 0 ? stats.avgBudget.toFixed(0) : '---'}
            </div>
            <p className="text-slate-400">Budget Medio</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-800 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-600/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">24h</div>
            <p className="text-slate-400">Tempo Medio di Risposta</p>
          </div>
        </div>

        {requests.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Richieste Recenti in {category}
            </h2>
            <div className="grid gap-6">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-800 hover:border-blue-600/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{request.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-4 h-4" />
                          {request.location}
                        </span>
                        {request.budget && (
                          <span className="flex items-center gap-1 text-orange-400 font-medium">
                            <Euro className="w-4 h-4" />
                            Budget: {request.budget}€
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {request.description && (
                    <p className="text-slate-300 line-clamp-2">{request.description}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <button
                onClick={() => handleGetStarted('seller')}
                className="px-8 py-4 rounded-2xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/30"
              >
                Accedi per Vedere Tutte le Richieste
              </button>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-600/20 to-orange-600/20 p-10 rounded-3xl border border-blue-600/30 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{categoryInfo.benefit}</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Unisciti a centinaia di {category === 'Auto e Moto' ? 'acquirenti' : 'utenti'} che hanno
            già trovato quello che cercavano su I-LOOK For
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleGetStarted('buyer')}
              className="px-8 py-4 rounded-2xl bg-white text-slate-950 font-bold hover:bg-slate-100 transition-all"
            >
              Pubblica Richiesta
            </button>
            <button
              onClick={() => handleGetStarted('seller')}
              className="px-8 py-4 rounded-2xl border-2 border-white text-white font-bold hover:bg-white hover:text-slate-950 transition-all"
            >
              Inizia a Vendere
            </button>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialRole={authRole}
      />
    </div>
  );
}
