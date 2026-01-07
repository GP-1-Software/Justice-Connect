-- إضافة أعمدة التقييم للمحامين
-- total_ratings_sum: مجموع كل التقييمات
-- ratings_count: عدد التقييمات
-- المتوسط = total_ratings_sum / ratings_count

ALTER TABLE lawyers ADD COLUMN total_ratings_sum INTEGER DEFAULT 0;
ALTER TABLE lawyers ADD COLUMN ratings_count INTEGER DEFAULT 0;

-- تحديث القيم الافتراضية للمحامين الحاليين
UPDATE lawyers SET total_ratings_sum = 0, ratings_count = 0 
WHERE total_ratings_sum IS NULL OR ratings_count IS NULL;
