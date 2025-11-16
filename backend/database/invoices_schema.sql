-- =====================================================
-- Justice Connect - Invoices System Database Schema
-- =====================================================

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- 2. Create invoices table
CREATE TABLE invoices (
  invoice_id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relations
  lawyer_id INTEGER NOT NULL REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  case_id INTEGER REFERENCES cases(case_id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- Financial details
  subtotal NUMERIC(10, 2) NOT NULL,
  tax_percentage NUMERIC(5, 2) DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'JOD',
  
  -- Status and dates
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  terms_conditions TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create invoice_items table
CREATE TABLE invoice_items (
  item_id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  
  -- Item details
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  
  -- Order
  item_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create payments table
CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  
  -- Relations
  invoice_id INTEGER NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lawyer_id INTEGER NOT NULL REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
  
  -- Payment details
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'JOD',
  payment_method VARCHAR(50) NOT NULL,
  
  -- Transaction info
  transaction_id VARCHAR(255) UNIQUE,
  payment_gateway VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Additional details
  payment_proof_url TEXT,
  notes TEXT,
  
  -- Timestamps
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create notifications table
CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  
  -- Recipient
  user_id INTEGER NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'lawyer', 'admin')),
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  
  -- Relations
  related_id INTEGER,
  related_type VARCHAR(50),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Invoices indexes
CREATE INDEX idx_invoices_lawyer ON invoices(lawyer_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_case ON invoices(case_id);
CREATE INDEX idx_invoices_appointment ON invoices(appointment_id);

-- Invoice items indexes
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Payments indexes
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_lawyer ON payments(lawyer_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
  next_num INTEGER;
  year_part VARCHAR(4);
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';
  
  RETURN 'INV-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for invoices updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check and update overdue invoices
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id INTEGER,
  p_user_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_type VARCHAR,
  p_related_id INTEGER DEFAULT NULL,
  p_related_type VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  new_notification_id INTEGER;
BEGIN
  INSERT INTO notifications (user_id, user_type, title, message, type, related_id, related_type)
  VALUES (p_user_id, p_user_type, p_title, p_message, p_type, p_related_id, p_related_type)
  RETURNING notification_id INTO new_notification_id;
  
  RETURN new_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification when invoice is created
CREATE OR REPLACE FUNCTION notify_invoice_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify client
  PERFORM create_notification(
    NEW.client_id,
    'client',
    'فاتورة جديدة',
    'تم إنشاء فاتورة جديدة رقم ' || NEW.invoice_number,
    'invoice_created',
    NEW.invoice_id,
    'invoice'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_invoice_created
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_created();

-- Trigger to create notification when invoice is paid
CREATE OR REPLACE FUNCTION notify_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Notify lawyer
    PERFORM create_notification(
      NEW.lawyer_id,
      'lawyer',
      'تم دفع فاتورة',
      'تم دفع الفاتورة رقم ' || NEW.invoice_number,
      'invoice_paid',
      NEW.invoice_id,
      'invoice'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_invoice_paid
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_paid();

-- Trigger to create notification when payment is completed
CREATE OR REPLACE FUNCTION notify_payment_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get invoice details
    SELECT * INTO v_invoice FROM invoices WHERE invoice_id = NEW.invoice_id;
    
    -- Notify client
    PERFORM create_notification(
      NEW.client_id,
      'client',
      'تم تأكيد الدفع',
      'تم تأكيد دفع الفاتورة رقم ' || v_invoice.invoice_number,
      'payment_completed',
      NEW.payment_id,
      'payment'
    );
    
    -- Update invoice status to paid
    UPDATE invoices
    SET status = 'paid', paid_date = NEW.payment_date
    WHERE invoice_id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_payment_completed
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_completed();

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies for invoices
-- =====================================================

-- Lawyers can view their own invoices
CREATE POLICY "Lawyers can view their invoices"
  ON invoices FOR SELECT
  USING (lawyer_id = current_setting('app.current_user_id')::INTEGER);

-- Clients can view their own invoices
CREATE POLICY "Clients can view their invoices"
  ON invoices FOR SELECT
  USING (client_id = current_setting('app.current_user_id')::INTEGER);

-- Lawyers can create invoices
CREATE POLICY "Lawyers can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (lawyer_id = current_setting('app.current_user_id')::INTEGER);

-- Lawyers can update their own unpaid invoices
CREATE POLICY "Lawyers can update their unpaid invoices"
  ON invoices FOR UPDATE
  USING (lawyer_id = current_setting('app.current_user_id')::INTEGER AND status IN ('pending', 'overdue'));

-- Lawyers can delete their own unpaid invoices
CREATE POLICY "Lawyers can delete their unpaid invoices"
  ON invoices FOR DELETE
  USING (lawyer_id = current_setting('app.current_user_id')::INTEGER AND status IN ('pending', 'overdue'));

-- =====================================================
-- RLS Policies for invoice_items
-- =====================================================

-- Users can view invoice items if they can view the invoice
CREATE POLICY "Users can view invoice items"
  ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.invoice_id = invoice_items.invoice_id
        AND (invoices.lawyer_id = current_setting('app.current_user_id')::INTEGER
             OR invoices.client_id = current_setting('app.current_user_id')::INTEGER)
    )
  );

-- Lawyers can manage invoice items for their invoices
CREATE POLICY "Lawyers can manage invoice items"
  ON invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.invoice_id = invoice_items.invoice_id
        AND invoices.lawyer_id = current_setting('app.current_user_id')::INTEGER
    )
  );

-- =====================================================
-- RLS Policies for payments
-- =====================================================

-- Lawyers can view payments for their invoices
CREATE POLICY "Lawyers can view their payments"
  ON payments FOR SELECT
  USING (lawyer_id = current_setting('app.current_user_id')::INTEGER);

-- Clients can view their own payments
CREATE POLICY "Clients can view their payments"
  ON payments FOR SELECT
  USING (client_id = current_setting('app.current_user_id')::INTEGER);

-- Clients can create payments
CREATE POLICY "Clients can create payments"
  ON payments FOR INSERT
  WITH CHECK (client_id = current_setting('app.current_user_id')::INTEGER);

-- =====================================================
-- RLS Policies for notifications
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- System can create notifications for any user
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
