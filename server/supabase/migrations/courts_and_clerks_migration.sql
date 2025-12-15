-- ============================================
-- Courts System Migration
-- بنية نظام المحاكم الفلسطينية
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- 1. Courts Table - جدول المحاكم الفلسطينية
CREATE TABLE IF NOT EXISTS courts (
    court_id SERIAL PRIMARY KEY,
    court_name VARCHAR(255) NOT NULL UNIQUE,       -- اسم المحكمة الكامل
    court_name_short VARCHAR(100),                 -- الاسم المختصر
    court_type VARCHAR(50) NOT NULL CHECK (court_type IN (
        'صلح',           -- Magistrate Court
        'بداية',         -- Court of First Instance
        'تجارية',        -- Commercial Court
        'عمل',           -- Labor Court
        'إدارية',        -- Administrative Court
        'مستعجلة',       -- Urgent Matters Court
        'استئناف',       -- Court of Appeal
        'نقض'            -- Court of Cassation (Supreme)
    )),
    city VARCHAR(100) NOT NULL,                    -- المدينة/المحافظة
    governorate VARCHAR(100),                      -- المحافظة الأم (اختياري)
    address TEXT,                                  -- العنوان الكامل
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courts_type ON courts(court_type);
CREATE INDEX IF NOT EXISTS idx_courts_city ON courts(city);
CREATE INDEX IF NOT EXISTS idx_courts_active ON courts(is_active) WHERE is_active = true;

-- 2. Court Clerks Assignment Table - ربط الموظفين بالمحاكم
CREATE TABLE IF NOT EXISTS court_clerks (
    clerk_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    court_id INTEGER NOT NULL REFERENCES courts(court_id) ON DELETE RESTRICT,
    clerk_role VARCHAR(50) DEFAULT 'court_clerk', -- يتوافق مع users.user_type و user_roles.role
    employee_number VARCHAR(50),          -- رقم الموظف (اختياري)
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, court_id)  -- موظف واحد لا يمكن تعيينه لنفس المحكمة مرتين
);

CREATE INDEX IF NOT EXISTS idx_court_clerks_user ON court_clerks(user_id);
CREATE INDEX IF NOT EXISTS idx_court_clerks_court ON court_clerks(court_id);
CREATE INDEX IF NOT EXISTS idx_court_clerks_active ON court_clerks(is_active) WHERE is_active = true;

-- 3. Add court_id to existing tables
ALTER TABLE court_clerk_filings ADD COLUMN IF NOT EXISTS court_id INTEGER REFERENCES courts(court_id);
CREATE INDEX IF NOT EXISTS idx_filings_court_id ON court_clerk_filings(court_id);

ALTER TABLE court_hearings ADD COLUMN IF NOT EXISTS court_id INTEGER REFERENCES courts(court_id);
CREATE INDEX IF NOT EXISTS idx_hearings_court_id ON court_hearings(court_id);

ALTER TABLE court_decisions ADD COLUMN IF NOT EXISTS court_id INTEGER REFERENCES courts(court_id);
CREATE INDEX IF NOT EXISTS idx_decisions_court_id ON court_decisions(court_id);

-- 4. Insert Palestinian Courts Data

-- محاكم الصلح (10)
INSERT INTO courts (court_name, court_type, city) VALUES
('محكمة صلح رام الله', 'صلح', 'رام الله والبيرة'),
('محكمة صلح نابلس', 'صلح', 'نابلس'),
('محكمة صلح الخليل', 'صلح', 'الخليل'),
('محكمة صلح بيت لحم', 'صلح', 'بيت لحم'),
('محكمة صلح جنين', 'صلح', 'جنين'),
('محكمة صلح طولكرم', 'صلح', 'طولكرم'),
('محكمة صلح قلقيلية', 'صلح', 'قلقيلية'),
('محكمة صلح سلفيت', 'صلح', 'سلفيت'),
('محكمة صلح طوباس', 'صلح', 'طوباس والأغوار الشمالية'),
('محكمة صلح أريحا', 'صلح', 'أريحا والأغوار')
ON CONFLICT (court_name) DO NOTHING;

