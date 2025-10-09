-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    lawyer_id INTEGER REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('consultation', 'case_review', 'document_review')),
    meeting_method VARCHAR(20) NOT NULL CHECK (meeting_method IN ('in_person', 'video_call', 'phone_call')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lawyer_id ON appointments(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Insert some sample appointments data (only if users and lawyers exist)
INSERT INTO appointments (client_id, lawyer_id, appointment_date, appointment_time, duration_minutes, appointment_type, meeting_method, status, price, notes) 
SELECT 
    u.user_id,
    l.lawyer_id,
    '2024-01-15'::date,
    '10:00:00'::time,
    60,
    'case_review',
    'video_call',
    'confirmed',
    150.00,
    'مراجعة عقد تجاري'
FROM users u, lawyers l 
WHERE u.user_type = 'client' 
LIMIT 1;

INSERT INTO appointments (client_id, lawyer_id, appointment_date, appointment_time, duration_minutes, appointment_type, meeting_method, status, price, notes) 
SELECT 
    u.user_id,
    l.lawyer_id,
    '2024-01-20'::date,
    '14:30:00'::time,
    30,
    'consultation',
    'in_person',
    'scheduled',
    75.00,
    'استشارة حول الطلاق'
FROM users u, lawyers l 
WHERE u.user_type = 'client' 
LIMIT 1;

INSERT INTO appointments (client_id, lawyer_id, appointment_date, appointment_time, duration_minutes, appointment_type, meeting_method, status, price, notes) 
SELECT 
    u.user_id,
    l.lawyer_id,
    '2024-01-10'::date,
    '09:00:00'::time,
    45,
    'document_review',
    'phone_call',
    'completed',
    112.50,
    'مراجعة مستندات قضية'
FROM users u, lawyers l 
WHERE u.user_type = 'client' 
LIMIT 1;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
