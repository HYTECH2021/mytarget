import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
  type: 'avatar' | 'company_logo' | 'target' | 'offer';
  className?: string;
}

export function PhotoUpload({ currentPhotoUrl, onPhotoUploaded, type, className = '' }: PhotoUploadProps) {
  const { profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      setError('Per favore seleziona un file immagine valido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Il file è troppo grande. Dimensione massima: 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      onPhotoUploaded(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoUploaded('');
  };

  return (
    <div className={className}>
      {currentPhotoUrl ? (
        <div className="relative group">
          <img
            src={currentPhotoUrl}
            alt="Photo"
            className="w-full h-48 object-cover rounded-2xl border border-slate-700"
          />
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="absolute top-2 right-2 p-2 rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-3" />
            ) : (
              <ImageIcon className="w-12 h-12 text-slate-500 mb-3" />
            )}
            <p className="mb-2 text-sm text-slate-400 font-medium">
              {uploading ? 'Caricamento...' : 'Clicca per caricare una foto'}
            </p>
            <p className="text-xs text-slate-600">PNG, JPG fino a 5MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
