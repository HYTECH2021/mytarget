/*
  # Add New Target Notification Trigger for Sellers

  1. Function
    - Creates a function to notify sellers when a new target is created
    - Finds sellers with matching category (primary_sector)
    - Calls the notify-sellers-new-target Edge Function

  2. Trigger
    - Automatically fires after a target is inserted
    - Only triggers for active targets
    - Notifies all sellers with matching primary_sector or all if null
*/

-- Enable http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create function to notify sellers about new targets
CREATE OR REPLACE FUNCTION notify_sellers_new_target()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_category text;
  target_title text;
  target_location text;
  target_budget numeric;
  supabase_url text;
  anon_key text;
BEGIN
  -- Only process if target is active
  IF NEW.status = 'active' THEN
    -- Get target details
    target_category := NEW.category;
    target_title := NEW.title;
    target_location := NEW.location;
    target_budget := NEW.budget;

    -- Get Supabase URL from environment (set in Supabase Dashboard)
    -- For Supabase, use the project URL directly
    supabase_url := current_setting('app.settings.supabase_url', true);
    
    -- If not set, use a default pattern (will need to be configured)
    IF supabase_url IS NULL OR supabase_url = '' THEN
      -- Try to get from Supabase project settings
      -- This should be configured in Supabase Dashboard → Settings → API
      supabase_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co';
    END IF;

    -- Get anon key (should be set in Supabase Dashboard)
    anon_key := current_setting('app.settings.supabase_anon_key', true);

    -- Only proceed if we have the URL
    IF supabase_url IS NOT NULL AND supabase_url != '' THEN
      -- Call the Edge Function to notify sellers
      -- Note: This is async and won't block the insert
      PERFORM
        net.http_post(
          url := supabase_url || '/functions/v1/notify-sellers-new-target',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(anon_key, ''),
            'apikey', COALESCE(anon_key, '')
          ),
          body := jsonb_build_object(
            'target_id', NEW.id::text,
            'target_title', target_title,
            'category', target_category,
            'location', target_location,
            'budget', target_budget
          )
        );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_sellers_new_target ON targets;
CREATE TRIGGER trigger_notify_sellers_new_target
  AFTER INSERT ON targets
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION notify_sellers_new_target();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION notify_sellers_new_target() TO authenticated;