-- محاكم البداية (9)
INSERT INTO courts (court_name, court_type, city) VALUES
('محكمة بداية رام الله', 'بداية', 'رام الله والبيرة'),
('محكمة بداية نابلس', 'بداية', 'نابلس'),
('محكمة بداية الخليل', 'بداية', 'الخليل'),
('محكمة بداية بيت لحم', 'بداية', 'بيت لحم'),
('محكمة بداية جنين', 'بداية', 'جنين'),
('محكمة بداية طولكرم', 'بداية', 'طولكرم'),
('محكمة بداية قلقيلية', 'بداية', 'قلقيلية'),
('محكمة بداية أريحا', 'بداية', 'أريحا والأغوار'),
('محكمة بداية القدس', 'بداية', 'القدس (الشرقية)')
ON CONFLICT (court_name) DO NOTHING;

-- المحاكم المتخصصة (2)
INSERT INTO courts (court_name, court_type, city) VALUES
('المحكمة التجارية – رام الله', 'تجارية', 'رام الله والبيرة'),
('محكمة العمل – نابلس', 'عمل', 'نابلس')
ON CONFLICT (court_name) DO NOTHING;

-- محكمة العدل العليا و الأمور المستعجلة (2)
INSERT INTO courts (court_name, court_type, city) VALUES
('محكمة العدل العليا (إدارية) – رام الله', 'إدارية', 'رام الله والبيرة'),
('محكمة الأمور المستعجلة – رام الله', 'مستعجلة', 'رام الله والبيرة')
ON CONFLICT (court_name) DO NOTHING;

-- محاكم الاستئناف (4)
INSERT INTO courts (court_name, court_type, city) VALUES
('محكمة استئناف رام الله', 'استئناف', 'رام الله والبيرة'),
('محكمة استئناف الخليل', 'استئناف', 'الخليل'),
('محكمة استئناف نابلس', 'استئناف', 'نابلس'),
('محكمة استئناف القدس', 'استئناف', 'القدس (الشرقية)')
ON CONFLICT (court_name) DO NOTHING;

-- المحكمة العليا (1)
INSERT INTO courts (court_name, court_type, city) VALUES
('المحكمة العليا (محكمة النقض) – رام الله', 'نقض', 'رام الله والبيرة')
ON CONFLICT (court_name) DO NOTHING;

-- 5. Helper Function: Get court_id by city and court_type
CREATE OR REPLACE FUNCTION get_court_id(p_city TEXT, p_court_type TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_court_id INTEGER;
BEGIN
    SELECT court_id INTO v_court_id
    FROM courts
    WHERE city = p_city 
      AND court_type = p_court_type
      AND is_active = true
    LIMIT 1;
    
    RETURN v_court_id;
END;
$$ LANGUAGE plpgsql;

-- 6. View for Court Clerk Dashboard (filings for their court)
CREATE OR REPLACE VIEW court_clerk_filings_by_court AS
SELECT 
    f.*,
    c.court_name as court_display_name,
    c.court_type,
    c.city as court_city
FROM court_clerk_filings f
LEFT JOIN courts c ON f.court_id = c.court_id;

-- 7. Trigger for updated_at (No RLS - protection in backend)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_courts_updated_at ON courts;
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_court_clerks_updated_at ON court_clerks;
CREATE TRIGGER update_court_clerks_updated_at BEFORE UPDATE ON court_clerks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE courts IS 'جدول المحاكم الفلسطينية';
COMMENT ON TABLE court_clerks IS 'جدول ربط موظفي قلم المحكمة بالمحاكم';
COMMENT ON COLUMN court_clerks.clerk_role IS 'clerk=كاتب عادي, senior_clerk=كاتب أول, head_clerk=رئيس قلم المحكمة';

-- ============================================
-- Verification Queries (run after migration)
-- ============================================

-- عرض جميع المحاكم
-- SELECT * FROM courts ORDER BY court_type, city;

-- التأكد من عدد المحاكم
-- SELECT court_type, COUNT(*) FROM courts GROUP BY court_type;

-- ربط موظف بمحكمة (example)
-- INSERT INTO court_clerks (user_id, court_id) 
-- VALUES ((SELECT user_id FROM users WHERE user_type = 'court_clerk' LIMIT 1), 1);

-- عرض الموظفين ومحاكمهم
-- SELECT u.first_name, u.last_name, c.court_name
-- FROM court_clerks cc
-- JOIN users u ON cc.user_id = u.user_id
-- JOIN courts c ON cc.court_id = c.court_id;
