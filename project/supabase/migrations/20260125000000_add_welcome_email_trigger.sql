/*
  # Add Welcome Email Trigger

  1. Function
    - Creates a function to send welcome email when user confirms email
    - Fetches user profile data (email, full_name, role, phone_number)
    - Calls the send-welcome-email Edge Function

  2. Trigger
    - Triggers when a user confirms their email (via auth hook or profile update)
    - Sends different templates for buyer vs seller
*/

-- Enable http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create function to send welcome email
CREATE OR REPLACE FUNCTION send_welcome_email_on_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  user_name text;
  user_role text;
  user_phone text;
  supabase_url text;
  anon_key text;
BEGIN
  -- Only send email if email_confirmed_at was just set (user confirmed email)
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) THEN
    
    -- Get user email from auth.users
    user_email := NEW.email;
    
    -- Get profile data
    SELECT p.full_name, p.role, p.phone_number
    INTO user_name, user_role, user_phone
    FROM profiles p
    WHERE p.id = NEW.id;
    
    -- Only send if we have the required data
    IF user_email IS NOT NULL AND user_name IS NOT NULL AND user_role IS NOT NULL AND (user_role = 'buyer' OR user_role = 'seller') THEN
      -- Get Supabase configuration
      supabase_url := current_setting('app.supabase_url', true);
      anon_key := current_setting('app.supabase_anon_key', true);
      
      -- Call the Edge Function to send welcome email
      PERFORM
        net.http_post(
          url := COALESCE(supabase_url, '') || '/functions/v1/send-welcome-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(anon_key, ''),
            'apikey', COALESCE(anon_key, '')
          ),
          body := jsonb_build_object(
            'email', user_email,
            'full_name', user_name,
            'role', user_role,
            'phone_number', COALESCE(user_phone, NULL)
          )
        );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Note: This trigger requires access to auth.users table
-- Supabase doesn't allow direct triggers on auth.users in most setups
-- Alternative: Use Supabase Auth Hooks or trigger on profiles table after first login

-- Alternative approach: Trigger on profiles table when email is confirmed
-- This assumes the profile is created before email confirmation
CREATE OR REPLACE FUNCTION check_and_send_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email_confirmed boolean;
  auth_user_email text;
  supabase_url text;
  anon_key text;
BEGIN
  -- Check if user has confirmed email
  SELECT email_confirmed_at IS NOT NULL, email
  INTO user_email_confirmed, auth_user_email
  FROM auth.users
  WHERE id = NEW.id;
  
  -- Only send if email is confirmed and this is a new profile (first time)
  IF user_email_confirmed AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.email IS DISTINCT FROM NEW.email)) THEN
    
    -- Get Supabase configuration
    supabase_url := current_setting('app.supabase_url', true);
    anon_key := current_setting('app.supabase_anon_key', true);
    
    -- Call the Edge Function to send welcome email
    PERFORM
      net.http_post(
        url := COALESCE(supabase_url, '') || '/functions/v1/send-welcome-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(anon_key, ''),
          'apikey', COALESCE(anon_key, '')
        ),
        body := jsonb_build_object(
          'email', COALESCE(auth_user_email, NEW.email),
          'full_name', NEW.full_name,
          'role', NEW.role,
          'phone_number', NEW.phone_number
        )
      );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (fires after insert/update)
-- Note: This will send email after profile is created AND email is confirmed
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON profiles;
CREATE TRIGGER trigger_send_welcome_email
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.role IN ('buyer', 'seller'))
  EXECUTE FUNCTION check_and_send_welcome_email();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_and_send_welcome_email() TO authenticated;
GRANT EXECUTE ON FUNCTION send_welcome_email_on_confirmation() TO authenticated;
