/*
  # Sistema di Chat Assistente Cliente AI

  1. Nuove Tabelle
    - `support_conversations`
      - `id` (uuid, primary key) - ID univoco della conversazione
      - `user_id` (uuid, foreign key) - Utente che richiede supporto
      - `subject` (text) - Oggetto/argomento della conversazione
      - `status` (text) - Stato: 'open', 'in_progress', 'resolved', 'closed'
      - `priority` (text) - Priorità: 'low', 'medium', 'high', 'urgent'
      - `created_at` (timestamptz) - Data di creazione
      - `updated_at` (timestamptz) - Ultimo aggiornamento
      - `resolved_at` (timestamptz, nullable) - Data di risoluzione
    
    - `support_messages`
      - `id` (uuid, primary key) - ID univoco del messaggio
      - `conversation_id` (uuid, foreign key) - Riferimento alla conversazione
      - `sender_type` (text) - Tipo mittente: 'user', 'ai_assistant', 'human_agent'
      - `sender_id` (uuid, nullable, foreign key) - ID utente/agente (null per AI)
      - `content` (text) - Contenuto del messaggio
      - `metadata` (jsonb) - Metadati aggiuntivi (sentiment, categoria, etc)
      - `created_at` (timestamptz) - Data di invio

  2. Miglioramenti alle tabelle esistenti
    - Aggiungo campo `ai_context` a `messages` per suggerimenti AI nelle chat buyer-venditore
    - Aggiungo campo `sentiment_score` a `messages` per analisi sentiment

  3. Sicurezza
    - Enable RLS su tutte le nuove tabelle
    - Policy per permettere agli utenti di vedere solo le proprie conversazioni di supporto
    - Policy per permettere agli admin di vedere tutte le conversazioni
    - Policy per permettere all'AI di leggere e scrivere messaggi
*/

-- Tabella conversazioni supporto cliente
CREATE TABLE IF NOT EXISTS support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Tabella messaggi supporto
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES support_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL DEFAULT 'user'
    CHECK (sender_type IN ('user', 'ai_assistant', 'human_agent')),
  sender_id uuid REFERENCES profiles(id),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Aggiungi campi alle tabelle esistenti per AI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'ai_context'
  ) THEN
    ALTER TABLE messages ADD COLUMN ai_context jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'sentiment_score'
  ) THEN
    ALTER TABLE messages ADD COLUMN sentiment_score numeric;
  END IF;
END $$;

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id 
  ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status 
  ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_id 
  ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at 
  ON support_messages(created_at DESC);

-- Enable RLS
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policies per support_conversations
CREATE POLICY "Users can view own support conversations"
  ON support_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own support conversations"
  ON support_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own support conversations"
  ON support_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all support conversations"
  ON support_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policies per support_messages
CREATE POLICY "Users can view messages in own conversations"
  ON support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_conversations
      WHERE support_conversations.id = support_messages.conversation_id
      AND support_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_conversations
      WHERE support_conversations.id = support_messages.conversation_id
      AND support_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all support messages"
  ON support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create support messages"
  ON support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Function per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_support_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare timestamp
DROP TRIGGER IF EXISTS update_support_conversations_timestamp ON support_conversations;
CREATE TRIGGER update_support_conversations_timestamp
  BEFORE UPDATE ON support_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_support_conversation_timestamp();
