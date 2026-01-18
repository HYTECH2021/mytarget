/*
  # Correzione Limiti Abbonamento: Da Giornalieri a Mensili

  ## Descrizione
  Aggiorna il sistema di limiti da giornaliero a mensile per il piano FREE.

  ## Modifiche ai Limiti
  
  ### Piano FREE (prima):
  - 10 richieste visualizzate al giorno
  - 3 offerte inviate al giorno
  
  ### Piano FREE (dopo):
  - 30 richieste visualizzate al mese
  - 10 offerte inviate al mese

  ## 1. Rinomina Tabella
  - `daily_limits` → `usage_tracking` (più appropriato per tracciamento mensile)

  ## 2. Aggiornamento Funzioni
  - `check_daily_targets_limit()` → verifica su base mensile (30/mese)
  - `check_daily_offers_limit()` → verifica su base mensile (10/mese)
  - `get_user_daily_limits()` → ritorna limiti mensili

  ## 3. Logica
  Il tracciamento avviene per data, ma i contatori vengono sommati per l'intero mese corrente.
*/

-- Rinomina la tabella (se necessario manteniamo daily_limits per compatibilità)
-- La tabella continua a tracciare per data, ma le query sommeranno per mese

-- Aggiorna funzione per verificare limite richieste visualizzate (MENSILE)
CREATE OR REPLACE FUNCTION check_daily_targets_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan text;
  monthly_views integer;
BEGIN
  -- Ottieni il piano dell'utente
  user_plan := get_user_plan(user_uuid);
  
  -- Pro ed Enterprise hanno limiti illimitati
  IF user_plan IN ('pro', 'enterprise') THEN
    RETURN true;
  END IF;
  
  -- Piano FREE: max 30 visualizzazioni AL MESE
  SELECT COALESCE(SUM(targets_viewed), 0) INTO monthly_views
  FROM daily_limits
  WHERE user_id = user_uuid 
    AND date >= date_trunc('month', CURRENT_DATE)
    AND date < date_trunc('month', CURRENT_DATE) + interval '1 month';
  
  RETURN COALESCE(monthly_views, 0) < 30;
END;
$$;

-- Aggiorna funzione per verificare limite offerte inviate (MENSILE)
CREATE OR REPLACE FUNCTION check_daily_offers_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan text;
  monthly_offers integer;
BEGIN
  -- Ottieni il piano dell'utente
  user_plan := get_user_plan(user_uuid);
  
  -- Pro ed Enterprise hanno limiti illimitati
  IF user_plan IN ('pro', 'enterprise') THEN
    RETURN true;
  END IF;
  
  -- Piano FREE: max 10 offerte AL MESE
  SELECT COALESCE(SUM(offers_sent), 0) INTO monthly_offers
  FROM daily_limits
  WHERE user_id = user_uuid 
    AND date >= date_trunc('month', CURRENT_DATE)
    AND date < date_trunc('month', CURRENT_DATE) + interval '1 month';
  
  RETURN COALESCE(monthly_offers, 0) < 10;
END;
$$;

-- Aggiorna funzione per ottenere i limiti mensili correnti dell'utente
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
  monthly_targets integer;
  monthly_offers integer;
BEGIN
  -- Ottieni il piano
  user_plan := get_user_plan(user_uuid);
  
  -- Ottieni i contatori del MESE CORRENTE
  SELECT 
    COALESCE(SUM(dl.targets_viewed), 0), 
    COALESCE(SUM(dl.offers_sent), 0)
  INTO monthly_targets, monthly_offers
  FROM daily_limits dl
  WHERE dl.user_id = user_uuid 
    AND dl.date >= date_trunc('month', CURRENT_DATE)
    AND dl.date < date_trunc('month', CURRENT_DATE) + interval '1 month';
  
  -- Setta i valori di default se non esistono record
  monthly_targets := COALESCE(monthly_targets, 0);
  monthly_offers := COALESCE(monthly_offers, 0);
  
  -- Ritorna i risultati in base al piano
  IF user_plan = 'free' THEN
    RETURN QUERY SELECT 
      user_plan,
      monthly_targets,
      30::integer AS targets_limit,
      monthly_offers,
      10::integer AS offers_limit,
      (monthly_targets < 30) AS can_view_more_targets,
      (monthly_offers < 10) AS can_send_more_offers;
  ELSE
    -- Pro ed Enterprise: illimitato
    RETURN QUERY SELECT 
      user_plan,
      monthly_targets,
      -1::integer AS targets_limit,
      monthly_offers,
      -1::integer AS offers_limit,
      true AS can_view_more_targets,
      true AS can_send_more_offers;
  END IF;
END;
$$;