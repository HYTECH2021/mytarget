import { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles, Target, MessageCircle, Lightbulb } from 'lucide-react';
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

interface AISuggestion {
  type: string;
  text: string;
  priority: number;
  action?: string;
}

interface ChatInterfaceProps {
  conversationId: string;
  otherPartyName: string;
  targetTitle: string;
  onClose: () => void;
}

export function ChatInterface({ conversationId, otherPartyName, targetTitle, onClose }: ChatInterfaceProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const subscription = subscribeToMessages();

    return () => {
      subscription.unsubscribe();
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

  const fetchAISuggestions = async () => {
    if (!profile) return;

    setLoadingSuggestions(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-suggestions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            userRole: profile.role,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions || []);
        setShowAISuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const useSuggestion = (suggestionText: string) => {
    setNewMessage(suggestionText);
    setShowAISuggestions(false);
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
      setTimeout(() => {
        fetchAISuggestions();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-4xl h-[80vh] bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-orange-600/30 shadow-2xl shadow-orange-600/20 flex flex-col overflow-hidden transition-all duration-300">
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
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} transition-all duration-300`}
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
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {showAISuggestions && aiSuggestions.length > 0 && (
          <div className="mx-6 mb-4 p-4 rounded-2xl bg-gradient-to-r from-orange-600/20 to-orange-500/10 border border-orange-500/30 transition-all duration-300">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-orange-600/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-black text-orange-400 tracking-wide">SUGGERIMENTI AI</span>
                </div>
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 ml-11">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => useSuggestion(suggestion.text)}
                    className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-orange-500/50 transition-all group"
                  >
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-300 group-hover:text-white leading-relaxed">
                        {suggestion.text}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-800/50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchAISuggestions}
              disabled={loadingSuggestions}
              className="px-4 py-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-orange-500/50 text-orange-400 transition-all disabled:opacity-50"
              title="Ottieni suggerimenti AI"
            >
              {loadingSuggestions ? (
                <div className="w-5 h-5 border-2 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </button>
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
      </div>
    </div>
  );
}
