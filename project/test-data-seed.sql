-- Script per popolare il database con dati di test realistici
-- IMPORTANTE: Esegui questo script dal pannello SQL di Supabase

-- Step 1: Crea utenti di test in auth.users
-- Nota: Le password sono già hashate (password: "Test123!")
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'marco.rossi@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8JJjKEfUXdLJELLJ1yS0Wv0u.EIky',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'laura.bianchi@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8JJjKEfUXdLJELLJ1yS0Wv0u.EIky',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'giuseppe.verdi@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8JJjKEfUXdLJELLJ1yS0Wv0u.EIky',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'antonio.ferrari@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8JJjKEfUXdLJELLJ1yS0Wv0u.EIky',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'stefania.ricci@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8JJjKEfUXdLJELLJ1yS0Wv0u.EIky',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '00000000-0000-0000-0000-000000000000',
    'paolo.esposito@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8JJjKEfUXdLJELLJ1yS0Wv0u.EIky',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- Step 2: Crea profili per gli utenti
INSERT INTO profiles (id, email, full_name, city, profession, role, business_name, vat_number, primary_sector, gender, age_range)
VALUES
  -- Buyers
  ('11111111-1111-1111-1111-111111111111', 'marco.rossi@example.com', 'Marco Rossi', 'Milano', 'Imprenditore', 'buyer', NULL, NULL, NULL, 'Maschio', '36-45'),
  ('22222222-2222-2222-2222-222222222222', 'laura.bianchi@example.com', 'Laura Bianchi', 'Roma', 'Manager Acquisti', 'buyer', NULL, NULL, NULL, 'Femmina', '26-35'),
  ('33333333-3333-3333-3333-333333333333', 'giuseppe.verdi@example.com', 'Giuseppe Verdi', 'Firenze', 'Designer', 'buyer', NULL, NULL, NULL, 'Maschio', '26-35'),

  -- Sellers
  ('44444444-4444-4444-4444-444444444444', 'antonio.ferrari@example.com', 'Antonio Ferrari', 'Milano', 'CEO', 'seller', 'DevTech Solutions SRL', 'IT12345678901', 'Software & Tech'),
  ('55555555-5555-5555-5555-555555555555', 'stefania.ricci@example.com', 'Stefania Ricci', 'Bologna', 'Ingegnere Energetico', 'seller', 'Green Energy Italia SpA', 'IT23456789012', 'Energie Rinnovabili'),
  ('66666666-6666-6666-6666-666666666666', 'paolo.esposito@example.com', 'Paolo Esposito', 'Napoli', 'Direttore Commerciale', 'seller', 'Fashion Fabrics SRL', 'IT34567890123', 'Moda & Tessile')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Crea targets (richieste degli acquirenti)
DO $$
DECLARE
  cat_elettronica uuid;
  cat_casa uuid;
  cat_servizi uuid;
  cat_sport uuid;
  cat_auto uuid;
