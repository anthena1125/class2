/*
  # Add Regular Class Schedules

  1. New Tables
    - `regular_classes`
      - `id` (uuid, primary key)
      - `classroom_id` (uuid, foreign key)
      - `name` (text) - class name
      - `day_of_week` (integer) - 0 (Sunday) to 6 (Saturday)
      - `start_time` (time)
      - `end_time` (time)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on new table
    - Add policies for viewing and admin management
*/

CREATE TABLE regular_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid REFERENCES classrooms(id),
  name text NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

ALTER TABLE regular_classes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view class schedules
CREATE POLICY "Regular classes are viewable by everyone"
  ON regular_classes FOR SELECT
  TO PUBLIC
  USING (true);

-- Only allow admins to manage class schedules
CREATE POLICY "Admins can manage regular classes"
  ON regular_classes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@admin.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@admin.com'
    )
  );

-- Allow public access to view buildings and classrooms
CREATE POLICY "Buildings are viewable by everyone"
  ON buildings FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Classrooms are viewable by everyone"
  ON classrooms FOR SELECT
  TO PUBLIC
  USING (true);

-- Allow public access to view reservations (but not create/modify)
CREATE POLICY "Reservations are viewable by everyone"
  ON reservations FOR SELECT
  TO PUBLIC
  USING (true);