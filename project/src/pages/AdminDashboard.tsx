import { useState, useEffect } from 'react';
import { Shield, Users, Package, MessageCircle, CheckCircle, XCircle, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useIsAdmin } from '../hooks/useIsAdmin';
import type { Target, Profile, CategoryData } from '../lib/types';

interface CategorySuggestion {
  id: string;
  name: string;
  suggested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  suggester?: {
    full_name: string;
    email: string;
  };
}

interface Conversation {
  id: string;
  target_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  target?: {
    title: string;
  };
  buyer?: {
    full_name: string;
    email: string;
  };
  seller?: {
    full_name: string;
    email: string;
  };
}

type TabType = 'targets' | 'users' | 'categories' | 'chats';

export function AdminDashboard() {
  const { user, profile } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [activeTab, setActiveTab] = useState<TabType>('targets');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [targets, setTargets] = useState<Target[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<CategorySuggestion[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editingTarget, setEditingTarget] = useState<Partial<Target>>({});
  const [editingUser, setEditingUser] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'targets':
          await loadTargets();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'categories':
          await loadCategorySuggestions();
          break;
        case 'chats':
          await loadConversations();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTargets = async () => {
    const { data, error } = await supabase
      .from('targets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading targets:', error);
    } else {
      setTargets(data || []);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading users:', error);
    } else {
      setUsers(data || []);
    }
  };

  const loadCategorySuggestions = async () => {
    const { data, error } = await supabase
      .from('category_suggestions')
      .select(`
        *,
        suggester:profiles!category_suggestions_suggested_by_fkey(full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading category suggestions:', error);
    } else {
      setCategorySuggestions(data || []);
    }
  };

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        target:targets(title),
        buyer:profiles!conversations_buyer_id_fkey(full_name, email),
        seller:profiles!conversations_seller_id_fkey(full_name, email)
      `)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading conversations:', error);
    } else {
      setConversations(data || []);
    }
  };

  const handleApproveCategory = async (suggestionId: string, categoryName: string) => {
    try {
      // Approve the suggestion
      const { error: updateError } = await supabase
        .from('category_suggestions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', suggestionId);

      if (updateError) throw updateError;

      // Create the category if it doesn't exist
      const { error: insertError } = await supabase
        .from('categories')
        .insert({
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
          is_active: true,
        })
        .select()
        .single();

      if (insertError && !insertError.message.includes('duplicate')) {
        console.error('Error creating category:', insertError);
      }

      await loadCategorySuggestions();
    } catch (error) {
      console.error('Error approving category:', error);
      alert('Errore nell\'approvazione della categoria');
    }
  };

  const handleRejectCategory = async (suggestionId: string) => {
    try {
      const { error } = await supabase
        .from('category_suggestions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', suggestionId);

      if (error) throw error;
      await loadCategorySuggestions();
    } catch (error) {
      console.error('Error rejecting category:', error);
      alert('Errore nel rifiuto della categoria');
    }
  };

  const handleUpdateTarget = async (targetId: string) => {
    try {
      const { error } = await supabase
        .from('targets')
        .update(editingTarget)
        .eq('id', targetId);

      if (error) throw error;
      setSelectedTarget(null);
      setEditingTarget({});
      await loadTargets();
    } catch (error) {
      console.error('Error updating target:', error);
      alert('Errore nell\'aggiornamento della richiesta');
    }
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editingUser)
        .eq('id', userId);

      if (error) throw error;
      setSelectedUser(null);
      setEditingUser({});
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Errore nell\'aggiornamento dell\'utente');
    }
  };

  const handleDeleteTarget = async (targetId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa richiesta?')) return;

    try {
      const { error } = await supabase
        .from('targets')
        .delete()
        .eq('id', targetId);

      if (error) throw error;
      await loadTargets();
    } catch (error) {
      console.error('Error deleting target:', error);
      alert('Errore nell\'eliminazione della richiesta');
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-slate-900 text-xl">Caricamento...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Accesso Negato</h1>
          <p className="text-slate-600">Non hai i permessi per accedere a questa pagina.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-black text-slate-900">Admin Dashboard</h1>
              <p className="text-xs text-slate-500">Controllo Totale Piattaforma</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Benvenuto, {profile?.full_name}</span>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-semibold"
            >
              Torna al Sito
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-300">
          <button
            onClick={() => setActiveTab('targets')}
            className={`px-6 py-3 font-bold transition-all relative ${
              activeTab === 'targets' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Richieste ({targets.length})
            {activeTab === 'targets' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-bold transition-all relative ${
              activeTab === 'users' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Utenti ({users.length})
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 font-bold transition-all relative ${
              activeTab === 'categories' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Categorie Pending ({categorySuggestions.length})
            {activeTab === 'categories' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-6 py-3 font-bold transition-all relative ${
              activeTab === 'chats' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Chat Monitor ({conversations.length})
            {activeTab === 'chats' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-slate-400">Caricamento...</div>
          </div>
        ) : (
          <>
            {activeTab === 'targets' && (
              <div className="space-y-4">
                {targets.map((target) => (
                  <div key={target.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{target.title}</h3>
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span>Categoria: {target.category}</span>
                          <span>Località: {target.location}</span>
                          {target.budget && <span>Budget: €{target.budget}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedTarget(target);
                            setEditingTarget({ status: target.status });
                          }}
                          className="p-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTarget(target.id)}
                          className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {selectedTarget?.id === target.id && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <select
                          value={editingTarget.status || target.status}
                          onChange={(e) => setEditingTarget({ ...editingTarget, status: e.target.value as any })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 mb-3"
                        >
                          <option value="active">Attiva</option>
                          <option value="closed">Chiusa</option>
                          <option value="archived">Archiviata</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateTarget(target.id)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
                          >
                            Salva
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTarget(null);
                              setEditingTarget({});
                            }}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{user.full_name}</h3>
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span>Email: {user.email}</span>
                          <span>Ruolo: {user.role}</span>
                          <span>Città: {user.city}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setEditingUser({ role: user.role });
                        }}
                        className="p-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    {selectedUser?.id === user.id && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <select
                          value={editingUser.role || user.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 mb-3"
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                          <option value="admin">Admin</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateUser(user.id)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
                          >
                            Salva
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(null);
                              setEditingUser({});
                            }}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-4">
                {categorySuggestions.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                    <p className="text-slate-400">Nessuna categoria in attesa di approvazione</p>
                  </div>
                ) : (
                  categorySuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{suggestion.name}</h3>
                          <p className="text-sm text-slate-600">
                            Suggerita da: {suggestion.suggester?.full_name} ({suggestion.suggester?.email})
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(suggestion.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveCategory(suggestion.id, suggestion.name)}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approva
                          </button>
                          <button
                            onClick={() => handleRejectCategory(suggestion.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Rifiuta
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'chats' && (
              <div className="space-y-4">
                {conversations.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                    <p className="text-slate-400">Nessuna conversazione trovata</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div key={conv.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 mb-2">
                            {conv.target?.title || 'Target'}
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600">Buyer:</p>
                              <p className="font-semibold text-slate-900">{conv.buyer?.full_name}</p>
                              <p className="text-xs text-slate-500">{conv.buyer?.email}</p>
                            </div>
                            <div>
                              <p className="text-slate-600">Seller:</p>
                              <p className="font-semibold text-slate-900">{conv.seller?.full_name}</p>
                              <p className="text-xs text-slate-500">{conv.seller?.email}</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            Ultima attività: {new Date(conv.updated_at).toLocaleString('it-IT')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          conv.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {conv.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
