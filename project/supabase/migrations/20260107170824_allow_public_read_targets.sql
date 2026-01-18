/*
  # Allow public read access to targets

  1. Changes
    - Drop existing SELECT policy for targets
    - Create new SELECT policy that allows public read access to active targets
    - Keep existing INSERT, UPDATE, DELETE policies unchanged
  
  2. Security
    - Anyone can view active targets (needed for guest mode)
    - Only authenticated users can create, update, or delete their own targets
*/

DO $$
BEGIN
  -- Drop existing SELECT policies
  DROP POLICY IF EXISTS "Users can view own targets" ON targets;
  DROP POLICY IF EXISTS "Users can read own targets" ON targets;
  DROP POLICY IF EXISTS "Buyers can view own targets" ON targets;
END $$;

-- Create new SELECT policy for public read access to active targets
CREATE POLICY "Public can view active targets"
  ON targets
  FOR SELECT
  USING (status = 'active');
