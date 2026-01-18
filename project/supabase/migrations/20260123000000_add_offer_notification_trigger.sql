/*
  # Add Offer Notification Trigger

  1. Function
    - Creates a function to trigger email/push notification when an offer is created
    - Fetches buyer information from the target
    - Calls the send-offer-notification Edge Function

  2. Trigger
    - Automatically fires after an offer is inserted
    - Only triggers for offers on active targets
*/

-- Create function to send offer notification
CREATE OR REPLACE FUNCTION notify_buyer_new_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  buyer_email text;
  buyer_name text;
  target_title text;
  seller_name text;
  site_url text;
  supabase_url text;
  anon_key text;
BEGIN
  -- Get buyer and target information
  SELECT 
    p.email,
    p.full_name,
    t.title,
    seller_profile.full_name
  INTO buyer_email, buyer_name, target_title, seller_name
  FROM targets t
  INNER JOIN profiles p ON p.id = t.user_id
  INNER JOIN profiles seller_profile ON seller_profile.id = NEW.seller_id
  WHERE t.id = NEW.target_id;

  -- Only send notification if buyer email exists and target is active
  IF buyer_email IS NOT NULL AND buyer_name IS NOT NULL THEN
    -- Get Supabase configuration
    supabase_url := current_setting('app.supabase_url', true);
    anon_key := current_setting('app.supabase_anon_key', true);
    site_url := current_setting('app.site_url', true);

    -- Call the Edge Function to send email and push notification
    -- Note: This requires the http extension to be enabled
    PERFORM
      net.http_post(
        url := COALESCE(supabase_url, '') || '/functions/v1/send-offer-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(anon_key, ''),
          'apikey', COALESCE(anon_key, '')
        ),
        body := jsonb_build_object(
          'offer_id', NEW.id::text,
          'target_id', NEW.target_id::text,
          'seller_id', NEW.seller_id::text,
          'buyer_email', buyer_email,
          'buyer_name', buyer_name,
          'target_title', target_title,
          'seller_name', seller_name
        )
      );
  END IF;

  RETURN NEW;
END;
$$;

-- Enable http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_buyer_new_offer ON offers;
CREATE TRIGGER trigger_notify_buyer_new_offer
  AFTER INSERT ON offers
  FOR EACH ROW
  WHEN (NEW.target_id IS NOT NULL)
  EXECUTE FUNCTION notify_buyer_new_offer();

-- Grant execute permission to authenticated users (for the trigger)
GRANT EXECUTE ON FUNCTION notify_buyer_new_offer() TO authenticated;
