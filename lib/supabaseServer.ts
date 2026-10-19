import { createClient } from '@supabase/supabase-js';

// Server-only. Never import this from a 'use client' file; the key must not reach the browser.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://mpnywlderrwnpajinbpq.supabase.co';

export function serverSupabase() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null; // lets the UI fall back to static data when env is missing
  return createClient(SUPABASE_URL, key);
}
