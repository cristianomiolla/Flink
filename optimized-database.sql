-- OPTIMIZED DATABASE SCHEMA FOR SUPABASE PERFORMANCE
-- Execute this script in Supabase SQL Editor

-- ============================================
-- STEP 1: DROP EXISTING TABLES AND RECREATE
-- ============================================

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Drop tables in dependency order
DROP TABLE IF EXISTS portfolio_items CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- ============================================
-- STEP 2: CREATE OPTIMIZED PROFILES TABLE
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT,
    username TEXT,
    profile_type TEXT NOT NULL DEFAULT 'client' CHECK (profile_type IN ('client', 'artist')),
    bio TEXT,
    avatar_url TEXT,
    phone TEXT,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- STEP 3: CREATE OPTIMIZED PORTFOLIO_ITEMS TABLE
-- ============================================

CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',  -- Array of tags with default empty array
    is_flash BOOLEAN DEFAULT false,
    price DECIMAL(10,2),
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- STEP 4: CREATE PERFORMANCE-OPTIMIZED INDEXES
-- ============================================

-- CRITICAL: Basic index for the JOIN query (user_id for portfolio items)
CREATE INDEX idx_portfolio_user_id ON portfolio_items(user_id);

-- Portfolio items indexes for filtering and sorting
CREATE INDEX idx_portfolio_created_at_desc ON portfolio_items(created_at DESC);
CREATE INDEX idx_portfolio_is_flash ON portfolio_items(is_flash);
CREATE INDEX idx_portfolio_title_text ON portfolio_items USING gin(to_tsvector('english', title));
CREATE INDEX idx_portfolio_description_text ON portfolio_items USING gin(to_tsvector('english', description));
CREATE INDEX idx_portfolio_tags_gin ON portfolio_items USING gin(tags);
CREATE INDEX idx_portfolio_location_text ON portfolio_items(location) WHERE location IS NOT NULL;

-- Profiles indexes for efficient artist lookups
CREATE INDEX idx_profiles_artist_type ON profiles(profile_type) WHERE profile_type = 'artist';
CREATE INDEX idx_profiles_user_id_artist ON profiles(user_id) WHERE profile_type = 'artist';
CREATE INDEX idx_profiles_full_name_text ON profiles USING gin(to_tsvector('english', full_name)) WHERE profile_type = 'artist';
CREATE INDEX idx_profiles_bio_text ON profiles USING gin(to_tsvector('english', bio)) WHERE profile_type = 'artist';
CREATE INDEX idx_profiles_location_artist ON profiles(location) WHERE profile_type = 'artist' AND location IS NOT NULL;
CREATE INDEX idx_profiles_created_at_artist ON profiles(created_at DESC) WHERE profile_type = 'artist';

-- ============================================
-- STEP 5: OPTIMIZED RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Optimized policies with specific conditions
CREATE POLICY "public_read_artist_profiles" 
ON profiles FOR SELECT 
TO public
USING (profile_type = 'artist');

CREATE POLICY "public_read_portfolio_items" 
ON portfolio_items FOR SELECT 
TO public
USING (true);

-- Future auth policies (more specific)
CREATE POLICY "authenticated_insert_profiles" 
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_insert_portfolio" 
ON portfolio_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "users_update_own_profile" 
ON profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "artists_update_own_portfolio" 
ON portfolio_items FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- STEP 6: AUTO-UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at 
    BEFORE UPDATE ON portfolio_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: PERFORMANCE FUNCTIONS
-- ============================================

