-- =====================================================
-- Admin Enhancements Migration
-- =====================================================

-- 1. Create admin_activity_logs table for tracking all admin actions
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id INTEGER NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
    admin_name VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- 'approve_user', 'reject_user', 'disable_case', 'enable_case', etc.
    target_type VARCHAR(50) NOT NULL, -- 'user', 'lawyer', 'case', 'appointment', 'payment', etc.
    target_id VARCHAR(100), -- ID of the affected entity
    target_name VARCHAR(255), -- Name/title of the affected entity
    description TEXT, -- Detailed description of the action
    metadata JSONB, -- Additional data (old values, new values, etc.)
    ip_address VARCHAR(45), -- IP address of the admin
    user_agent TEXT, -- Browser/device info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_activity_logs_action_type ON admin_activity_logs(action_type);
CREATE INDEX idx_activity_logs_target_type ON admin_activity_logs(target_type);
CREATE INDEX idx_activity_logs_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_target_id ON admin_activity_logs(target_id);

-- 2. Add case control fields to cases table
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS disabled_by INTEGER REFERENCES admins(admin_id),
ADD COLUMN IF NOT EXISTS disabled_reason TEXT,
ADD COLUMN IF NOT EXISTS disabled_admin_notes TEXT;

-- Create index for disabled cases
CREATE INDEX IF NOT EXISTS idx_cases_is_disabled ON cases(is_disabled);

-- 3. Create system_settings table for global configurations
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_category VARCHAR(50) NOT NULL, -- 'general', 'payment', 'email', 'security', etc.
    description TEXT,
    updated_by INTEGER REFERENCES admins(admin_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_category, description) VALUES
('platform_commission_rate', '{"rate": 10, "type": "percentage"}', 'payment', 'نسبة عمولة المنصة من كل عملية دفع'),
('min_appointment_price', '{"amount": 50, "currency": "JOD"}', 'payment', 'الحد الأدنى لسعر الاستشارة'),
('max_appointment_duration', '{"minutes": 180}', 'general', 'الحد الأقصى لمدة الاستشارة'),
('email_notifications_enabled', '{"enabled": true}', 'email', 'تفعيل إشعارات البريد الإلكتروني'),
('maintenance_mode', '{"enabled": false, "message": ""}', 'general', 'وضع الصيانة')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id INTEGER REFERENCES admins(admin_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'success', 'urgent'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    related_type VARCHAR(50), -- 'case', 'user', 'payment', etc.
    related_id VARCHAR(100),
    action_url TEXT, -- URL to navigate when clicking the notification
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_priority ON admin_notifications(priority);

-- 5. Create function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_admin_id INTEGER,
    p_admin_name VARCHAR,
    p_action_type VARCHAR,
    p_target_type VARCHAR,
    p_target_id VARCHAR,
    p_target_name VARCHAR,
    p_description TEXT,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO admin_activity_logs (
        admin_id,
        admin_name,
        action_type,
        target_type,
        target_id,
        target_name,
        description,
        metadata
    ) VALUES (
        p_admin_id,
        p_admin_name,
        p_action_type,
        p_target_type,
        p_target_id,
        p_target_name,
        p_description,
        p_metadata
    ) RETURNING log_id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM users WHERE account_status = 'approved'),
        'pending_users', (SELECT COUNT(*) FROM users WHERE account_status = 'pending'),
        'total_lawyers', (SELECT COUNT(*) FROM lawyers WHERE account_status = 'approved'),
        'pending_lawyers', (SELECT COUNT(*) FROM lawyers WHERE account_status = 'pending'),
        'total_cases', (SELECT COUNT(*) FROM cases WHERE is_disabled = FALSE),
        'active_cases', (SELECT COUNT(*) FROM cases WHERE status IN ('active', 'in_progress') AND is_disabled = FALSE),
        'disabled_cases', (SELECT COUNT(*) FROM cases WHERE is_disabled = TRUE),
        'pending_cases', (SELECT COUNT(*) FROM cases WHERE status = 'pending' AND is_disabled = FALSE),
        'total_appointments', (SELECT COUNT(*) FROM appointments),
        'pending_appointments', (SELECT COUNT(*) FROM appointments WHERE status = 'pending'),
        'completed_appointments', (SELECT COUNT(*) FROM appointments WHERE status = 'completed'),
        'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid'),
        'pending_payments', (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'pending'),
        'total_support_tickets', (SELECT COUNT(*) FROM support_tickets),
        'open_support_tickets', (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress')),
        'deletion_requests', (SELECT COUNT(*) FROM account_deletion_requests WHERE status = 'pending')
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- 7. Enable Row Level Security (RLS) for new tables
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_activity_logs
CREATE POLICY "Admins can view all activity logs"
    ON admin_activity_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.auth_id = auth.uid()
        )
    );

