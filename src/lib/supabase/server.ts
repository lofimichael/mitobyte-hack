import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

/**
 * Supabase admin client for server-side operations.
 * Uses the secret key which bypasses RLS policies.
 * CAUTION: Only use this on the server, never expose to client.
 * This should only be imported in server-side code (API routes, server context, etc.)
 */
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || '',
  env.SUPABASE_SECRET_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);