import { useState, useEffect } from 'react';
import { Target as TargetIcon, MapPin, Euro, Crosshair, Mail, LogOut, TrendingUp, MessageCircle, LogIn, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Target, OfferWithDetails } from '../lib/types';
import { CATEGORIES } from '../lib/types';
import { NewRequestModal } from './NewRequestModal';
import { NotificationSystem } from './NotificationSystem';
import { PrivateChat } from './PrivateChat';
import { Footer } from './Footer';

interface BuyerDashboardProps {
  isGuest?: boolean;
  onAuthRequired?: (role: 'buyer' | 'seller') => void;
  onBack?: () => void;
}

export function BuyerDashboard({ isGuest = false, onAuthRequired, onBack }: BuyerDashboardProps = {}) {
  const { profile, signOut } = useAuth();
  const [targets, setTargets] = useState<Target[]>([]);
  const [offers, setOffers] = useState<OfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<'targets' | 'offers'>('targets');
  const [selectedChat, setSelectedChat] = useState<{ 
    conversationId: string; 
    targetId: string;
    buyerId: string;
    sellerId: string;
    otherParty: string; 
    target: string;
  } | null>(null);

  useEffect(() => {
    if (isGuest) {
      loadPublicTargets();
    } else if (profile) {
      loadTargets();
      loadOffers();
    }
  }, [profile, isGuest]);

  const loadPublicTargets = async () => {
    const { data, error } = await supabase
      .from('targets')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading public targets:', error);
    } else {
      setTargets(data || []);
    }
    setLoading(false);
  };

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

  const handleNewTargetClick = () => {
    if (isGuest && onAuthRequired) {
      onAuthRequired('buyer');
    } else {
      setShowNewRequest(true);
    }
  };

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
                {isGuest ? 'Modalità Ospite' : 'Dashboard Cacciatore'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isGuest ? (
              <button
                onClick={() => onAuthRequired?.('buyer')}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <LogIn className="w-5 h-5" />
                Accedi o Registrati
              </button>
            ) : (
              <>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{profile?.full_name}</p>
                  <p className="text-xs text-slate-500">{profile?.city}</p>
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
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-6 rounded-3xl border border-blue-300 mb-8 shadow-sm transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TargetIcon className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-black text-slate-900">
                  {isGuest ? 'Ricerche Attive' : 'I Miei Target'}
                </h2>
              </div>
              <p className="text-slate-700">
                {isGuest
                  ? 'Esplora le ricerche attive. Registrati per pubblicare la tua richiesta!'
                  : 'Gestisci i tuoi obiettivi e monitora le offerte ricevute'}
              </p>
            </div>
            <button
              onClick={handleNewTargetClick}
              className="flex items-center gap-3 px-8 py-4 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 hover:scale-105 active:scale-95"
            >
              <Crosshair className="w-5 h-5" />
              {isGuest ? 'Pubblica la Tua Ricerca' : 'Punta Nuovo Target'}
            </button>
          </div>
        </div>

        {!isGuest && (
          <div className="flex gap-4 mb-6 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('targets')}
              className={`px-6 py-4 font-bold transition-all relative ${
                activeTab === 'targets'
                  ? 'text-orange-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <TargetIcon className="w-4 h-4" />
                I Miei Target ({targets.length})
              </span>
              {activeTab === 'targets' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-full transition-all duration-300" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`px-6 py-4 font-bold transition-all relative ${
                activeTab === 'offers'
                  ? 'text-orange-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Offerte Ricevute ({offers.length})
              </span>
              {activeTab === 'offers' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-full transition-all duration-300" />
              )}
            </button>
          </div>
        )}

        {activeTab === 'targets' && (
          <div className="grid gap-6">
            {loading ? (
              <div className="text-center py-12 text-slate-600">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                Caricamento target...
              </div>
            ) : targets.length === 0 ? (
              <div className="text-center py-16 bg-blue-900 rounded-3xl border border-blue-800 shadow-xl">
                <TargetIcon className="w-20 h-20 text-blue-300 mx-auto mb-6" />
                <p className="text-white text-xl font-bold mb-2">
                  {isGuest ? 'Nessuna ricerca attiva al momento' : 'Nessun target ancora'}
                </p>
                <p className="text-blue-200 text-sm mb-6">
                  {isGuest
                    ? 'Registrati per essere il primo a pubblicare una ricerca!'
                    : 'Punta il tuo primo target e inizia a ricevere offerte dalle migliori aziende'}
                </p>
                <button
                  onClick={handleNewTargetClick}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  <Crosshair className="w-5 h-5" />
                  {isGuest ? 'Pubblica la Tua Ricerca' : 'Punta il Tuo Primo Target'}
                </button>
              </div>
            ) : (
              targets.map((target, index) => (
                <div
                  key={target.id}
                  className="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-orange-300 transition-all hover:shadow-xl hover:-translate-y-1 shadow-md duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <TargetIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                          {target.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-slate-700 border border-slate-200">
                          <Crosshair className="w-4 h-4 text-orange-600" />
                          {target.category}
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-slate-700 border border-slate-200">
                          <MapPin className="w-4 h-4 text-orange-600" />
                          {target.location}
                        </span>
                        {target.budget && (
                          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-slate-700 border border-slate-200">
                            <Euro className="w-4 h-4 text-orange-600" />
                            Budget: {target.budget}€
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-2xl text-sm font-bold ${
                        target.status === 'active'
                          ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-slate-500 border border-slate-300'
                      }`}
                    >
                      {target.status === 'active' ? '🎯 Attivo' : 'Chiuso'}
                    </span>
                  </div>
                  {target.description && (
                    <p className="text-slate-700 mb-6 leading-relaxed pl-13">{target.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-sm text-slate-500">
                      Puntato il {new Date(target.created_at).toLocaleDateString('it-IT')}
                    </span>
                    {!isGuest && (
                      <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 font-bold text-sm border border-orange-200">
                        <TrendingUp className="w-4 h-4" />
                        {offers.filter((o) => o.target_id === target.id).length} offerte
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!isGuest && activeTab === 'offers' && (
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
                    <button
                      onClick={async () => {
                        if (!profile) return;
                        
                        const { data: conversation } = await supabase
                          .from('conversations')
                          .select('id')
                          .eq('target_id', offer.target_id)
                          .eq('seller_id', offer.seller_id)
                          .maybeSingle();

                        if (conversation) {
                          setSelectedChat({
                            conversationId: conversation.id,
                            targetId: offer.target_id,
                            buyerId: profile.id,
                            sellerId: offer.seller_id,
                            otherParty: offer.seller.full_name,
                            target: offer.target.title
                          });
                        } else {
                          const { data: newConv } = await supabase
                            .from('conversations')
                            .insert({
                              target_id: offer.target_id,
                              buyer_id: profile.id,
                              seller_id: offer.seller_id
                            })
                            .select()
                            .single();

                          if (newConv) {
                            setSelectedChat({
                              conversationId: newConv.id,
                              targetId: offer.target_id,
                              buyerId: profile.id,
                              sellerId: offer.seller_id,
                              otherParty: offer.seller.full_name,
                              target: offer.target.title
                            });
                          }
                        }
                      }}
                      className="px-6 py-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all text-sm flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chatta con venditore
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {!isGuest && showNewRequest && (
        <NewRequestModal
          onClose={() => setShowNewRequest(false)}
          onSuccess={() => {
            setShowNewRequest(false);
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
