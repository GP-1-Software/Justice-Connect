-- ============================================
-- Ban System Migration
-- إضافة دعم الحظر لجداول users و lawyers
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- 1. Drop existing CHECK constraint on users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;

-- 2. Add new CHECK constraint that includes 'banned'
ALTER TABLE users ADD CONSTRAINT users_account_status_check 
CHECK (account_status IN ('pending', 'approved', 'rejected', 'banned'));

-- 3. Add ban columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- 4. Drop existing CHECK constraint on lawyers table
ALTER TABLE lawyers DROP CONSTRAINT IF EXISTS lawyers_account_status_check;

-- 5. Add new CHECK constraint for lawyers
ALTER TABLE lawyers ADD CONSTRAINT lawyers_account_status_check 
CHECK (account_status IN ('pending', 'approved', 'rejected', 'banned'));

-- 6. Add ban columns to lawyers table
ALTER TABLE lawyers 
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- 7. Create index for faster banned user queries
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(account_status) WHERE account_status = 'banned';
CREATE INDEX IF NOT EXISTS idx_lawyers_banned ON lawyers(account_status) WHERE account_status = 'banned';

-- 8. Add account_status column to admins table (doesn't exist yet)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'approved';

-- 9. Add CHECK constraint for admins account_status
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_account_status_check;
ALTER TABLE admins ADD CONSTRAINT admins_account_status_check 
CHECK (account_status IN ('pending', 'approved', 'rejected', 'banned'));

-- 10. Add ban columns to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- 11. Create index for banned admins
CREATE INDEX IF NOT EXISTS idx_admins_banned ON admins(account_status) WHERE account_status = 'banned';

-- ============================================
-- ✅ Done! Now all tables support ban status:
--    - users
--    - lawyers  
--    - admins
-- ============================================
