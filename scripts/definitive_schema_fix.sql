-- DEFINITIVE SCHEMA FIX: Run this to ensure all metadata columns are present
-- This script is idempotent and safe to run multiple times

-- 1. Fix 'galleries' table
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0;
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS model_names TEXT[] DEFAULT '{}';
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS channel_name TEXT;
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 2. Fix 'tags' table
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_category BOOLEAN DEFAULT FALSE;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'tag';
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP WITH TIME ZONE;

-- 3. Fix 'images' table (Ensure thumbnail_url exists)
ALTER TABLE images ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
-- Add unique constraint for idempotent upserts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_gallery_url') THEN
        ALTER TABLE images ADD CONSTRAINT unique_gallery_url UNIQUE (gallery_id, url);
    END IF;
END $$;

-- 4. Create missing indices for performance
CREATE INDEX IF NOT EXISTS idx_galleries_slug ON galleries(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_images_gallery_id ON images(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_tags_gallery_id ON gallery_tags(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_tags_tag_id ON gallery_tags(tag_id);

-- 5. Enable RLS and add Public Read Policies
-- This ensures the frontend can see the data
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Public Read Galleries" ON galleries;
DROP POLICY IF EXISTS "Public Read Images" ON images;
DROP POLICY IF EXISTS "Public Read Tags" ON tags;
DROP POLICY IF EXISTS "Public Read Gallery Tags" ON gallery_tags;

-- Create Policies
CREATE POLICY "Public Read Galleries" ON galleries FOR SELECT USING (true);
CREATE POLICY "Public Read Images" ON images FOR SELECT USING (true);
CREATE POLICY "Public Read Tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public Read Gallery Tags" ON gallery_tags FOR SELECT USING (true);
