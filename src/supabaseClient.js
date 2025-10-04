import { createClient } from '@supabase/supabase-js'

// Use your Supabase project URL & anon/public key
const supabaseUrl = 'https://nxhsvwgulpqxuerskohx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aHN2d2d1bHBxeHVlcnNrb2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODUzNzUsImV4cCI6MjA3NTA2MTM3NX0.j65DSA55TF__j9sxMqIHTBVHg96uqMPdSNvpe76Uaeg'  
export const supabase = createClient(supabaseUrl, supabaseKey)
