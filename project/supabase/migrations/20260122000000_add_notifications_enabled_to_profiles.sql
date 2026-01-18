/*
  # Add notifications_enabled field to profiles table

  1. Changes
    - Add `notifications_enabled` column to `profiles` table
      - Type: boolean
      - Default: null (so we can detect first-time users)
      - Used to store user preference for real-time notifications
*/

-- Add notifications_enabled column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notifications_enabled boolean DEFAULT NULL;
  END IF;
END $$;

-- Create index for filtering users with notifications enabled
CREATE INDEX IF NOT EXISTS idx_profiles_notifications_enabled ON profiles(notifications_enabled) WHERE notifications_enabled = true;
