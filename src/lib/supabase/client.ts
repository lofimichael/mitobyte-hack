import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

/**
 * Supabase client for public/anonymous access.
 * Uses the publishable key which has RLS (Row Level Security) policies applied.
 * Safe to use on both client and server.
 */
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);