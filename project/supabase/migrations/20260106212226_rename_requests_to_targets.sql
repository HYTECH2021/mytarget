/*
  # Rename requests table to targets

  ## Summary
  This migration renames the "requests" table to "targets" to better reflect the 
  terminology used in the Target Generator feature where buyers post their targets.

  ## Changes Made
  
  1. **Table Rename**
     - Rename `requests` table to `targets`
     - All columns remain the same:
       - `id` (uuid, primary key)
       - `user_id` (uuid, references profiles)
       - `title` (text, not null)
       - `description` (text)
       - `category` (text, not null)
       - `budget` (numeric)
       - `location` (text, not null)
       - `status` (text, default 'active')
       - `created_at`, `updated_at` (timestamptz)
  
  2. **Foreign Key Updates**
     - Update `offers` table to reference `targets` instead of `requests`
     - Update `category_suggestions` table to reference `targets`
     - Update `chat_sessions` table to reference `targets`
     - Update `unlocked_leads` table to reference `targets`
  
  3. **Index Updates**
     - Rename all indexes from `requests` to `targets`
  
  4. **RLS Policies**
     - Drop and recreate all policies with new table name
     - Maintain same security rules:
       - Anyone can view active targets
       - Only owners can create/update/delete their targets

  ## Important Notes
  - All existing data is preserved during the rename
  - No data loss occurs
  - All relationships are maintained
  - Security policies remain the same
*/

-- Rename the table
ALTER TABLE IF EXISTS requests RENAME TO targets;

-- Rename the indexes
ALTER INDEX IF EXISTS idx_requests_user_id RENAME TO idx_targets_user_id;
ALTER INDEX IF EXISTS idx_requests_category RENAME TO idx_targets_category;
ALTER INDEX IF EXISTS idx_requests_status RENAME TO idx_targets_status;

-- Drop old policies (they're still bound to old table name)
DROP POLICY IF EXISTS "Anyone can view active requests" ON targets;
DROP POLICY IF EXISTS "Buyers can create requests" ON targets;
DROP POLICY IF EXISTS "Users can update own requests" ON targets;
DROP POLICY IF EXISTS "Users can delete own requests" ON targets;

-- Recreate policies with correct names
CREATE POLICY "Anyone can view active targets"
  ON targets FOR SELECT
  TO authenticated
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Buyers can create targets"
  ON targets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own targets"
  ON targets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own targets"
  ON targets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update foreign key column names in related tables
DO $$
BEGIN
  -- Update offers table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE offers RENAME COLUMN request_id TO target_id;
  END IF;

  -- Update category_suggestions table if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'category_suggestions' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE category_suggestions RENAME COLUMN request_id TO target_id;
  END IF;

  -- Update chat_sessions table if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE chat_sessions RENAME COLUMN request_id TO target_id;
  END IF;

  -- Update unlocked_leads table if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'unlocked_leads' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE unlocked_leads RENAME COLUMN request_id TO target_id;
  END IF;
END $$;

-- Drop and recreate affected policies in offers table
DROP POLICY IF EXISTS "Sellers can view their own offers" ON offers;
DROP POLICY IF EXISTS "Buyers can view offers on their requests" ON offers;

CREATE POLICY "Sellers can view their own offers"
  ON offers FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can view offers on their targets"
  ON offers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM targets
      WHERE targets.id = offers.target_id
      AND targets.user_id = auth.uid()
    )
  );
