-- Specialist verification setup

-- 1) Create storage bucket for specialist proofs (public for simple review links)
INSERT INTO storage.buckets (id, name, public)
VALUES ('specialist-proofs', 'specialist-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 2) Storage policies: allow public read; allow authenticated users to write to their own folder
CREATE POLICY IF NOT EXISTS "Specialist proofs are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'specialist-proofs');

CREATE POLICY IF NOT EXISTS "Users can upload their own specialist proof"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'specialist-proofs' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own specialist proof"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'specialist-proofs' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own specialist proof"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'specialist-proofs' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3) Optional: add specialist_proof_url column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'specialist_proof_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN specialist_proof_url TEXT;
  END IF;
END $$;

