/*
  # I-LOOK For - Reverse Marketplace Schema

  ## Overview
  This migration creates the complete database schema for the I-LOOK For reverse marketplace
  where buyers post what they're looking for and sellers send offers.

  ## New Tables
  
  ### 1. profiles
  Extends auth.users with additional profile information
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `full_name` (text, not null)
  - `city` (text, not null)
  - `age` (integer)
  - `profession` (text)
  - `role` (text, not null) - 'buyer' or 'seller'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. requests
  Buyer posts describing what they're looking for
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text, not null) - What they're looking for
  - `description` (text) - Detailed description
  - `category` (text, not null) - Product/service category
  - `budget` (numeric) - Target budget
  - `location` (text, not null) - Where they are located
  - `status` (text) - 'active', 'closed', 'archived'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. offers
  Seller offers sent to buyers
  - `id` (uuid, primary key)
  - `request_id` (uuid, references requests)
  - `seller_id` (uuid, references profiles)
  - `message` (text, not null) - Offer message
  - `proposed_price` (numeric) - Seller's proposed price
  - `status` (text) - 'pending', 'accepted', 'rejected'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 4. subscriptions
  Seller subscription plans
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, unique)
  - `plan` (text, not null) - 'free', 'pro', 'enterprise'
  - `status` (text, not null) - 'active', 'cancelled', 'expired'
  - `started_at` (timestamptz)
  - `expires_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Profiles: Users can read all profiles, but only update their own
  - Requests: Anyone can read active requests, only owners can create/update/delete their requests
  - Offers: Sellers can create offers, buyers can view offers on their requests
  - Subscriptions: Users can only view their own subscription

  ## Important Notes
  1. All tables have RLS enabled for data security
  2. Policies ensure users can only modify their own data
  3. Sellers can browse all active requests
  4. Buyers receive offers only on their requests
  5. Default values are set for timestamps and status fields
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  city text NOT NULL,
  age integer,
  profession text,
  role text NOT NULL CHECK (role IN ('buyer', 'seller')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  budget numeric,
  location text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  proposed_price numeric,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  plan text NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Requests policies
CREATE POLICY "Anyone can view active requests"
  ON requests FOR SELECT
  TO authenticated
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Buyers can create requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own requests"
  ON requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Offers policies
CREATE POLICY "Sellers can view their own offers"
  ON offers FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can view offers on their requests"
  ON offers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = offers.request_id
      AND requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can create offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own offers"
  ON offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_category ON requests(category);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_offers_request_id ON offers(request_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller_id ON offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);