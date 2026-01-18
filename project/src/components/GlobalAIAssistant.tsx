import { useState, useEffect } from 'react';
import { Bot, X, Sparkles, TrendingUp, Target, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function GlobalAIAssistant() {
  const { profile, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [offerCount, setOfferCount] = useState(0);
  const [targetTitle, setTargetTitle] = useState<string>('');
  const [sellerStats, setSellerStats] = useState<{ category: string; location: string; count: number } | null>(null);

  useEffect(() => {
    if (profile && user) {
      loadAIMessage();
    }
  }, [profile, user]);

  // Subscribe to real-time offer updates for buyers
  useEffect(() => {
    if (!profile || !user || profile.role !== 'buyer') return;

    const channel = supabase
      .channel('ai-assistant-offers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
        },
        async (payload) => {
          // Check if the offer is for this buyer's target
          const { data: target } = await supabase
            .from('targets')
            .select('id, title, user_id')
            .eq('id', payload.new.target_id)
            .single();

          if (target && target.user_id === user.id) {
            // Reload AI message to show new offer
            await loadAIMessage();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile, user]);

  const loadAIMessage = async () => {
    if (!profile || !user) return;

    setLoading(true);

    try {
      if (profile.role === 'buyer') {
        // Carica statistiche offerte per buyer
        const { data: targets } = await supabase
          .from('targets')
          .select('id, title')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (targets && targets.length > 0) {
          const targetId = targets[0].id;
          const { count, error } = await supabase
            .from('offers')
            .select('id', { count: 'exact', head: true })
            .eq('target_id', targetId);

          setOfferCount(count || 0);
          setTargetTitle(targets[0].title);
          
          if ((count || 0) > 0) {
            // Esempio con testo personalizzato basato sul target
            const titlePreview = targets[0].title.length > 30 
              ? targets[0].title.substring(0, 30) + '...' 
              : targets[0].title;
            setMessage(`Ciao! Hai ${count} nuova ${count === 1 ? 'offerta' : 'offerte'} per la tua ricerca "${titlePreview}". Vuoi che le riassuma?`);
          } else {
            setMessage('Ciao! Sono qui per aiutarti a trovare esattamente quello che cerchi. Vuoi che ti suggerisca qualche target interessante?');
          }
        } else {
          setMessage('Ciao! Inizia a creare il tuo primo target e riceverai offerte dalle migliori aziende.');
        }
      } else if (profile.role === 'seller') {
        // Carica statistiche ricerche per seller
        const { data: targets } = await supabase
          .from('targets')
          .select('category, location')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(100);

        if (targets && targets.length > 0) {
          // Calcola categoria e location più popolari oggi
          const categoryCount: Record<string, number> = {};
          const locationCount: Record<string, number> = {};
          const categoryLocationCount: Record<string, Record<string, number>> = {};

          targets.forEach((target) => {
            const cat = target.category || 'Altro';
            const loc = target.location || 'Italia';

            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            locationCount[loc] = (locationCount[loc] || 0) + 1;

            if (!categoryLocationCount[cat]) {
              categoryLocationCount[cat] = {};
            }
            categoryLocationCount[cat][loc] = (categoryLocationCount[cat][loc] || 0) + 1;
          });

          // Trova la combinazione categoria-location più frequente
          let maxCount = 0;
          let bestCategory = '';
          let bestLocation = '';

          Object.keys(categoryLocationCount).forEach((cat) => {
            Object.keys(categoryLocationCount[cat]).forEach((loc) => {
              const count = categoryLocationCount[cat][loc];
              if (count > maxCount) {
                maxCount = count;
                bestCategory = cat;
                bestLocation = loc;
              }
            });
          });

          if (maxCount > 0 && bestCategory && bestLocation) {
            setSellerStats({ category: bestCategory, location: bestLocation, count: maxCount });
            // Esempio: "Oggi ci sono molte ricerche nella categoria Meccanica a Roma"
            setMessage(`Oggi ci sono molte ricerche nella categoria ${bestCategory} a ${bestLocation}, vuoi dare un'occhiata?`);
          } else {
            setMessage('Ciao! Sono qui per aiutarti a trovare i target migliori. Vuoi che ti mostri le ricerche più interessanti?');
          }
        } else {
          setMessage('Ciao! Esplora il feed dei target per trovare opportunità di business.');
        }
      }
    } catch (error) {
      console.error('Error loading AI message:', error);
      setMessage('Ciao! Come posso aiutarti oggi?');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    if (profile?.role === 'buyer' && offerCount > 0) {
      // Navigate to offers tab in buyer dashboard
      window.location.href = '/';
    } else if (profile?.role === 'seller' && sellerStats) {
      // Navigate to seller dashboard with filters
      window.location.href = '/';
    } else {
      setIsOpen(false);
    }
  };

  if (!profile) return null;

  return (
    <>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 shadow-2xl shadow-orange-600/50 hover:shadow-orange-600/70 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300 group"
          aria-label="Apri Assistente AI"
        >
          <Bot className="w-7 h-7 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </button>
      ) : (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl shadow-2xl shadow-orange-600/30 border-2 border-orange-600/50 overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-b border-orange-600/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600/30 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Assistente AI</h3>
                  <p className="text-xs text-orange-400 font-bold">MY TARGET</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-200 leading-relaxed text-sm">
                          {message || 'Ciao! Come posso aiutarti oggi?'}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    {((profile.role === 'buyer' && offerCount > 0) || (profile.role === 'seller' && sellerStats)) && (
                      <button
                        onClick={handleAction}
                        className="w-full mt-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30"
                      >
                        {profile.role === 'buyer' ? (
                          <>
                            <Target className="w-4 h-4" />
                            Vedi Offerte
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            Esplora Target
                          </>
                        )}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 pt-6 border-t border-slate-800">
                    <p className="text-xs text-slate-400 mb-3 font-bold">Azioni Rapide:</p>
                    <div className="space-y-2">
                      {profile.role === 'buyer' && (
                        <button
                          onClick={() => window.location.href = '/'}
                          className="w-full text-left px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-orange-600/50 text-slate-300 hover:text-white transition-all text-sm flex items-center gap-2"
                        >
                          <Target className="w-4 h-4 text-orange-400" />
                          I Miei Target
                        </button>
                      )}
                      {profile.role === 'seller' && (
                        <button
                          onClick={() => window.location.href = '/'}
                          className="w-full text-left px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-orange-600/50 text-slate-300 hover:text-white transition-all text-sm flex items-center gap-2"
                        >
                          <TrendingUp className="w-4 h-4 text-orange-400" />
                          Feed Target
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
