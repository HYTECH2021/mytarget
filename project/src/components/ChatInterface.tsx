import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, TrendingUp, Target, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'user' | 'ai_suggestion' | 'system';
  created_at: string;
}

interface ChatInterfaceProps {
  conversationId: string;
  otherPartyName: string;
  targetTitle: string;
  onClose: () => void;
}

const AI_SUGGESTIONS = [
  "💡 Considera di offrire un piano di pagamento flessibile per aumentare le possibilità di chiusura",
  "🎯 Metti in evidenza il valore unico che puoi offrire rispetto alla concorrenza",
  "⚡ Rispondi rapidamente: i primi a rispondere hanno il 70% di possibilità in più di chiudere",
  "💰 Se il budget è alto, considera di offrire servizi premium aggiuntivi",
  "🤝 Proponi una call o meeting per costruire fiducia e chiudere più velocemente",
  "📊 Condividi case study o testimonial per aumentare la credibilità",
  "🎁 Un piccolo bonus o extra può fare la differenza nella negoziazione",
  "⏰ Crea urgenza menzionando disponibilità limitata o offerte a tempo"
];

export function ChatInterface({ conversationId, otherPartyName, targetTitle, onClose }: ChatInterfaceProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const subscription = subscribeToMessages();

    const suggestionTimer = setTimeout(() => {
      if (messages.length > 0) {
        showRandomSuggestion();
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(suggestionTimer);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return channel;
  };

  const showRandomSuggestion = () => {
    const suggestion = AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)];
    setCurrentSuggestion(suggestion);
    setShowAISuggestion(true);

    setTimeout(() => {
      setShowAISuggestion(false);
    }, 8000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        content: newMessage,
        message_type: 'user'
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
      setTimeout(showRandomSuggestion, 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl h-[80vh] bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-orange-600/30 shadow-2xl shadow-orange-600/20 flex flex-col overflow-hidden"
      >
        <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-b border-orange-600/30 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/30 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                {targetTitle}
              </h2>
              <p className="text-sm text-slate-400">
                Negoziazione con <span className="text-white font-bold">{otherPartyName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Target className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg font-bold mb-2">Nessun messaggio ancora</p>
              <p className="text-slate-500 text-sm">Inizia la negoziazione per questo target</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === profile?.id;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-6 py-4 rounded-2xl ${
                      isOwn
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-200'
                    }`}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${isOwn ? 'text-orange-200' : 'text-slate-500'}`}>
                      {new Date(message.created_at).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <AnimatePresence>
          {showAISuggestion && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="mx-6 mb-4 p-4 rounded-2xl bg-gradient-to-r from-orange-600/20 to-orange-500/10 border border-orange-500/30"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-600/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-orange-400 tracking-wide">AI MEDIATOR</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{currentSuggestion}</p>
                </div>
                <button
                  onClick={() => setShowAISuggestion(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-800/50">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrivi il tuo messaggio..."
              className="flex-1 px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Invia
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
