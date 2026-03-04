-- ==========================================
-- MASTER DATABASE SCHEMA (AdultDataLink Optimized)
-- Run this in your Supabase SQL Editor to reset/setup
-- ==========================================

-- 1. Quota Tracking (Crucial for API limits)
CREATE TABLE IF NOT EXISTS api_quota (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    count INTEGER DEFAULT 0
);

-- 2. Tags & Categories
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_category BOOLEAN DEFAULT FALSE,
    is_popular BOOLEAN DEFAULT FALSE,
    cover_url TEXT,
    last_scraped_at TIMESTAMP WITH TIME ZONE
);

-- 3. Galleries (Albums)
CREATE TABLE IF NOT EXISTS galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scraped_at TIMESTAMP WITH TIME ZONE
);

-- 4. Individual Images
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Junction Table (Many-to-Many relationship between Galleries and Tags)
CREATE TABLE IF NOT EXISTS gallery_tags (
    gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (gallery_id, tag_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_galleries_slug ON galleries(slug);
CREATE INDEX IF NOT EXISTS idx_images_gallery_id ON images(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_tags_tag_id ON gallery_tags(tag_id);

-- All tags/categories will be hydrated dynamically via ingestionService.hydrateTags()
