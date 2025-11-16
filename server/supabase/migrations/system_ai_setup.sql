-- ============================================================
--  SYSTEM AI FEATURE MIGRATION
--  Justice-Connect - SystemAI Conversations + Messages
-- ============================================================

-- 1) Create table: system_ai_conversations
CREATE TABLE IF NOT EXISTS system_ai_conversations (
                                                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id INTEGER NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_system_ai_admin
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
    ON DELETE CASCADE
    );

-- Index for faster admin conversations lookup
CREATE INDEX IF NOT EXISTS idx_system_ai_conversations_admin
    ON system_ai_conversations (admin_id);

-- Index for sorting by last message
CREATE INDEX IF NOT EXISTS idx_system_ai_conversations_last_message
    ON system_ai_conversations (last_message_at);


-- 2) Create table: system_ai_messages
CREATE TABLE IF NOT EXISTS system_ai_messages (
                                                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    message TEXT NOT NULL,
    sql_query TEXT,
    raw_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_system_ai_conversation
    FOREIGN KEY (conversation_id) REFERENCES system_ai_conversations(id)
    ON DELETE CASCADE
    );

-- Index for faster messages retrieval
CREATE INDEX IF NOT EXISTS idx_system_ai_messages_conversation
    ON system_ai_messages (conversation_id);

-- Index for timestamp sorting
CREATE INDEX IF NOT_EXISTS idx_system_ai_messages_created
    ON system_ai_messages (created_at);

-- ============================================================
-- END OF MIGRATION
-- ============================================================
