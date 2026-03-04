-- Create tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    image_url TEXT,
    is_category BOOLEAN DEFAULT FALSE,
    is_popular BOOLEAN DEFAULT FALSE,
    last_scraped_at TIMESTAMP WITH TIME ZONE
);

-- Create galleries table
CREATE TABLE galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create images table
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create many-to-many relationship table for galleries and tags
CREATE TABLE gallery_tags (
    gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (gallery_id, tag_id)
);
