/*
  # Add seller_type field to profiles table

  1. Changes
    - Add `seller_type` column to `profiles` table
      - Type: text with constraint ('business' or 'individual')
      - Optional field (can be null)
      - Only relevant for seller accounts
    
  2. Purpose
    - Differentiate between business sellers (companies with VAT) and individual sellers (private persons)
    - Individual sellers will have gender and age_range like buyers
    - Business sellers will have business_name, vat_number, and primary_sector
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'seller_type'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN seller_type text CHECK (seller_type IN ('business', 'individual'));
  END IF;
END $$;
