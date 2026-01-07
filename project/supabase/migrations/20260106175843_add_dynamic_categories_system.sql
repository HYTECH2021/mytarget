/*
  # Sistema Categorie Dinamiche e Pannello Admin

  ## Overview
  Questo migration aggiunge il sistema di categorie autogeneranti basato sulle richieste degli utenti
  e crea le funzionalità per il pannello amministrativo.

  ## New Tables
  
  ### 1. categories
  Categorie ufficiali della piattaforma
  - `id` (uuid, primary key)
  - `name` (text, unique, not null) - Nome della categoria
  - `slug` (text, unique, not null) - Slug URL-friendly
  - `is_active` (boolean) - Se la categoria è attiva
  - `request_count` (integer) - Numero di richieste in questa categoria
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. category_suggestions
  Proposte di nuove categorie dagli utenti
  - `id` (uuid, primary key)
  - `name` (text, not null) - Nome della categoria proposta
  - `suggested_by` (uuid, references profiles) - Chi ha proposto
  - `status` (text) - 'pending', 'approved', 'rejected'
  - `request_id` (uuid, references requests) - Richiesta che ha generato la proposta
  - `created_at` (timestamptz)
  - `reviewed_at` (timestamptz)
  - `reviewed_by` (uuid, references profiles)

  ### 3. admin_users
  Utenti con privilegi amministrativi
  - `user_id` (uuid, primary key, references profiles)
  - `permissions` (text[]) - Array di permessi
  - `created_at` (timestamptz)

  ## Security
  - Categories: Tutti possono leggere, solo admin possono modificare
  - Category suggestions: Utenti possono creare e vedere le proprie, admin vedono tutte
  - Admin users: Solo admin possono vedere

  ## Important Notes
  1. Le categorie iniziali vengono popolate dai valori esistenti
  2. Gli utenti possono proporre nuove categorie
  3. Gli admin possono approvare/rifiutare proposte
  4. Una volta approvate, le categorie diventano ufficiali
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  request_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create category_suggestions table
CREATE TABLE IF NOT EXISTS category_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  suggested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_id uuid REFERENCES requests(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  permissions text[] DEFAULT ARRAY['manage_categories', 'view_analytics', 'manage_users']::text[],
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Category suggestions policies
CREATE POLICY "Users can view own suggestions"
  ON category_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = suggested_by);

CREATE POLICY "Admins can view all suggestions"
  ON category_suggestions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create suggestions"
  ON category_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Admins can update suggestions"
  ON category_suggestions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admin users policies
CREATE POLICY "Users can view own admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert initial categories from existing CATEGORIES constant
INSERT INTO categories (name, slug) VALUES
  ('Elettronica', 'elettronica'),
  ('Moda e Abbigliamento', 'moda-abbigliamento'),
  ('Casa e Giardino', 'casa-giardino'),
  ('Sport e Tempo Libero', 'sport-tempo-libero'),
  ('Auto e Moto', 'auto-moto'),
  ('Servizi Professionali', 'servizi-professionali'),
  ('Immobiliare', 'immobiliare'),
  ('Lavoro', 'lavoro'),
  ('Altro', 'altro')
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_category_suggestions_status ON category_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_category_suggestions_suggested_by ON category_suggestions(suggested_by);

-- Function to update category request count
CREATE OR REPLACE FUNCTION update_category_request_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories
    SET request_count = request_count + 1,
        updated_at = now()
    WHERE name = NEW.category;
  ELSIF TG_OP = 'UPDATE' AND OLD.category != NEW.category THEN
    UPDATE categories
    SET request_count = request_count - 1,
        updated_at = now()
    WHERE name = OLD.category;
    
    UPDATE categories
    SET request_count = request_count + 1,
        updated_at = now()
    WHERE name = NEW.category;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories
    SET request_count = request_count - 1,
        updated_at = now()
    WHERE name = OLD.category;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update category counts automatically
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_category_count'
  ) THEN
    CREATE TRIGGER trigger_update_category_count
    AFTER INSERT OR UPDATE OR DELETE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION update_category_request_count();
  END IF;
END $$;