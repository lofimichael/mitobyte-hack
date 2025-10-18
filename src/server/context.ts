import { supabaseAdmin } from '@/lib/supabase/server';
import type { User } from '@/store/authStore';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

export async function createContext(opts: CreateNextContextOptions) {
  const { req } = opts;
  let user: User | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && supabaseUser) {
        console.log('supabaseUser ID', supabaseUser.id);
        user = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
        };
      }
    } catch (error) {
      console.error('Error verifying token:', error);
    }
  }

  return {
    user,
    date: new Date(),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;