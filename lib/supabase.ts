import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Server-side admin client — uses service role key to bypass RLS.
 * Use this in API route handlers where our own auth middleware
 * already verifies the user and enforces access control.
 */
export function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Client-side anon client — uses anon key, subject to RLS.
 * Use this in client components if direct Supabase access is needed.
 */
export function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
