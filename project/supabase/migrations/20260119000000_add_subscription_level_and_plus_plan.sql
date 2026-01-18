/*
  # Add Subscription Level and Plus Plan Support

  1. Updates
    - Add 'plus' to subscriptions.plan CHECK constraint
    - Add subscription_level column to profiles for quick access
    - Update subscription functions to support 'plus' plan

  2. Plans
    - free: Accesso base
    - plus: Stats base (19€/mese)
    - pro: Forecast AI, chat prioritarie (49€/mese)
*/

-- Update subscriptions.plan to support 'plus'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
  
  -- Add new constraint with 'plus' plan
  ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check 
    CHECK (plan IN ('free', 'plus', 'pro', 'enterprise'));
END $$;

-- Add subscription_level to profiles for quick access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_level text DEFAULT 'free' 
      CHECK (subscription_level IN ('free', 'plus', 'pro', 'enterprise'));
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_level ON profiles(subscription_level);

-- Function to sync subscription_level from subscriptions table
CREATE OR REPLACE FUNCTION sync_subscription_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update profile subscription_level when subscription changes
  UPDATE profiles
  SET subscription_level = NEW.plan
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-sync subscription_level
DROP TRIGGER IF EXISTS sync_subscription_level_trigger ON subscriptions;
CREATE TRIGGER sync_subscription_level_trigger
  AFTER INSERT OR UPDATE OF plan ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION sync_subscription_level();

-- Update get_user_plan function to support plus
-- (Already supports it via the constraint update)

-- Update get_user_daily_limits to support plus plan
CREATE OR REPLACE FUNCTION get_user_daily_limits(user_uuid uuid)
RETURNS TABLE (
  plan text,
  targets_viewed integer,
  targets_limit integer,
  offers_sent integer,
  offers_limit integer,
  can_view_more_targets boolean,
  can_send_more_offers boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan text;
  today_targets integer;
  today_offers integer;
BEGIN
  -- Ottieni il piano
  user_plan := get_user_plan(user_uuid);
  
  -- Ottieni i contatori di oggi
  SELECT COALESCE(dl.targets_viewed, 0), COALESCE(dl.offers_sent, 0)
  INTO today_targets, today_offers
  FROM daily_limits dl
  WHERE dl.user_id = user_uuid AND dl.date = CURRENT_DATE;
  
  -- Setta i valori di default se non esistono record
  today_targets := COALESCE(today_targets, 0);
  today_offers := COALESCE(today_offers, 0);
  
  -- Ritorna i risultati in base al piano
  IF user_plan = 'free' THEN
    RETURN QUERY SELECT 
      user_plan,
      today_targets,
      10::integer AS targets_limit,
      today_offers,
      3::integer AS offers_limit,
      (today_targets < 10) AS can_view_more_targets,
      (today_offers < 3) AS can_send_more_offers;
  ELSE
    -- Plus, Pro ed Enterprise: illimitato
    RETURN QUERY SELECT 
      user_plan,
      today_targets,
      -1::integer AS targets_limit,
      today_offers,
      -1::integer AS offers_limit,
      true AS can_view_more_targets,
      true AS can_send_more_offers;
  END IF;
END;
$$;
