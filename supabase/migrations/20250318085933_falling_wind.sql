/*
  # Initial Schema Setup for Classroom Reservation System

  1. New Tables
    - `buildings`
      - `id` (uuid, primary key)
      - `name` (text)
      - `floors` (integer)
      - `created_at` (timestamp)
    
    - `classrooms`
      - `id` (uuid, primary key)
      - `building_id` (uuid, foreign key)
      - `name` (text)
      - `floor` (integer)
      - `capacity` (integer)
      - `created_at` (timestamp)
    
    - `reservations`
      - `id` (uuid, primary key)
      - `classroom_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `purpose` (text)
      - `status` (enum)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create buildings table
CREATE TABLE buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  floors integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create classrooms table
CREATE TABLE classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid REFERENCES buildings(id),
  name text NOT NULL,
  floor integer NOT NULL,
  capacity integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create reservation status enum
CREATE TYPE reservation_status AS ENUM ('pending', 'approved', 'rejected');

-- Create reservations table
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid REFERENCES classrooms(id),
  user_id uuid REFERENCES auth.users(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  purpose text NOT NULL,
  status reservation_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable Row Level Security
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Buildings policies
CREATE POLICY "Buildings are viewable by all authenticated users"
  ON buildings FOR SELECT
  TO authenticated
  USING (true);

-- Classrooms policies
CREATE POLICY "Classrooms are viewable by all authenticated users"
  ON classrooms FOR SELECT
  TO authenticated
  USING (true);

-- Reservations policies
CREATE POLICY "Users can view all reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert sample data
INSERT INTO buildings (name, floors) VALUES
  ('Engineering Building', 5),
  ('Science Center', 4),
  ('Liberal Arts Building', 3),
  ('Student Center', 2);

INSERT INTO classrooms (building_id, name, floor, capacity)
SELECT
  b.id,
  'Room ' || floor || LPAD(room_number::text, 2, '0'),
  floor,
  CASE 
    WHEN random() < 0.3 THEN 30
    WHEN random() < 0.6 THEN 45
    ELSE 60
  END as capacity
FROM buildings b
CROSS JOIN generate_series(1, b.floors) as floor
CROSS JOIN generate_series(1, 5) as room_number;