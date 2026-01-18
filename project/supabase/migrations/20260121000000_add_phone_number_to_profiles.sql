/*
  # Add phone_number field to profiles table

  1. Changes
    - Add `phone_number` column to `profiles` table
      - Type: text (optional, can be null)
      - Allows international phone numbers
      - Useful for buyer and seller contact information
*/

-- Add phone_number column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
END $$;

-- Create index for phone number searches (optional, for future use)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number) WHERE phone_number IS NOT NULL;
