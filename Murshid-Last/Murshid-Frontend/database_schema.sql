-- =============================================
-- Murshid Database Schema for Universities & Majors
-- =============================================

-- 1. Universities Table
CREATE TABLE IF NOT EXISTS universities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    location TEXT,
    location_ar TEXT,
    city TEXT,
    country TEXT DEFAULT 'Saudi Arabia',
    website_url TEXT,
    logo_url TEXT,
    image_url TEXT,
    establishment_year INTEGER,
    university_type TEXT CHECK (university_type IN ('Public', 'Private', 'International')),
    ranking_national INTEGER,
    ranking_international INTEGER,
    student_count INTEGER,
    contact_email TEXT,
    contact_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Majors Table
CREATE TABLE IF NOT EXISTS majors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    category TEXT NOT NULL CHECK (category IN ('Engineering', 'Medicine', 'Business', 'Arts', 'Science', 'IT', 'Law', 'Education', 'Other')),
    degree_type TEXT CHECK (degree_type IN ('Bachelor', 'Master', 'PhD', 'Diploma')),
    duration_years DECIMAL(2,1),
    career_prospects TEXT,
    career_prospects_ar TEXT,
    average_salary_range TEXT,
    required_skills TEXT[],
    related_fields TEXT[],
    icon_name TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. University-Majors Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS university_majors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    major_id UUID NOT NULL REFERENCES majors(id) ON DELETE CASCADE,
    tuition_fee_annual DECIMAL(10,2),
    currency TEXT DEFAULT 'SAR',
    admission_requirements TEXT,
    admission_requirements_ar TEXT,
    capacity INTEGER,
    is_available BOOLEAN DEFAULT true,
    program_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(university_id, major_id)
);

-- 4. Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('university', 'major')),
    item_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- =============================================
-- Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_city ON universities(city);
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(university_type);
CREATE INDEX IF NOT EXISTS idx_universities_active ON universities(is_active);

CREATE INDEX IF NOT EXISTS idx_majors_name ON majors(name);
CREATE INDEX IF NOT EXISTS idx_majors_category ON majors(category);
CREATE INDEX IF NOT EXISTS idx_majors_active ON majors(is_active);

CREATE INDEX IF NOT EXISTS idx_university_majors_university ON university_majors(university_id);
CREATE INDEX IF NOT EXISTS idx_university_majors_major ON university_majors(major_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_item ON bookmarks(item_type, item_id);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Universities Policies
CREATE POLICY "Universities are viewable by everyone" 
    ON universities FOR SELECT 
    USING (is_active = true OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

CREATE POLICY "Only admins can insert universities" 
    ON universities FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

CREATE POLICY "Only admins can update universities" 
    ON universities FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

CREATE POLICY "Only admins can delete universities" 
    ON universities FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Majors Policies
CREATE POLICY "Majors are viewable by everyone" 
    ON majors FOR SELECT 
    USING (is_active = true OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

CREATE POLICY "Only admins can insert majors" 
    ON majors FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

CREATE POLICY "Only admins can update majors" 
    ON majors FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

CREATE POLICY "Only admins can delete majors" 
    ON majors FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- University-Majors Policies
CREATE POLICY "University-majors are viewable by everyone" 
    ON university_majors FOR SELECT 
    USING (true);

CREATE POLICY "Only admins can manage university-majors" 
    ON university_majors FOR ALL 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Bookmarks Policies
CREATE POLICY "Users can view their own bookmarks" 
    ON bookmarks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
    ON bookmarks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
    ON bookmarks FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" 
    ON bookmarks FOR UPDATE 
    USING (auth.uid() = user_id);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_universities_updated_at ON universities;
CREATE TRIGGER update_universities_updated_at
    BEFORE UPDATE ON universities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_majors_updated_at ON majors;
CREATE TRIGGER update_majors_updated_at
    BEFORE UPDATE ON majors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_university_majors_updated_at ON university_majors;
CREATE TRIGGER update_university_majors_updated_at
    BEFORE UPDATE ON university_majors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Sample Data (Optional - for testing)
-- =============================================

-- Insert sample universities
INSERT INTO universities (name, name_ar, description, city, university_type, website_url) VALUES
    ('King Saud University', 'جامعة الملك سعود', 'Leading university in Saudi Arabia', 'Riyadh', 'Public', 'https://ksu.edu.sa'),
    ('King Abdulaziz University', 'جامعة الملك عبدالعزيز', 'Premier institution in Jeddah', 'Jeddah', 'Public', 'https://kau.edu.sa'),
    ('King Fahd University of Petroleum and Minerals', 'جامعة الملك فهد للبترول والمعادن', 'Top engineering university', 'Dhahran', 'Public', 'https://kfupm.edu.sa')
ON CONFLICT DO NOTHING;

-- Insert sample majors
INSERT INTO majors (name, name_ar, category, degree_type, duration_years) VALUES
    ('Computer Science', 'علوم الحاسب', 'IT', 'Bachelor', 4),
    ('Mechanical Engineering', 'الهندسة الميكانيكية', 'Engineering', 'Bachelor', 4),
    ('Medicine', 'الطب', 'Medicine', 'Bachelor', 6),
    ('Business Administration', 'إدارة الأعمال', 'Business', 'Bachelor', 4),
    ('Architecture', 'العمارة', 'Engineering', 'Bachelor', 5)
ON CONFLICT DO NOTHING;

