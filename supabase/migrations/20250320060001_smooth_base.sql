/*
  # Fix permissions for regular classes management

  1. Changes
    - Remove unnecessary users table check from regular classes policy
    - Simplify admin check using email pattern
    - Add policy for public viewing

  2. Security
    - Maintain RLS security
    - Keep admin-only management
    - Allow public viewing
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage regular classes" ON regular_classes;
DROP POLICY IF EXISTS "Regular classes are viewable by everyone" ON regular_classes;

-- Create new policies
CREATE POLICY "Regular classes are viewable by everyone"
  ON regular_classes FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Admins can manage regular classes"
  ON regular_classes
  FOR ALL
  TO authenticated
  USING (auth.jwt()->>'email' LIKE '%@admin.com')
  WITH CHECK (auth.jwt()->>'email' LIKE '%@admin.com');