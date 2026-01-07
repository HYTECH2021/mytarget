/*
  # Aggiornamento campi profilo per Seller e Buyer

  ## Modifiche alla tabella profiles
  
  ### Campi per Seller (Business):
  - `business_name` (text) - Nome dell'attività commerciale
  - `vat_number` (text) - Partita IVA o Codice Fiscale
  - `primary_sector` (text) - Settore prevalente dell'attività
  
  ### Campi per Buyer (Personale):
  - `gender` (text) - Sesso/Genere (Maschio, Femmina, Altro/Non specificato)
  - `age_range` (text) - Fascia d'età (18-25, 26-35, 36-45, 46-55, 56-65, 66+)
  
  ## Note Importanti
  1. Il campo `age` (integer) viene rimosso e sostituito con `age_range` (text) per maggiore privacy
  2. I nuovi campi sono opzionali per mantenere retrocompatibilità
  3. I campi business sono rilevanti solo per i seller
  4. I campi gender e age_range sono rilevanti solo per i buyer
  5. Questi dati sono utili per l'AI Intelligence e la profilazione delle campagne ADS
*/

-- Rimuovi il campo age esistente se presente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE profiles DROP COLUMN age;
  END IF;
END $$;

-- Aggiungi campi per Seller (Business)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN business_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'vat_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN vat_number text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'primary_sector'
  ) THEN
    ALTER TABLE profiles ADD COLUMN primary_sector text;
  END IF;
END $$;

-- Aggiungi campi per Buyer (Personale)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender text CHECK (gender IN ('Maschio', 'Femmina', 'Altro/Non specificato'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'age_range'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age_range text CHECK (age_range IN ('18-25', '26-35', '36-45', '46-55', '56-65', '66+'));
  END IF;
END $$;

-- Crea indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_primary_sector ON profiles(primary_sector);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_age_range ON profiles(age_range);