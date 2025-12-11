-- ============================================
-- Court Fees System - نظام رسوم المحكمة
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- Drop existing table if needed (CAUTION: removes data)
-- DROP TABLE IF EXISTS court_fees CASCADE;

-- 1. Court Fees Table (فواتير الرسوم)
CREATE TABLE IF NOT EXISTS court_fees (
    fee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER REFERENCES cases(case_id) ON DELETE CASCADE,
    filing_id UUID REFERENCES court_clerk_filings(filing_id) ON DELETE CASCADE,
    
    -- Fee Invoice Number
    fee_invoice_number TEXT UNIQUE NOT NULL, -- رقم الفاتورة FEE-2025-0001
    
    -- Fee Items (بنود الرسوم)
    registration_fee NUMERIC(10,2) DEFAULT 0, -- رسم تسجيل الدعوى
    stamp_fee NUMERIC(10,2) DEFAULT 0, -- رسوم الطوابع
    justice_fund_fee NUMERIC(10,2) DEFAULT 0, -- رسم صندوق العدالة
    notification_fee NUMERIC(10,2) DEFAULT 0, -- رسوم التبليغات
    other_fees NUMERIC(10,2) DEFAULT 0, -- رسوم أخرى
    other_fees_description TEXT, -- وصف الرسوم الأخرى
    
    -- Total
    total_amount NUMERIC(10,2) NOT NULL, -- إجمالي الرسوم
    
    -- Status
    fee_status VARCHAR(30) NOT NULL DEFAULT 'draft' 
        CHECK (fee_status IN ('draft', 'issued', 'paid', 'confirmed', 'cancelled')),
    -- draft: مسودة، issued: صادرة، paid: مدفوعة (بانتظار الاعتماد)، confirmed: معتمدة، cancelled: ملغاة
    
    -- Payment Info (يملأها العميل/المحامي)
    payment_method VARCHAR(50), -- طريقة الدفع: bank_transfer, cash, check
    payment_reference TEXT, -- رقم الحوالة/المرجع
    payment_receipt_number TEXT, -- رقم الوصل
    payment_date DATE, -- تاريخ الدفع
    payment_receipt_url TEXT, -- رابط صورة الإيصال
    paid_by INTEGER REFERENCES users(user_id), -- من قام بالدفع
    paid_at TIMESTAMPTZ, -- وقت رفع الإيصال
    
    -- Confirmation (يملأها قلم المحكمة)
    confirmed_by INTEGER REFERENCES users(user_id), -- من اعتمد الدفع
    confirmed_at TIMESTAMPTZ, -- وقت الاعتماد
    confirmation_notes TEXT, -- ملاحظات الاعتماد
    
    -- Tracking
    issued_by INTEGER REFERENCES users(user_id), -- من أصدر الفاتورة
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (use IF NOT EXISTS pattern)
CREATE INDEX IF NOT EXISTS idx_court_fees_case_id ON court_fees(case_id);
CREATE INDEX IF NOT EXISTS idx_court_fees_filing_id ON court_fees(filing_id);
CREATE INDEX IF NOT EXISTS idx_court_fees_status ON court_fees(fee_status);
CREATE INDEX IF NOT EXISTS idx_court_fees_invoice ON court_fees(fee_invoice_number);

-- RLS
ALTER TABLE court_fees ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy to avoid errors
DROP POLICY IF EXISTS "Allow all for service role - fees" ON court_fees;
CREATE POLICY "Allow all for service role - fees" ON court_fees FOR ALL USING (true);

-- Trigger for updated_at (check if function exists first)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_court_fees_updated_at ON court_fees;
CREATE TRIGGER update_court_fees_updated_at 
    BEFORE UPDATE ON court_fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE court_fees IS 'جدول فواتير رسوم المحكمة';
COMMENT ON COLUMN court_fees.fee_status IS 'draft=مسودة, issued=صادرة, paid=مدفوعة, confirmed=معتمدة, cancelled=ملغاة';

-- Add awaiting_fees to cases stages if needed
-- This alters the cases table to support the new stage
DO $$
BEGIN
    -- Check if case_stage column exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'case_stage'
    ) THEN
        -- The case_stage is probably TEXT type, so no constraint to alter
        RAISE NOTICE 'cases.case_stage column exists - awaiting_fees stage can be used';
    END IF;
END $$;
