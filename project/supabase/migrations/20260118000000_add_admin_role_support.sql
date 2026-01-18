/*
  # Add Admin Role Support

  1. Updates
    - Add 'admin' to profiles.role CHECK constraint
    - Add default admin user setup function
    - Update RLS policies to support admin role

  2. Security
    - Admins can access all data
    - Admins can manage users, targets, categories
*/

-- Update profiles.role to support 'admin'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  
  -- Add new constraint with 'admin' role
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('buyer', 'seller', 'admin'));
END $$;

-- Function to set user as admin (can be called manually)
CREATE OR REPLACE FUNCTION set_user_as_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_val uuid;
BEGIN
  -- Find user by email
  SELECT id INTO user_id_val
  FROM profiles
  WHERE email = user_email;
  
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update role to admin
  UPDATE profiles
  SET role = 'admin'
  WHERE id = user_id_val;
  
  -- Also add to admin_users table if not exists
  INSERT INTO admin_users (user_id, permissions)
  VALUES (user_id_val, ARRAY['manage_categories', 'view_analytics', 'manage_users', 'manage_targets', 'view_chats'])
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Update RLS policies to support admin role
-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all targets
DROP POLICY IF EXISTS "Admins can view all targets" ON targets;
CREATE POLICY "Admins can view all targets"
  ON targets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update all targets
DROP POLICY IF EXISTS "Admins can update all targets" ON targets;
CREATE POLICY "Admins can update all targets"
  ON targets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all conversations
DROP POLICY IF EXISTS "Admins can view all conversations" ON conversations;
CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all messages (read-only for monitoring)
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comment: To set yourself as admin, run:
-- SELECT set_user_as_admin('your-email@example.com');
