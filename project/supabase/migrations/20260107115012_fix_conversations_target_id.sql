/*
  # Fix conversations table target_id column
  
  ## Summary
  This migration fixes the conversations table by renaming request_id to target_id
  to match the rename done in the previous migration.
  
  ## Changes Made
  
  1. **Column Rename**
     - Rename `request_id` to `target_id` in conversations table
  
  2. **Index Updates**
     - Rename the index from request to target
  
  3. **Policy Updates**
     - Recreate policies to ensure they work correctly
  
  ## Important Notes
  - All existing data is preserved
  - All relationships are maintained
*/

-- Rename the column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN request_id TO target_id;
  END IF;
END $$;

-- Rename the index
ALTER INDEX IF EXISTS idx_conversations_request RENAME TO idx_conversations_target;

-- Drop and recreate policies to ensure they reference the correct column
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Buyers can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- Recreate policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);