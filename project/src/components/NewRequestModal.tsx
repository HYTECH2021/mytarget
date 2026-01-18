import { useState, useEffect } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { CategoryData } from '../lib/types';
import { PhotoUpload } from './PhotoUpload';

interface NewRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewRequestModal({ onClose, onSuccess }: NewRequestModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: profile?.city || '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

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
      if (data && data.length > 0 && !formData.category) {
        setFormData((prev) => ({ ...prev, category: data[0].name }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setError(null);
    setLoading(true);

    try {
      const finalCategory = showCustomCategory && customCategory.trim()
        ? customCategory.trim()
        : formData.category;

      const { data: targetData, error: insertError } = await supabase
        .from('targets')
        .insert({
          user_id: profile.id,
          title: formData.title,
          description: formData.description || null,
          category: finalCategory,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          location: formData.location,
          photos: JSON.stringify(photos),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (showCustomCategory && customCategory.trim()) {
        await supabase.from('category_suggestions').insert({
          name: customCategory.trim(),
          suggested_by: profile.id,
          target_id: targetData.id,
          status: 'pending',
        });
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <h2 className="text-2xl font-bold text-white">Nuova Richiesta</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cosa stai cercando? *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              placeholder="Es: iPhone 15 Pro Max usato"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Categoria *
            </label>
            {!showCustomCategory ? (
              <>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} ({cat.request_count})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustomCategory(true)}
                  className="mt-2 text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Non trovi la categoria giusta? Suggeriscine una nuova
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  placeholder="Es: Gioielli e Accessori"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomCategory(false);
                    setCustomCategory('');
                  }}
                  className="mt-2 text-sm text-slate-400 hover:text-white"
                >
                  Torna alle categorie esistenti
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  La tua categoria sarà sottoposta a revisione e, se approvata, diventerà disponibile per tutti gli utenti
                </p>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descrizione dettagliata
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent resize-none"
              placeholder="Descrivi nel dettaglio cosa stai cercando, le caratteristiche desiderate, condizioni, ecc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Foto (opzionale)
            </label>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <PhotoUpload
                  key={index}
                  currentPhotoUrl={photo}
                  onPhotoUploaded={(url) => {
                    const newPhotos = [...photos];
                    newPhotos[index] = url;
                    setPhotos(newPhotos.filter(p => p));
                  }}
                  type="target"
                />
              ))}
              {photos.length < 4 && (
                <PhotoUpload
                  currentPhotoUrl=""
                  onPhotoUploaded={(url) => setPhotos([...photos, url])}
                  type="target"
                />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Puoi caricare fino a 4 foto per aiutare i venditori a capire meglio cosa stai cercando
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Budget (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                placeholder="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Località *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                placeholder="Milano"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Pubblica Richiesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
