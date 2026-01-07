/*
  # Add Admin Features and Analytics System for MY TARGET

  1. New Tables
    - `pending_categories`
      - `id` (uuid, primary key)
      - `suggested_name` (text)
      - `status` (text: 'pending', 'approved', 'rejected')
      - `suggested_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `reviewed_by` (uuid, references profiles, nullable)
      - `reviewed_at` (timestamptz, nullable)
    
    - `analytics_events`
      - `id` (uuid, primary key)
      - `event_type` (text: 'search', 'match', 'conversation_started')
      - `user_id` (uuid, references profiles)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
  
  2. Profile Enhancements
    - Add `profession` (text) to profiles
    - Add `age_range` (text) to profiles
    - Ensure 'admin' role is supported
  
  3. Security
    - Enable RLS on all new tables
    - Add admin-only policies for management features
    - Add policies for category suggestions

  4. Important Notes
    - HYTECH srl admins will have full access to analytics and category management
    - Regular users can suggest categories but cannot approve/reject
    - All demographic data (profession, age_range) is captured for analytics
*/

-- Add new columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profession'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profession text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'age_range'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age_range text DEFAULT '';
  END IF;
END $$;

-- Create pending_categories table
CREATE TABLE IF NOT EXISTS pending_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_name text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  suggested_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('search', 'match', 'conversation_started', 'offer_sent', 'lead_unlocked')),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pending_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Pending categories policies
CREATE POLICY "Anyone can view approved categories"
  ON pending_categories FOR SELECT
  TO authenticated
  USING (status = 'approved');

CREATE POLICY "Users can suggest categories"
  ON pending_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Admins can view all categories"
  ON pending_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON pending_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Analytics events policies
CREATE POLICY "Users can create their own events"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_categories_status ON pending_categories(status);
CREATE INDEX IF NOT EXISTS idx_pending_categories_created ON pending_categories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);