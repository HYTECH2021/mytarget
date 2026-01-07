/*
  # Add Unlocked Leads System for MY TARGET

  1. New Tables
    - `unlocked_leads`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, references profiles)
      - `request_id` (uuid, references requests)
      - `unlocked_at` (timestamptz)
      - `expires_at` (timestamptz, nullable)
  
  2. New Columns
    - Add `is_premium` boolean to `requests` for premium target visibility
    - Add `unlock_cost` integer to `requests` for lead unlock pricing
  
  3. Security
    - Enable RLS on `unlocked_leads`
    - Add policies for sellers to view their unlocked leads
    - Add policies for creating unlock records
*/

-- Add new columns to requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE requests ADD COLUMN is_premium boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'unlock_cost'
  ) THEN
    ALTER TABLE requests ADD COLUMN unlock_cost integer DEFAULT 0;
  END IF;
END $$;

-- Create unlocked_leads table
CREATE TABLE IF NOT EXISTS unlocked_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(seller_id, request_id)
);

-- Enable RLS
ALTER TABLE unlocked_leads ENABLE ROW LEVEL SECURITY;

-- Unlocked leads policies
CREATE POLICY "Sellers can view their unlocked leads"
  ON unlocked_leads FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can create unlock records"
  ON unlocked_leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_unlocked_leads_seller ON unlocked_leads(seller_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_leads_request ON unlocked_leads(request_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_leads_expires ON unlocked_leads(expires_at);