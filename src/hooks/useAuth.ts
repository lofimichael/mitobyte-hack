import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { 
  authStateAtom, 
  signInAtom, 
  signUpAtom, 
  signOutAtom, 
  signInWithGoogleAtom,
  clearErrorAtom,
  type User,
  type AuthState,
  type AuthResponse
} from '@/store/authStore';
import { supabase } from '@/lib/supabase/client';

export interface UseAuthReturn extends AuthState {
  signIn: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  signUp: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  clearError: () => void;
  getSession: () => Promise<{ accessToken: string | null; user: User | null }>;
}

export function useAuth(): UseAuthReturn {
  const [authState] = useAtom(authStateAtom);
  const [, signIn] = useAtom(signInAtom);
  const [, signUp] = useAtom(signUpAtom);
  const [, signOut] = useAtom(signOutAtom);
  const [, signInWithGoogle] = useAtom(signInWithGoogleAtom);
  const [, clearError] = useAtom(clearErrorAtom);

  const getSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token && authState.user) {
      return {
        accessToken: session.access_token,
        user: authState.user
      };
    }
    
    return { accessToken: null, user: null };
  }, [authState.user]);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    clearError,
    getSession
  };
}