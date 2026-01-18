import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle, Paperclip, FileText, Image, File, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { TargetWithProfile } from '../lib/types';
import { PhotoUpload } from './PhotoUpload';
import { useSubscription } from '../hooks/useSubscription';

interface AttachmentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

interface SendOfferModalProps {
  target: TargetWithProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendOfferModal({ target, onClose, onSuccess }: SendOfferModalProps) {
  const { profile } = useAuth();
  const { checkCanSendOffers, incrementOffersSent, dailyLimits } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSend, setCanSend] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    message: '',
    proposed_price: target.budget?.toString() || '',
  });

  useEffect(() => {
    checkLimits();
  }, []);

  const checkLimits = async () => {
    const allowed = await checkCanSendOffers();
    setCanSend(allowed);
    if (!allowed) {
      setError('Hai raggiunto il limite mensile di offerte per il piano FREE. Fai l\'upgrade per inviare offerte illimitate.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !profile) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        setError(`Tipo file non supportato: ${file.name}. Sono consentiti solo PDF, Word e Immagini.`);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError(`File troppo grande: ${file.name}. Dimensione massima: 50 MB.`);
        continue;
      }

      await uploadFile(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    if (!profile) return;

    setUploadingFile(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('offer-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('offer-attachments')
        .getPublicUrl(filePath);

      // Get signed URL for private access (better security)
      const { data: signedData } = await supabase.storage
        .from('offer-attachments')
        .createSignedUrl(filePath, 31536000); // 1 year expiry

      const attachment: AttachmentFile = {
        id: fileName,
        name: file.name,
        type: file.type,
        size: file.size,
        url: signedData?.signedUrl || publicUrl,
        uploaded_at: new Date().toISOString(),
      };

      setAttachments((prev) => [...prev, attachment]);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(`Errore durante il caricamento di ${file.name}: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    if (!profile) return;

    const attachment = attachments.find((a) => a.id === attachmentId);
    if (!attachment) return;

    try {
      const filePath = `${profile.id}/${attachmentId}`;
      const { error } = await supabase.storage
        .from('offer-attachments')
        .remove([filePath]);

      if (error) throw error;

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      console.error('Error removing file:', err);
      setError('Errore durante la rimozione del file');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !canSend) return;

    setError(null);
    setLoading(true);

    try {
      const allowed = await checkCanSendOffers();
      if (!allowed) {
        setError('Hai raggiunto il limite mensile di offerte per il piano FREE. Fai l\'upgrade per inviare offerte illimitate.');
        setCanSend(false);
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('offers').insert({
        target_id: target.id,
        seller_id: profile.id,
        message: formData.message,
        proposed_price: formData.proposed_price ? parseFloat(formData.proposed_price) : null,
        photos: JSON.stringify(photos),
        attachments: attachments.length > 0 ? attachments : null,
      });

      if (insertError) throw insertError;

      await incrementOffersSent();

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
          <h2 className="text-2xl font-bold text-white">Invia Offerta</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-800 bg-slate-800/30">
          <h3 className="font-semibold text-white mb-2">{target.title}</h3>
          <p className="text-sm text-slate-400">
            Richiesta da: {target.profile.full_name} • {target.profile.city}
          </p>
          {target.budget && (
            <p className="text-sm text-orange-400 mt-2">
              Budget indicativo: €{target.budget}
            </p>
          )}
          {dailyLimits && dailyLimits.plan === 'free' && (
            <div className="mt-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <p className="text-xs text-orange-300">
                Piano FREE: {dailyLimits.offers_sent} / {dailyLimits.offers_limit} offerte utilizzate questo mese
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Il tuo messaggio *
            </label>
            <textarea
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent resize-none"
              placeholder="Descrivi la tua offerta in dettaglio: cosa puoi fornire, tempi di consegna, garanzie, ecc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prezzo Proposto (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.proposed_price}
              onChange={(e) => setFormData({ ...formData, proposed_price: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              placeholder="Es: 999.99"
            />
            <p className="text-xs text-slate-500 mt-2">
              Lascia vuoto se preferisci non specificare un prezzo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Foto prodotto (opzionale)
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
                  type="offer"
                />
              ))}
              {photos.length < 4 && (
                <PhotoUpload
                  currentPhotoUrl=""
                  onPhotoUploaded={(url) => setPhotos([...photos, url])}
                  type="offer"
                />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Aggiungi foto del prodotto per rendere la tua offerta più convincente
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              File Allegati (PDF, Word, Immagini) - Opzionale
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileSelect}
              disabled={uploadingFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 hover:border-orange-600 text-slate-300 hover:text-orange-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingFile ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Paperclip className="w-5 h-5" />
                  Seleziona File (Max 50 MB)
                </>
              )}
            </button>
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center text-orange-400 flex-shrink-0">
                      {getFileIcon(attachment.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors flex-shrink-0"
                      title="Rimuovi file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Puoi allegare documenti PDF, Word o immagini per fornire maggiori dettagli sulla tua offerta
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
            <p className="text-sm text-orange-300 font-medium mb-1">
              Commissione Piattaforma
            </p>
            <p className="text-xs text-slate-400">
              MY TARGET trattiene una commissione del 5% sul valore della vendita conclusa.
              Il prezzo che proponi all'acquirente è quello finale che riceverai meno la commissione.
            </p>
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
              disabled={loading || !canSend}
              className="flex-1 py-3 rounded-2xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {!canSend ? 'Limite Raggiunto' : 'Invia Offerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
