import { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles, Bot, User, HelpCircle, MessageCircle, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai_assistant' | 'human_agent';
  sender_id: string | null;
  content: string;
  metadata: any;
  created_at: string;
}

interface SupportConversation {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export function SupportChat() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile && isOpen) {
      loadConversations();
    }
  }, [profile, isOpen]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages();
      const subscription = subscribeToMessages();
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setConversations(data);
      if (data.length > 0 && !currentConversation) {
        setCurrentConversation(data[0].id);
      }
    }
  };

  const loadMessages = async () => {
    if (!currentConversation) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', currentConversation)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`support:${currentConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${currentConversation}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SupportMessage]);
        }
      )
      .subscribe();

    return channel;
  };

  const createNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !profile) return;

    const { data: conversation, error: convError } = await supabase
      .from('support_conversations')
      .insert({
        user_id: profile.id,
        subject: newSubject,
        status: 'open',
        priority: 'medium',
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return;
    }

    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'user',
        sender_id: profile.id,
        content: `Nuova richiesta di supporto: ${newSubject}`,
      });

    if (!msgError) {
      setConversations([conversation, ...conversations]);
      setCurrentConversation(conversation.id);
      setShowNewConversation(false);
      setNewSubject('');

      await requestAIResponse(conversation.id, `Nuova richiesta di supporto: ${newSubject}`);
    }
  };

  const requestAIResponse = async (conversationId: string, userMessage: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            message: userMessage,
          }),
        }
      );
    } catch (error) {
      console.error('Error requesting AI response:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile || !currentConversation) return;

    setSendingMessage(true);

    const { error } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: currentConversation,
        sender_type: 'user',
        sender_id: profile.id,
        content: newMessage,
      });

    if (!error) {
      const messageToSend = newMessage;
      setNewMessage('');

      await requestAIResponse(currentConversation, messageToSend);
    }

    setSendingMessage(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-400 bg-blue-500/20';
      case 'in_progress': return 'text-orange-400 bg-orange-500/20';
      case 'resolved': return 'text-green-400 bg-green-500/20';
      case 'closed': return 'text-slate-400 bg-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aperto';
      case 'in_progress': return 'In Corso';
      case 'resolved': return 'Risolto';
      case 'closed': return 'Chiuso';
      default: return status;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 shadow-2xl hover:shadow-orange-600/50 hover:scale-110 transition-all z-40 group flex flex-col items-center gap-2"
      >
        <div className="relative">
          <Logo size={56} showText={false} blackBg={true} />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
        </div>
        <span className="text-xs font-black text-slate-900 bg-white px-3 py-1 rounded-lg shadow-lg">
          ASSISTENTE AI
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full sm:max-w-4xl h-[90vh] sm:h-[80vh] bg-gradient-to-br from-slate-900 to-slate-950 sm:rounded-3xl border-t sm:border border-orange-600/30 shadow-2xl shadow-orange-600/20 flex overflow-hidden transition-all duration-300">
              <div className="w-1/3 border-r border-slate-800/50 flex flex-col">
                <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-b border-orange-600/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-600/30 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-orange-500" />
                      </div>
                      <h2 className="text-lg font-black text-white">Assistente AI</h2>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowNewConversation(true)}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nuova Richiesta
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setCurrentConversation(conv.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all ${
                        currentConversation === conv.id
                          ? 'bg-orange-600/20 border border-orange-500/50'
                          : 'bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-white text-sm line-clamp-1">
                          {conv.subject}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-lg font-bold ${getStatusColor(conv.status)}`}>
                          {getStatusLabel(conv.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(conv.updated_at).toLocaleDateString('it-IT')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                {showNewConversation ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <form onSubmit={createNewConversation} className="w-full max-w-md">
                      <div className="text-center mb-6">
                        <HelpCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-white mb-2">
                          Come possiamo aiutarti?
                        </h3>
                        <p className="text-slate-400">
                          Descrivi brevemente il problema o la domanda
                        </p>
                      </div>
                      <input
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Es: Non riesco ad accedere al mio account"
                        className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all mb-4"
                        autoFocus
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowNewConversation(false)}
                          className="flex-1 px-6 py-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-bold transition-all"
                        >
                          Annulla
                        </button>
                        <button
                          type="submit"
                          disabled={!newSubject.trim()}
                          className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Inizia Chat
                        </button>
                      </div>
                    </form>
                  </div>
                ) : currentConversation ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="w-12 h-12 border-4 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <Bot className="w-16 h-16 text-slate-600 mb-4" />
                          <p className="text-slate-400 text-lg font-bold">
                            Nessun messaggio ancora
                          </p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isUser = message.sender_type === 'user';
                          const isAI = message.sender_type === 'ai_assistant';
                          return (
                            <div
                              key={message.id}
                              className="flex items-start gap-3 transition-all duration-300"
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  isUser
                                    ? 'bg-slate-700'
                                    : isAI
                                    ? 'bg-orange-600/30'
                                    : 'bg-blue-600/30'
                                }`}
                              >
                                {isUser ? (
                                  <User className="w-4 h-4 text-slate-300" />
                                ) : isAI ? (
                                  <Bot className="w-4 h-4 text-orange-400" />
                                ) : (
                                  <HelpCircle className="w-4 h-4 text-blue-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-slate-400">
                                    {isUser ? 'Tu' : isAI ? 'Assistente AI' : 'Operatore'}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {new Date(message.created_at).toLocaleTimeString('it-IT', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                  {message.metadata?.suggestedActions && message.metadata.suggestedActions.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      {message.metadata.suggestedActions.map((action: string, index: number) => (
                                        <button
                                          key={index}
                                          onClick={() => setNewMessage(action)}
                                          className="w-full text-left px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm transition-all"
                                        >
                                          {action}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-800/50">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Scrivi il tuo messaggio..."
                          className="flex-1 px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all"
                          disabled={sendingMessage}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || sendingMessage}
                          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {sendingMessage ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Invia
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg font-bold">
                        Seleziona una conversazione
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </>
  );
}