-- Create policies for system_settings
CREATE POLICY "Admins can view system settings"
    ON system_settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.auth_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can update system settings"
    ON system_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.auth_id = auth.uid() 
            AND admins.role = 'super_admin'
        )
    );

-- Create policies for admin_notifications
CREATE POLICY "Admins can view their own notifications"
    ON admin_notifications FOR SELECT
    TO authenticated
    USING (
        admin_id IN (
            SELECT admin_id FROM admins 
            WHERE admins.auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update their own notifications"
    ON admin_notifications FOR UPDATE
    TO authenticated
    USING (
        admin_id IN (
            SELECT admin_id FROM admins 
            WHERE admins.auth_id = auth.uid()
        )
    );

-- 8. Create trigger to notify admins when case is disabled
CREATE OR REPLACE FUNCTION notify_case_disabled()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_disabled = TRUE AND (OLD.is_disabled IS NULL OR OLD.is_disabled = FALSE) THEN
        -- Create notification for the lawyer assigned to the case
        IF NEW.assigned_lawyer_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                user_type,
                title,
                message,
                type,
                related_id,
                related_type
            ) VALUES (
                NEW.assigned_lawyer_id,
                'lawyer',
                'تم تعطيل قضية',
                'تم تعطيل القضية "' || NEW.title || '" من قبل الإدارة. السبب: ' || COALESCE(NEW.disabled_reason, 'غير محدد'),
                'warning',
                NEW.case_id,
                'case'
            );
        END IF;
        
        -- Create notification for the client
        IF NEW.client_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                user_type,
                title,
                message,
                type,
                related_id,
                related_type
            ) VALUES (
                NEW.client_id,
                'client',
                'تم تعطيل قضية',
                'تم تعطيل القضية "' || NEW.title || '" من قبل الإدارة. السبب: ' || COALESCE(NEW.disabled_reason, 'غير محدد'),
                'warning',
                NEW.case_id,
                'case'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_case_disabled
    AFTER UPDATE ON cases
    FOR EACH ROW
    WHEN (NEW.is_disabled IS DISTINCT FROM OLD.is_disabled)
    EXECUTE FUNCTION notify_case_disabled();

-- 9. Create view for recent admin activities
CREATE OR REPLACE VIEW recent_admin_activities AS
SELECT 
    aal.log_id,
    aal.admin_id,
    aal.admin_name,
    aal.action_type,
    aal.target_type,
    aal.target_id,
    aal.target_name,
    aal.description,
    aal.created_at,
    a.role as admin_role
FROM admin_activity_logs aal
LEFT JOIN admins a ON aal.admin_id = a.admin_id
ORDER BY aal.created_at DESC
LIMIT 100;

COMMENT ON TABLE admin_activity_logs IS 'سجل جميع نشاطات المسؤولين في النظام';
COMMENT ON TABLE system_settings IS 'إعدادات النظام العامة';
COMMENT ON TABLE admin_notifications IS 'إشعارات المسؤولين';
