import { useState, useEffect } from 'react';
import { Target as TargetIcon, MapPin, Euro, Crosshair, Mail, LogOut, TrendingUp, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Target, OfferWithDetails } from '../lib/types';
import { CATEGORIES } from '../lib/types';
import { NewRequestModal } from './NewRequestModal';
import { NotificationSystem } from './NotificationSystem';
import { ChatInterface } from './ChatInterface';
import { Footer } from './Footer';

export function BuyerDashboard() {
  const { profile, signOut } = useAuth();
  const [targets, setTargets] = useState<Target[]>([]);
  const [offers, setOffers] = useState<OfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<'targets' | 'offers'>('targets');
  const [selectedChat, setSelectedChat] = useState<{ conversationId: string; otherParty: string; target: string } | null>(null);

  useEffect(() => {
    if (profile) {
      loadTargets();
      loadOffers();
    }
  }, [profile]);

  const loadTargets = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('targets')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading targets:', error);
    } else {
      setTargets(data || []);
    }
    setLoading(false);
  };

  const loadOffers = async () => {
    if (!profile) return;

    const { data: targetsData } = await supabase
      .from('targets')
      .select('id')
      .eq('user_id', profile.id);

    if (!targetsData) return;

    const targetIds = targetsData.map((r) => r.id);

    if (targetIds.length === 0) return;

    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        target:targets(*),
        seller:profiles(*)
      `)
      .in('target_id', targetIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading offers:', error);
    } else {
      setOffers(data || []);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <nav className="border-b border-slate-800/50 bg-[#0f172a]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size={44} />
            <div>
              <h1 className="text-xl font-black text-white tracking-tight italic">MY TARGET</h1>
              <p className="text-xs text-orange-500 font-medium">Dashboard Cacciatore</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-white">{profile?.full_name}</p>
              <p className="text-xs text-slate-500">{profile?.city}</p>
            </div>
            <div className="relative">
              <NotificationSystem />
            </div>
            <button
              onClick={() => signOut()}
              className="p-3 rounded-2xl bg-slate-800/50 text-slate-400 hover:text-orange-500 hover:bg-slate-800 transition-colors border border-slate-700/50"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-orange-600/10 to-transparent p-6 rounded-3xl border border-orange-600/20 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TargetIcon className="w-8 h-8 text-orange-500" />
                <h2 className="text-3xl font-black text-white">I Miei Target</h2>
              </div>
              <p className="text-slate-400">
                Gestisci i tuoi obiettivi e monitora le offerte ricevute
              </p>
            </div>
            <button
              onClick={() => setShowNewRequest(true)}
              className="flex items-center gap-3 px-8 py-4 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 hover:scale-105"
            >
              <Crosshair className="w-5 h-5" />
              Punta Nuovo Target
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6 border-b border-slate-800/50">
          <button
            onClick={() => setActiveTab('targets')}
            className={`px-6 py-4 font-bold transition-all relative ${
              activeTab === 'targets'
                ? 'text-orange-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <TargetIcon className="w-4 h-4" />
              I Miei Target ({targets.length})
            </span>
            {activeTab === 'targets' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-6 py-4 font-bold transition-all relative ${
              activeTab === 'offers'
                ? 'text-orange-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Offerte Ricevute ({offers.length})
            </span>
            {activeTab === 'offers' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-full" />
            )}
          </button>
        </div>

        {activeTab === 'targets' && (
          <div className="grid gap-6">
            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-12 h-12 border-4 border-orange-600/30 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                Caricamento target...
              </div>
            ) : targets.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800">
                <TargetIcon className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                <p className="text-slate-300 text-xl font-bold mb-2">Nessun target ancora</p>
                <p className="text-slate-500 text-sm mb-6">
                  Punta il tuo primo target e inizia a ricevere offerte dalle migliori aziende
                </p>
                <button
                  onClick={() => setShowNewRequest(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all"
                >
                  <Crosshair className="w-5 h-5" />
                  Punta il Tuo Primo Target
                </button>
              </div>
            ) : (
              targets.map((target) => (
                <div
                  key={target.id}
                  className="group bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-orange-600/50 transition-all hover:bg-slate-900/70"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-orange-600/20 flex items-center justify-center">
                          <TargetIcon className="w-5 h-5 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white group-hover:text-orange-500 transition-colors">
                          {target.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50">
                          <Crosshair className="w-4 h-4 text-orange-500" />
                          {target.category}
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          {target.location}
                        </span>
                        {target.budget && (
                          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50">
                            <Euro className="w-4 h-4 text-orange-500" />
                            Budget: {target.budget}€
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-2xl text-sm font-bold ${
                        target.status === 'active'
                          ? 'bg-gradient-to-r from-green-600/20 to-green-500/10 text-green-400 border border-green-500/50'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {target.status === 'active' ? '🎯 Attivo' : 'Chiuso'}
                    </span>
                  </div>
                  {target.description && (
                    <p className="text-slate-300 mb-6 leading-relaxed pl-13">{target.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                    <span className="text-sm text-slate-500">
                      Puntato il {new Date(target.created_at).toLocaleDateString('it-IT')}
                    </span>
                    <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600/10 text-orange-500 font-bold text-sm">
                      <TrendingUp className="w-4 h-4" />
                      {offers.filter((o) => o.target_id === target.id).length} offerte
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="grid gap-6">
            {offers.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800">
                <Mail className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                <p className="text-slate-300 text-xl font-bold mb-2">Nessuna offerta ancora</p>
                <p className="text-slate-500 text-sm">
                  Le offerte ricevute dalle aziende appariranno qui
                </p>
              </div>
            ) : (
              offers.map((offer) => (
                <div
                  key={offer.id}
                  className="group bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-orange-600/50 transition-all hover:bg-slate-900/70"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-orange-600/20 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-white mb-1 group-hover:text-orange-500 transition-colors">
                            Offerta per: {offer.target.title}
                          </h4>
                          <p className="text-sm text-slate-400">
                            Da <span className="text-white font-bold">{offer.seller.full_name}</span> • {offer.seller.city}
                          </p>
                        </div>
                      </div>
                    </div>
                    {offer.proposed_price && (
                      <div className="text-right bg-gradient-to-br from-orange-600/20 to-orange-500/10 px-6 py-4 rounded-2xl border border-orange-600/30">
                        <p className="text-xs text-slate-400 mb-1">Prezzo proposto</p>
                        <p className="text-3xl font-black text-orange-500">
                          €{offer.proposed_price}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 mb-4">
                    <p className="text-slate-200 leading-relaxed">{offer.message}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                    <span className="text-sm text-slate-500">
                      Ricevuta il {new Date(offer.created_at).toLocaleDateString('it-IT')}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        const { data: conversation } = await supabase
                          .from('conversations')
                          .select('id')
                          .eq('target_id', offer.target_id)
                          .eq('seller_id', offer.seller_id)
                          .maybeSingle();

                        if (conversation) {
                          setSelectedChat({
                            conversationId: conversation.id,
                            otherParty: offer.seller.full_name,
                            target: offer.target.title
                          });
                        } else {
                          const { data: newConv } = await supabase
                            .from('conversations')
                            .insert({
                              target_id: offer.target_id,
                              buyer_id: profile?.id,
                              seller_id: offer.seller_id
                            })
                            .select()
                            .single();

                          if (newConv) {
                            setSelectedChat({
                              conversationId: newConv.id,
                              otherParty: offer.seller.full_name,
                              target: offer.target.title
                            });
                          }
                        }
                      }}
                      className="px-6 py-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all text-sm flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Avvia Chat
                    </motion.button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showNewRequest && (
        <NewRequestModal
          onClose={() => setShowNewRequest(false)}
          onSuccess={() => {
            setShowNewRequest(false);
            loadTargets();
          }}
        />
      )}

      {selectedChat && (
        <ChatInterface
          conversationId={selectedChat.conversationId}
          otherPartyName={selectedChat.otherParty}
          targetTitle={selectedChat.target}
          onClose={() => setSelectedChat(null)}
        />
      )}

      <Footer />
    </div>
  );
}