BEGIN
  -- Ottieni gli ID delle categorie
  SELECT id INTO cat_elettronica FROM categories WHERE slug = 'elettronica' LIMIT 1;
  SELECT id INTO cat_casa FROM categories WHERE slug = 'casa-giardino' LIMIT 1;
  SELECT id INTO cat_servizi FROM categories WHERE slug = 'servizi-professionali' LIMIT 1;
  SELECT id INTO cat_sport FROM categories WHERE slug = 'sport-tempo-libero' LIMIT 1;
  SELECT id INTO cat_auto FROM categories WHERE slug = 'auto-moto' LIMIT 1;

  -- Inserisci targets
  INSERT INTO targets (id, buyer_id, title, description, budget_min, budget_max, deadline, status, category_id, location, urgency)
  VALUES
    (
      gen_random_uuid(),
      '11111111-1111-1111-1111-111111111111',
      'Laptop professionale per ufficio',
      'Cerco 10 laptop professionali per il mio ufficio. Requisiti: Intel i7, 16GB RAM, SSD 512GB, Windows 11 Pro. Preferibilmente con garanzia estesa di 3 anni.',
      8000,
      12000,
      now() + interval '30 days',
      'open',
      cat_elettronica,
      'Milano, Lombardia',
      'high'
    ),
    (
      gen_random_uuid(),
      '22222222-2222-2222-2222-222222222222',
      'Arredamento completo per nuovo ufficio',
      'Ho bisogno di arredare completamente un ufficio di 200mq: scrivanie, sedie ergonomiche, armadi, sala riunioni. Stile moderno e minimalista.',
      15000,
      25000,
      now() + interval '45 days',
      'open',
      cat_casa,
      'Roma, Lazio',
      'medium'
    ),
    (
      gen_random_uuid(),
      '33333333-3333-3333-3333-333333333333',
      'Consulente fiscale per startup',
      'Startup innovativa cerca commercialista esperto in agevolazioni fiscali, startup innovative e pianificazione fiscale. Contratto annuale.',
      3000,
      5000,
      now() + interval '20 days',
      'open',
      cat_servizi,
      'Firenze, Toscana',
      'high'
    ),
    (
      gen_random_uuid(),
      '11111111-1111-1111-1111-111111111111',
      'Attrezzatura palestra aziendale',
      'Voglio allestire una piccola palestra aziendale: tapis roulant, pesi, cyclette, tappetini yoga. Budget flessibile per qualità professionale.',
      5000,
      10000,
      now() + interval '60 days',
      'open',
      cat_sport,
      'Milano, Lombardia',
      'low'
    ),
    (
      gen_random_uuid(),
      '22222222-2222-2222-2222-222222222222',
      'Auto aziendali elettriche',
      'Cerco 5 auto elettriche per flotta aziendale. Autonomia minima 400km, ricarica rapida, possibilmente con incentivi statali.',
      100000,
      150000,
      now() + interval '90 days',
      'open',
      cat_auto,
      'Roma, Lazio',
      'medium'
    );

  -- Aggiorna i contatori delle categorie
  UPDATE categories SET request_count = (SELECT COUNT(*) FROM targets WHERE category_id = cat_elettronica) WHERE id = cat_elettronica;
  UPDATE categories SET request_count = (SELECT COUNT(*) FROM targets WHERE category_id = cat_casa) WHERE id = cat_casa;
  UPDATE categories SET request_count = (SELECT COUNT(*) FROM targets WHERE category_id = cat_servizi) WHERE id = cat_servizi;
  UPDATE categories SET request_count = (SELECT COUNT(*) FROM targets WHERE category_id = cat_sport) WHERE id = cat_sport;
  UPDATE categories SET request_count = (SELECT COUNT(*) FROM targets WHERE category_id = cat_auto) WHERE id = cat_auto;
END $$;

-- Step 4: Crea alcune offerte dai seller
DO $$
DECLARE
  target1 uuid;
  target2 uuid;
  target3 uuid;
BEGIN
  -- Ottieni alcuni target IDs
  SELECT id INTO target1 FROM targets WHERE title LIKE '%Laptop%' LIMIT 1;
  SELECT id INTO target2 FROM targets WHERE title LIKE '%Arredamento%' LIMIT 1;
  SELECT id INTO target3 FROM targets WHERE title LIKE '%Consulente%' LIMIT 1;

  -- Inserisci offerte
  INSERT INTO offers (target_id, seller_id, message, price, delivery_time, status)
  VALUES
    (
      target1,
      '44444444-4444-4444-4444-444444444444',
      'Buongiorno! Possiamo fornirvi 10 Dell Latitude 7430 con le specifiche richieste. Prezzo competitivo, garanzia 3 anni on-site, consegna in 10 giorni lavorativi. Disponibili per un incontro per discutere i dettagli.',
      10500,
      10,
      'pending'
    ),
    (
      target1,
      '55555555-5555-5555-5555-555555555555',
      'Salve, abbiamo in stock HP EliteBook 840 G9 che soddisfano perfettamente le vostre esigenze. Possiamo offrire uno sconto del 15% per ordini sopra i 10 pezzi. Include configurazione e supporto tecnico gratuito per 6 mesi.',
      9800,
      7,
      'pending'
    ),
    (
      target2,
      '66666666-6666-6666-6666-666666666666',
      'Buongiorno! Siamo specializzati in arredamento uffici moderni. Possiamo realizzare un progetto completo 3D prima dell''ordine. Mobili italiani di alta qualità, montaggio incluso. Preventivo dettagliato disponibile dopo sopralluogo gratuito.',
      22000,
      30,
      'pending'
    ),
    (
      target3,
      '44444444-4444-4444-4444-444444444444',
      'Salve! Il nostro studio è specializzato in startup innovative. Offriamo: consulenza fiscale continuativa, gestione pratiche agevolazioni, pianificazione fiscale ottimizzata. Tariffa forfettaria mensile comprensiva di tutti i servizi.',
      4200,
      15,
      'pending'
    );
END $$;

-- Mostra un riepilogo
SELECT
  'Dati di test creati con successo!' as messaggio,
  (SELECT COUNT(*) FROM profiles) as profili_totali,
  (SELECT COUNT(*) FROM profiles WHERE role = 'buyer') as buyers,
  (SELECT COUNT(*) FROM profiles WHERE role = 'seller') as sellers,
  (SELECT COUNT(*) FROM targets) as targets_totali,
  (SELECT COUNT(*) FROM offers) as offerte_totali;
