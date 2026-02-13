-- ============================================
-- SUPABASE STORAGE SETUP
-- ============================================
-- Run this in Supabase SQL Editor to set up storage bucket

-- Create a storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'evidence');

-- Allow anyone to view evidence files (public)
CREATE POLICY "Evidence files are publicly viewable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'evidence');
