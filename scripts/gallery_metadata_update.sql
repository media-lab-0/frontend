-- Add metadata columns to galleries table for richer detail pages
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0;
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS model_names TEXT[] DEFAULT '{}';
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS channel_name TEXT;

-- Index for tags searching if not already there
CREATE INDEX IF NOT EXISTS idx_gallery_tags_gallery_id ON gallery_tags(gallery_id);