-- Function for fast portfolio search with full-text search
CREATE OR REPLACE FUNCTION search_portfolio_items(
    search_text TEXT DEFAULT '',
    location_filter TEXT DEFAULT '',
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    description TEXT,
    image_url TEXT,
    tags TEXT[],
    is_flash BOOLEAN,
    price DECIMAL(10,2),
    location TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    artist_name TEXT,
    artist_location TEXT,
    artist_bio TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.id,
        pi.user_id,
        pi.title,
        pi.description,
        pi.image_url,
        pi.tags,
        pi.is_flash,
        pi.price,
        pi.location,
        pi.created_at,
        pi.updated_at,
        p.full_name as artist_name,
        p.location as artist_location,
        p.bio as artist_bio
    FROM portfolio_items pi
    INNER JOIN profiles p ON pi.user_id = p.user_id
    WHERE 
        p.profile_type = 'artist'
        AND (
            search_text = '' OR
            pi.title ILIKE '%' || search_text || '%' OR
            pi.description ILIKE '%' || search_text || '%' OR
            p.full_name ILIKE '%' || search_text || '%' OR
            EXISTS (SELECT 1 FROM unnest(pi.tags) tag WHERE tag ILIKE '%' || search_text || '%')
        )
        AND (
            location_filter = '' OR
            p.location ILIKE '%' || location_filter || '%' OR
            pi.location ILIKE '%' || location_filter || '%'
        )
    ORDER BY pi.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 8: INSERT SAMPLE DATA
-- ============================================

-- Create artist profiles
INSERT INTO profiles (email, full_name, username, profile_type, bio, location) VALUES 
    ('marco.rossi@example.com', 'Marco Rossi', 'marco_tattoo', 'artist', 'Specializzato in tatuaggi tradizionali e realistici con oltre 10 anni di esperienza', 'Milano'),
    ('giulia.bianchi@example.com', 'Giulia Bianchi', 'giulia_ink', 'artist', 'Artista del tatuaggio con focus su blackwork e geometrico. Stile minimalista e moderno.', 'Roma'),
    ('alessandro.verdi@example.com', 'Alessandro Verdi', 'alex_art', 'artist', 'Tatuatore specializzato in old school e neo traditional. Colori vivaci e design classici.', 'Napoli'),
    ('sara.neri@example.com', 'Sara Neri', 'sara_tattoos', 'artist', 'Specialista in tatuaggi floreali e acquerello. Stile delicato e femminile.', 'Firenze'),
    ('luca.blu@example.com', 'Luca Blu', 'luca_ink', 'artist', 'Maestro del realismo e ritratti. Tatuaggi foto-realistici di alta qualità.', 'Torino');

-- Create portfolio items with better variety
WITH artist_data AS (
    SELECT user_id, full_name, location FROM profiles WHERE profile_type = 'artist'
),
portfolio_data AS (
    SELECT 
        ad.user_id,
        ad.full_name,
        ad.location,
        ROW_NUMBER() OVER (PARTITION BY ad.user_id) as item_num
    FROM artist_data ad
    CROSS JOIN generate_series(1, 3) -- 3 items per artist
)
INSERT INTO portfolio_items (user_id, title, description, image_url, tags, is_flash, price, location)
SELECT 
    pd.user_id,
    CASE 
        WHEN pd.full_name = 'Marco Rossi' AND pd.item_num = 1 THEN 'Drago Tradizionale Giapponese'
        WHEN pd.full_name = 'Marco Rossi' AND pd.item_num = 2 THEN 'Carpa Koi'
        WHEN pd.full_name = 'Marco Rossi' AND pd.item_num = 3 THEN 'Samurai Warrior'
        WHEN pd.full_name = 'Giulia Bianchi' AND pd.item_num = 1 THEN 'Mandala Geometrico'
        WHEN pd.full_name = 'Giulia Bianchi' AND pd.item_num = 2 THEN 'Blackwork Abstract'
        WHEN pd.full_name = 'Giulia Bianchi' AND pd.item_num = 3 THEN 'Minimal Line Art'
        WHEN pd.full_name = 'Alessandro Verdi' AND pd.item_num = 1 THEN 'Rosa Old School'
        WHEN pd.full_name = 'Alessandro Verdi' AND pd.item_num = 2 THEN 'Pin-up Girl'
        WHEN pd.full_name = 'Alessandro Verdi' AND pd.item_num = 3 THEN 'Eagle Traditional'
        WHEN pd.full_name = 'Sara Neri' AND pd.item_num = 1 THEN 'Peony Watercolor'
        WHEN pd.full_name = 'Sara Neri' AND pd.item_num = 2 THEN 'Cherry Blossom'
        WHEN pd.full_name = 'Sara Neri' AND pd.item_num = 3 THEN 'Botanical Sleeve'
        WHEN pd.full_name = 'Luca Blu' AND pd.item_num = 1 THEN 'Portrait Realism'
        WHEN pd.full_name = 'Luca Blu' AND pd.item_num = 2 THEN 'Black & Grey Lion'
        WHEN pd.full_name = 'Luca Blu' AND pd.item_num = 3 THEN 'Realistic Eye'
    END as title,
    'Bellissimo tatuaggio realizzato con cura e attenzione ai dettagli.' as description,
    'https://images.unsplash.com/photo-1565058379802-bbe93b2097e2?w=400&h=400&fit=crop' as image_url,
    CASE 
        WHEN pd.full_name = 'Marco Rossi' THEN ARRAY['tradizionale', 'giapponese', 'drago', 'orientale']
        WHEN pd.full_name = 'Giulia Bianchi' THEN ARRAY['geometrico', 'mandala', 'blackwork', 'minimalista']
        WHEN pd.full_name = 'Alessandro Verdi' THEN ARRAY['old school', 'tradizionale', 'colorato', 'classico']
        WHEN pd.full_name = 'Sara Neri' THEN ARRAY['floreale', 'acquerello', 'delicato', 'femminile']
        WHEN pd.full_name = 'Luca Blu' THEN ARRAY['realistico', 'ritratto', 'bianco e nero', 'dettagliato']
    END as tags,
    false as is_flash,
    (150 + (RANDOM() * 200))::DECIMAL(10,2) as price,
    pd.location
FROM portfolio_data pd;

-- Add flash designs
INSERT INTO portfolio_items (user_id, title, description, tags, is_flash, price, location)
SELECT 
    user_id,
    'Flash - ' || 
    CASE 
        WHEN ROW_NUMBER() OVER () % 5 = 1 THEN 'Stella Nautica'
        WHEN ROW_NUMBER() OVER () % 5 = 2 THEN 'Cuore Sacro'
        WHEN ROW_NUMBER() OVER () % 5 = 3 THEN 'Ancora Marina'
        WHEN ROW_NUMBER() OVER () % 5 = 4 THEN 'Rondine'
        ELSE 'Dagger'
    END as title,
    'Design flash pronto per essere tatuato in giornata' as description,
    ARRAY['flash', 'piccolo', 'veloce', 'tradizionale'] as tags,
    true as is_flash,
    (50 + (RANDOM() * 80))::DECIMAL(10,2) as price,
    location
FROM profiles 
WHERE profile_type = 'artist';

-- ============================================
-- STEP 9: ANALYZE TABLES FOR OPTIMAL PERFORMANCE
-- ============================================

ANALYZE profiles;
ANALYZE portfolio_items;

-- ============================================
-- STEP 10: VERIFICATION QUERIES
-- ============================================

-- Test the main JOIN query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    pi.*,
    p.full_name,
    p.username,
    p.bio,
    p.location as artist_location
FROM portfolio_items pi
INNER JOIN profiles p ON pi.user_id = p.user_id
WHERE p.profile_type = 'artist'
ORDER BY pi.created_at DESC
LIMIT 50;

-- Test the search function
SELECT * FROM search_portfolio_items('', '', 10);

-- Test full-text search
SELECT * FROM search_portfolio_items('tradizionale', 'Milano', 5);

-- Verify data counts
SELECT 
    'Total Artists' as metric,
    COUNT(*) as count
FROM profiles WHERE profile_type = 'artist'
UNION ALL
SELECT 
    'Total Portfolio Items' as metric,
    COUNT(*) as count
FROM portfolio_items
UNION ALL
SELECT 
    'Flash Items' as metric,
    COUNT(*) as count
FROM portfolio_items WHERE is_flash = true;

SELECT 'Optimized database setup complete! 🚀' as status;