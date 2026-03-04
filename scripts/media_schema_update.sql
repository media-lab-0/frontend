-- Refined Schema for Enhanced Category & Image Support

-- 1. Power up the tags table to support 'Primary Categories'
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_category BOOLEAN DEFAULT FALSE;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 2. Ensure galleries has the tracking column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='galleries' AND column_name='last_scraped_at') THEN
        ALTER TABLE galleries ADD COLUMN last_scraped_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Seed some initial "Popular Categories" (Change these slugs to match PornPics tags you like)
-- Examples: 'asian', 'big-tits', 'ebony', 'interracial', 'mature', 'milf', 'pov', 'teen'
UPDATE tags SET is_category = TRUE, is_popular = TRUE WHERE slug IN ('asian', 'big-tits', 'ebony', 'interracial', 'mature', 'milf', 'pov', 'teen');
