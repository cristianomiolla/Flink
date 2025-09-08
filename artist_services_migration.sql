-- ============================================================================
-- ARTIST SERVICES TABLE RESTRUCTURING SCRIPT
-- ============================================================================

-- Step 1: Drop existing table and recreate with optimized structure
DROP TABLE IF EXISTS public.artist_services CASCADE;

-- Step 2: Create the new artist_services table with optimized structure
CREATE TABLE public.artist_services (
    -- Primary and foreign keys
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Service basic info
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    description TEXT,
    
    -- Service categorization
    body_area TEXT CHECK (body_area IN ('braccio', 'gamba', 'schiena', 'petto', 'mano', 'piede', 'collo', 'viso', 'altro')),
    size_category TEXT CHECK (size_category IN ('piccolo', 'medio', 'grande', 'extra-grande')),
    
    -- Pricing structure (either fixed price OR range, not both)
    pricing_type TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'range', 'consultation')),
    fixed_price DECIMAL(8,2) CHECK (fixed_price >= 0),
    price_min DECIMAL(8,2) CHECK (price_min >= 0),
    price_max DECIMAL(8,2) CHECK (price_max >= price_min),
    
    -- Additional options
    discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    
    -- Media
    image_url TEXT,
    
    -- Status and metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints to ensure pricing consistency
    CONSTRAINT valid_fixed_pricing CHECK (
        (pricing_type = 'fixed' AND fixed_price IS NOT NULL AND price_min IS NULL AND price_max IS NULL) OR
        (pricing_type = 'range' AND price_min IS NOT NULL AND price_max IS NOT NULL AND fixed_price IS NULL) OR
        (pricing_type = 'consultation' AND fixed_price IS NULL AND price_min IS NULL AND price_max IS NULL)
    )
);

-- Step 3: Create optimized indexes for better query performance
CREATE INDEX idx_artist_services_user_id ON public.artist_services(user_id);
CREATE INDEX idx_artist_services_active ON public.artist_services(is_active) WHERE is_active = true;
CREATE INDEX idx_artist_services_body_area ON public.artist_services(body_area) WHERE body_area IS NOT NULL;
CREATE INDEX idx_artist_services_size_category ON public.artist_services(size_category) WHERE size_category IS NOT NULL;
CREATE INDEX idx_artist_services_pricing_type ON public.artist_services(pricing_type);
CREATE INDEX idx_artist_services_created_at ON public.artist_services(created_at DESC);
CREATE INDEX idx_artist_services_user_active ON public.artist_services(user_id, is_active) WHERE is_active = true;

-- Step 4: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_artist_services_updated_at 
    BEFORE UPDATE ON public.artist_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable Row Level Security
ALTER TABLE public.artist_services ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies

-- Public read access for active services only
CREATE POLICY "Public can view active services" ON public.artist_services
    FOR SELECT TO public
    USING (is_active = true);

-- Authenticated users can view all services (including inactive ones for admin purposes)
CREATE POLICY "Authenticated users can view all services" ON public.artist_services
    FOR SELECT TO authenticated
    USING (true);

-- Artists can create their own services
CREATE POLICY "Artists can create their own services" ON public.artist_services
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Artists can update their own services
CREATE POLICY "Artists can update their own services" ON public.artist_services
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Artists can delete their own services (soft delete via is_active = false)
CREATE POLICY "Artists can soft delete their own services" ON public.artist_services
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id AND is_active = true)
    WITH CHECK (auth.uid() = user_id AND is_active = false);

-- Step 7: Create useful views for common queries

-- View for active services with artist info
CREATE OR REPLACE VIEW public.active_artist_services AS
SELECT 
    s.*,
    p.full_name as artist_name,
    p.username,
    p.avatar_url as artist_avatar_url,
    p.location as artist_location,
    p.bio as artist_bio
FROM public.artist_services s
JOIN public.profiles p ON s.user_id = p.user_id
WHERE s.is_active = true
ORDER BY s.created_at DESC;

-- View for service statistics
CREATE OR REPLACE VIEW public.service_stats AS
SELECT 
    user_id,
    COUNT(*) as total_services,
    COUNT(*) FILTER (WHERE is_active = true) as active_services,
    AVG(fixed_price) FILTER (WHERE pricing_type = 'fixed' AND fixed_price IS NOT NULL) as avg_fixed_price,
    AVG((price_min + price_max) / 2) FILTER (WHERE pricing_type = 'range') as avg_range_price,
    COUNT(*) FILTER (WHERE discount_percentage > 0) as services_with_discount
FROM public.artist_services
GROUP BY user_id;

-- Step 8: Grant permissions
GRANT SELECT ON public.artist_services TO anon, authenticated;
GRANT INSERT, UPDATE ON public.artist_services TO authenticated;
GRANT SELECT ON public.active_artist_services TO anon, authenticated;
GRANT SELECT ON public.service_stats TO authenticated;

-- Step 9: Insert sample data for testing (optional)
-- INSERT INTO public.artist_services (user_id, name, description, body_area, size_category, pricing_type, fixed_price, discount_percentage, image_url)
-- VALUES 
-- (
--     (SELECT user_id FROM public.profiles WHERE profile_type = 'artist' LIMIT 1),
--     'Tatuaggio Tradizionale',
--     'Tatuaggio in stile tradizionale americano con colori vivaci',
--     'braccio',
--     'medio',
--     'fixed',
--     150.00,
--     10,
--     'https://example.com/traditional-tattoo.jpg'
-- );

-- ============================================================================
-- MIGRATION NOTES:
-- ============================================================================
-- 1. This script completely recreates the artist_services table
-- 2. All existing data will be lost - backup before running
-- 3. The new structure includes better constraints and data validation
-- 4. RLS policies ensure proper data security
-- 5. Indexes are optimized for common query patterns
-- 6. Views provide convenient access to enriched data
-- 7. The pricing system is more flexible with three types: fixed, range, consultation
-- ============================================================================