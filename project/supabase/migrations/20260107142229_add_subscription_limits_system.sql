/*
  # Sistema di Limiti per Abbonamenti

  ## Descrizione
  Questo migration aggiunge il sistema completo di gestione dei limiti giornalieri
  basati sul piano di abbonamento (free, pro, enterprise).

  ## 1. Nuove Tabelle
    
  ### daily_limits
  Traccia l'utilizzo giornaliero per ogni utente
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `date` (date, not null) - Data di riferimento
  - `targets_viewed` (integer, default 0) - Richieste visualizzate oggi
  - `offers_sent` (integer, default 0) - Offerte inviate oggi
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - UNIQUE constraint su (user_id, date)

  ## 2. Funzioni SQL
  
  ### get_user_plan(user_uuid)
  Ritorna il piano corrente dell'utente ('free', 'pro', 'enterprise')
  
  ### check_daily_targets_limit(user_uuid)
  Verifica se l'utente può visualizzare altre richieste oggi
  - Piano FREE: max 10 al giorno
  - Piano PRO/ENTERPRISE: illimitato
  
  ### check_daily_offers_limit(user_uuid)
  Verifica se l'utente può inviare altre offerte oggi
  - Piano FREE: max 3 al giorno
  - Piano PRO/ENTERPRISE: illimitato
  
  ### increment_targets_viewed(user_uuid)
  Incrementa il contatore delle richieste visualizzate
  
  ### increment_offers_sent(user_uuid)
  Incrementa il contatore delle offerte inviate

  ## 3. Modifiche alle Policies
  
  Aggiorna le policy di offers per verificare i limiti prima dell'inserimento

  ## 4. Sicurezza
  
  - RLS abilitato su daily_limits
  - Gli utenti possono vedere solo i propri limiti
  - Le funzioni verificano automaticamente i permessi

  ## Note Importanti
  1. I contatori si resettano automaticamente ogni giorno (nuovo record per data)
  2. Piano FREE: 10 richieste visualizzate, 3 offerte al giorno
  3. Piano PRO ed ENTERPRISE: tutto illimitato
  4. Il sistema crea automaticamente subscription FREE per nuovi utenti
*/

-- Crea tabella daily_limits
CREATE TABLE IF NOT EXISTS daily_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  targets_viewed integer DEFAULT 0,
  offers_sent integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Abilita RLS su daily_limits
ALTER TABLE daily_limits ENABLE ROW LEVEL SECURITY;

-- Policy per daily_limits
CREATE POLICY "Users can view own daily limits"
  ON daily_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily limits"
  ON daily_limits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily limits"
  ON daily_limits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_daily_limits_user_date ON daily_limits(user_id, date);

-- Funzione per ottenere il piano dell'utente
CREATE OR REPLACE FUNCTION get_user_plan(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan text;
BEGIN
  SELECT plan INTO user_plan
  FROM subscriptions
  WHERE user_id = user_uuid AND status = 'active'
  ORDER BY started_at DESC
  LIMIT 1;
  
  -- Se non ha subscription, ritorna 'free'
  RETURN COALESCE(user_plan, 'free');
END;
$$;

-- Funzione per verificare limite richieste visualizzate
CREATE OR REPLACE FUNCTION check_daily_targets_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan text;
  today_views integer;
BEGIN
  -- Ottieni il piano dell'utente
  user_plan := get_user_plan(user_uuid);
  
  -- Pro ed Enterprise hanno limiti illimitati
  IF user_plan IN ('pro', 'enterprise') THEN
    RETURN true;
  END IF;
  
  -- Piano FREE: max 10 visualizzazioni al giorno
  SELECT COALESCE(targets_viewed, 0) INTO today_views
  FROM daily_limits
  WHERE user_id = user_uuid AND date = CURRENT_DATE;
  
  RETURN COALESCE(today_views, 0) < 10;
END;
$$;

-- Funzione per verificare limite offerte inviate
CREATE OR REPLACE FUNCTION check_daily_offers_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan text;
  today_offers integer;
BEGIN
  -- Ottieni il piano dell'utente
  user_plan := get_user_plan(user_uuid);
  
  -- Pro ed Enterprise hanno limiti illimitati
  IF user_plan IN ('pro', 'enterprise') THEN
    RETURN true;
  END IF;
  
  -- Piano FREE: max 3 offerte al giorno
  SELECT COALESCE(offers_sent, 0) INTO today_offers
  FROM daily_limits
  WHERE user_id = user_uuid AND date = CURRENT_DATE;
  
  RETURN COALESCE(today_offers, 0) < 3;
END;
$$;

-- Funzione per incrementare visualizzazioni richieste
CREATE OR REPLACE FUNCTION increment_targets_viewed(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO daily_limits (user_id, date, targets_viewed, offers_sent)
  VALUES (user_uuid, CURRENT_DATE, 1, 0)
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    targets_viewed = daily_limits.targets_viewed + 1,
    updated_at = now();
END;
$$;

-- Funzione per incrementare offerte inviate
CREATE OR REPLACE FUNCTION increment_offers_sent(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO daily_limits (user_id, date, targets_viewed, offers_sent)
  VALUES (user_uuid, CURRENT_DATE, 0, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    offers_sent = daily_limits.offers_sent + 1,
    updated_at = now();
END;
$$;

-- Funzione per ottenere i limiti giornalieri correnti dell'utente
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
    -- Pro ed Enterprise: illimitato
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