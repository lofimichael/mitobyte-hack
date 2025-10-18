import { atom, createStore } from 'jotai';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

// Create a store instance for accessing atoms outside React components
export const authStore = createStore();

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: User | null;
  needsConfirmation: boolean;
  success: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  loggingOut: boolean;
}

export const authStateAtom = atom<AuthState>({
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  loggingOut: false,
});

export const initializeAuthAtom = atom(
  null,
  async (get, set) => {
    try {
      set(setLoadingAtom, true);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth initialization error:', error);
        set(authStateAtom, {
          isAuthenticated: false,
          user: null,
          loading: false,
          error: error.message,
          loggingOut: false,
        });
        return;
      }
      
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
        };
        
        set(authStateAtom, {
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
          loggingOut: false,
        });
      } else {
        set(authStateAtom, {
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
          loggingOut: false,
        });
      }
    } catch (error: any) {
      console.error('Auth initialization failed:', error);
      set(authStateAtom, {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error?.message || 'Authentication initialization failed',
        loggingOut: false,
      });
    }
  }
);

export const signUpAtom = atom(
  null,
  async (get, set, credentials: { email: string; password: string }): Promise<AuthResponse> => {
    try {
      set(setLoadingAtom, true);
      
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        set(setLoadingAtom, false);
        throw error;
      }
      
      let user: User | null = null;
      if (data.user) {
        user = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
        };
      }
      
      if (data.user && data.session) {
        set(authStateAtom, {
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
          loggingOut: false,
        });
      } else {
        set(setLoadingAtom, false);
      }
      
      return {
        user,
        needsConfirmation: !!(data.user && !data.session),
        success: !!data.user,
      };
    } catch (error) {
      set(setLoadingAtom, false);
      throw error;
    }
  }
);

export const signInAtom = atom(
  null,
  async (get, set, credentials: { email: string; password: string }): Promise<AuthResponse> => {
    try {
      set(setLoadingAtom, true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        set(setLoadingAtom, false);
        throw error;
      }
      
      let user: User | null = null;
      if (data.user) {
        user = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
        };
      }
      
      if (data.user && data.session) {
        set(authStateAtom, {
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
          loggingOut: false,
        });
      } else {
        set(setLoadingAtom, false);
      }
      
      return {
        user,
        needsConfirmation: !!(data.user && !data.session),
        success: !!(data.user && data.session),
      };
    } catch (error) {
      set(setLoadingAtom, false);
      throw error;
    }
  }
);

export const signInWithGoogleAtom = atom(
  null,
  async (get, set) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    if (error) throw error;
    return data;
  }
);

export const signOutAtom = atom(
  null,
  async (get, set) => {
    try {
      // Set loggingOut flag to prevent showing login form
      const currentState = get(authStateAtom);
      set(authStateAtom, {
        ...currentState,
        loggingOut: true,
      });

      // Sign out from Supabase with explicit global scope
      // This ensures all sessions are cleared and SIGNED_OUT event is fired
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error('Sign out error:', error);
      }

      // Verify session is actually cleared
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.warn('[Auth] Session still exists after signOut! This should not happen.');
        console.warn('[Auth] Session ID:', session.user?.id);
        // Force clear by trying again
        await supabase.auth.signOut({ scope: 'global' });
      } else if (process.env.NODE_ENV === 'development') {
        console.log('Session after signOut:', session);
        console.log('[Auth] Session successfully cleared');
      }

      // Update to logged out state
      set(authStateAtom, {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        loggingOut: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, complete the logout
      set(authStateAtom, {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        loggingOut: false,
      });
    }
  }
);

export const setLoadingAtom = atom(
  null,
  (get, set, loading: boolean) => {
    const currentState = get(authStateAtom);
    set(authStateAtom, {
      ...currentState,
      loading,
      error: loading ? null : currentState.error, // Clear error when starting loading
    });
  }
);

export const setAuthStateAtom = atom(
  null,
  (get, set, newState: AuthState) => {
    set(authStateAtom, newState);
  }
);

export const clearErrorAtom = atom(
  null,
  (get, set) => {
    const currentState = get(authStateAtom);
    set(authStateAtom, {
      ...currentState,
      error: null,
    });
  }
);

export const loginAtom = signInAtom;
export const logoutAtom = signOutAtom;