/*
  # Add Photo Upload System

  1. Changes to profiles table
    - Add `avatar_url` (text) - URL to user profile picture
    - Add `company_logo_url` (text) - URL to company logo for sellers
    
  2. Changes to targets table
    - Add `photos` (jsonb) - Array of photo URLs for target

  3. Changes to offers table
    - Add `photos` (jsonb) - Array of photo URLs attached to offers

  4. Storage
    - Create storage bucket for user photos
    - Create RLS policies for photo access
*/

-- Add photo fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_logo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_logo_url text;
  END IF;
END $$;

-- Add photos field to targets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'targets' AND column_name = 'photos'
  ) THEN
    ALTER TABLE targets ADD COLUMN photos jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add photos field to offers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'photos'
  ) THEN
    ALTER TABLE offers ADD COLUMN photos jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create storage bucket for photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for photos bucket
DO $$
BEGIN
  -- Allow authenticated users to upload photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload photos'
  ) THEN
    CREATE POLICY "Users can upload photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'photos');
  END IF;

  -- Allow public to view photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view photos'
  ) THEN
    CREATE POLICY "Public can view photos"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'photos');
  END IF;

  -- Allow users to update their own photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own photos'
  ) THEN
    CREATE POLICY "Users can update own photos"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Allow users to delete their own photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own photos'
  ) THEN
    CREATE POLICY "Users can delete own photos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;