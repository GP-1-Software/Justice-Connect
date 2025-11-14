-- JusticeAI chat schema for Supabase
-- Run this in Supabase SQL editor

-- Enable extension for UUIDs if not already
create extension if not exists pgcrypto;

-- Conversations table
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  client_user_id text not null,
  title text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  metadata jsonb
);

-- Messages table
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  model text,
  tokens int,
  created_at timestamptz not null default now()
);

-- Row Level Security (adjust for your auth model)
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

-- Simple permissive policies (development): allow all operations to anon
-- NOTE: Replace with stricter policies in production
create policy if not exists "ai_conversations_all_anon" on public.ai_conversations
for all using (true) with check (true);

create policy if not exists "ai_messages_all_anon" on public.ai_messages
for all using (true) with check (true);

-- Optional stricter example (if you use Supabase Auth and store auth.uid()):
-- alter table public.ai_conversations disable row level security;
-- or
-- drop policy if exists "ai_conversations_all_anon" on public.ai_conversations;
-- create policy "read_own_conversations" on public.ai_conversations
--   for select using (client_user_id = auth.uid());
-- create policy "write_own_conversations" on public.ai_conversations
--   for insert with check (client_user_id = auth.uid());
-- create policy "update_own_conversations" on public.ai_conversations
--   for update using (client_user_id = auth.uid());
-- create policy "delete_own_conversations" on public.ai_conversations
--   for delete using (client_user_id = auth.uid());
-- And for messages, you can allow when conversation belongs to user:
-- create policy "messages_via_conversation" on public.ai_messages
--   for all using (exists (
--     select 1 from public.ai_conversations c
--     where c.id = conversation_id and c.client_user_id = auth.uid()
--   )) with check (exists (
--     select 1 from public.ai_conversations c
--     where c.id = conversation_id and c.client_user_id = auth.uid()
--   ));
