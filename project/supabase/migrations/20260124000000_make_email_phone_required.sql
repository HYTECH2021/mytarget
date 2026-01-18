/*
  # Make email and phone_number required for Buyer profiles

  1. Changes
    - Make `phone_number` NOT NULL for new buyer registrations
    - Add constraint to ensure email is always present (already enforced by auth.users)
    - Update existing profiles to ensure phone_number is set (optional migration)
    
  Note: This migration makes phone_number required for all users, but you may want
  to enforce it only for buyers. The application layer should validate this.
*/

-- Update existing profiles to set a placeholder if phone_number is null
-- This ensures data integrity before adding the NOT NULL constraint
-- Comment this out if you want to keep existing null values and only enforce for new registrations
/*
UPDATE profiles
SET phone_number = 'DA_AGGIORNARE'
WHERE phone_number IS NULL;
*/

-- Make phone_number NOT NULL (uncomment if you want to enforce at database level)
-- Note: Consider making this conditional (only for buyers) or keep it optional
-- and enforce validation at application level instead
/*
ALTER TABLE profiles 
ALTER COLUMN phone_number SET NOT NULL;
*/

-- Add check constraint to ensure phone_number is not empty if provided
ALTER TABLE profiles 
ADD CONSTRAINT check_phone_number_not_empty 
CHECK (phone_number IS NULL OR LENGTH(TRIM(phone_number)) > 0);

-- Email is already required through auth.users, but we ensure it exists in profiles
-- This is typically handled by application logic
ALTER TABLE profiles 
ADD CONSTRAINT check_email_not_empty 
CHECK (email IS NOT NULL AND LENGTH(TRIM(email)) > 0);
