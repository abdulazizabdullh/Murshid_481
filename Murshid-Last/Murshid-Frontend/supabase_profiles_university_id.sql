-- Add university_id to profiles and reference universities

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN university_id uuid;
  END IF;
END $$;

-- Optional: add a foreign key to universities(id) if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'universities'
  ) THEN
    -- Avoid duplicate constraint creation
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'profiles' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'profiles_university_id_fkey'
    ) THEN
      ALTER TABLE profiles
        ADD CONSTRAINT profiles_university_id_fkey
        FOREIGN KEY (university_id) REFERENCES universities(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

