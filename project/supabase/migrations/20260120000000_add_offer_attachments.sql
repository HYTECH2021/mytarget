/*
  # Add File Attachments Support for Offers

  1. Updates
    - Add attachments column to offers table (JSON array of file metadata)
    - Create Supabase Storage bucket for offer attachments

  2. Storage Bucket
    - Bucket name: 'offer-attachments'
    - Public access: false (authenticated users only)
    - Allowed file types: PDF, Word docs, Images

  3. File Structure in attachments JSON
    [
      {
        "id": "uuid",
        "name": "documento.pdf",
        "type": "application/pdf",
        "size": 1024000,
        "url": "https://storage.supabase.co/...",
        "uploaded_at": "2024-01-01T00:00:00Z"
      }
    ]
*/

-- Add attachments column to offers table
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for offer attachments (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offer-attachments',
  'offer-attachments',
  false,
  52428800, -- 50 MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy: Sellers can upload files to offers
CREATE POLICY IF NOT EXISTS "Sellers can upload offer attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'offer-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage policy: Buyers and sellers can read attachments
CREATE POLICY IF NOT EXISTS "Users can read offer attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'offer-attachments' AND
  (
    -- Seller can read their own uploads
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Buyer can read if they have an offer on their target
    EXISTS (
      SELECT 1 FROM offers
      INNER JOIN targets ON targets.id = offers.target_id
      WHERE targets.user_id = auth.uid()
      AND offers.id::text = (storage.foldername(name))[2]
    )
  )
);

-- Create storage policy: Sellers can delete their own attachments
CREATE POLICY IF NOT EXISTS "Sellers can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'offer-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
