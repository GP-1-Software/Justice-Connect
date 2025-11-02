-- ============================================
-- Fix timeline_events visibility constraint
-- ============================================

-- الخطوة 1: حذف الـ constraint القديم
ALTER TABLE timeline_events 
DROP CONSTRAINT IF EXISTS timeline_events_visibility_check;

-- الخطوة 2: إضافة constraint جديد بالقيم الصحيحة
ALTER TABLE timeline_events
ADD CONSTRAINT timeline_events_visibility_check
CHECK (visibility IN ('all', 'client_only', 'lawyer_only', 'private'));

-- ============================================
-- التحقق من القيم المسموحة:
-- - 'all': مرئي للجميع (العميل والمحامي)
-- - 'client_only': مرئي للعميل فقط
-- - 'lawyer_only': مرئي للمحامي فقط
-- - 'private': خاص (للنظام فقط)
-- ============================================
