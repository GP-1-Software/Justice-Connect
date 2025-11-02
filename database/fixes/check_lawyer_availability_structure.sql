-- ============================================
-- Check lawyer_availability table structure
-- ============================================

-- عرض هيكل الجدول
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lawyer_availability'
ORDER BY ordinal_position;

-- ============================================
-- إذا كان اسم العمود مختلف، نفذ هذا:
-- ============================================

-- خيار 1: إعادة تسمية العمود (إذا كان الاسم خطأ)
-- ALTER TABLE lawyer_availability 
-- RENAME COLUMN [old_column_name] TO day_of_week;

-- خيار 2: إضافة العمود (إذا كان مفقود)
-- ALTER TABLE lawyer_availability
-- ADD COLUMN day_of_week VARCHAR(20);

-- ============================================
-- الهيكل المتوقع:
-- ============================================
-- availability_id (integer, primary key)
-- lawyer_id (integer, foreign key)
-- day_of_week (varchar) - مثل: 'sunday', 'monday', etc.
-- start_time (time)
-- end_time (time)
-- is_available (boolean)
-- created_at (timestamp)
-- updated_at (timestamp)
-- ============================================
