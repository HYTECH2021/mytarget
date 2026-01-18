import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
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

interface PrivateChatProps {
  conversationId: string;
  targetId: string;
  buyerId: string;
  sellerId: string;
  otherPartyName: string;
  targetTitle: string;
  onClose: () => void;
}

export function PrivateChat({
  conversationId,
  targetId,
  buyerId,
  sellerId,
  otherPartyName,
  targetTitle,
  onClose,
}: PrivateChatProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Verifica che l'utente sia autenticato e parte della conversazione
  useEffect(() => {
    if (!profile) {
      setError('Devi essere autenticato per accedere alla chat');
      return;
    }

    const isPartOfConversation = profile.id === buyerId || profile.id === sellerId;
    if (!isPartOfConversation) {
      setError('Non hai accesso a questa conversazione');
      return;
    }

    loadMessages();
    const subscription = subscribeToMessages();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, profile, buyerId, sellerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!profile) return;

    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error loading messages:', fetchError);
      setError('Errore nel caricamento dei messaggi');
    } else {
      setMessages(data || []);
      setError(null);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    // Usa un canale privato basato su conversation_id
    const channelName = `chat_${targetId}_${buyerId}_${sellerId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return channel;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile || sending) return;

    setSending(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        content: newMessage.trim(),
        message_type: 'user',
      });

      if (insertError) {
        throw insertError;
      }

      // Aggiorna updated_at della conversazione
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Errore nell\'invio del messaggio');
    } finally {
      setSending(false);
    }
  };

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-800">
          <p className="text-red-400 text-center">Devi essere autenticato per accedere alla chat</p>
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    );
  }

  const isBuyer = profile.id === buyerId;
  const otherPartyId = isBuyer ? sellerId : buyerId;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col border border-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-600/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Chat con {otherPartyName}</h3>
              <p className="text-xs text-slate-400">Target: {targetTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400">Caricamento messaggi...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-400">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 text-center">
                Nessun messaggio ancora. Inizia la conversazione!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === profile.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-4 ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        isOwnMessage ? 'text-orange-100' : 'text-slate-400'
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-3xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Invio...' : 'Invia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
