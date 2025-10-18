import React, { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { initializeAuthAtom, setAuthStateAtom, setLoadingAtom } from '@/store/authStore';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [, initializeAuth] = useAtom(initializeAuthAtom);
  const [, setAuthState] = useAtom(setAuthStateAtom);
  const [, setLoading] = useAtom(setLoadingAtom);
  const initializingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      if (initializingRef.current) return;
      initializingRef.current = true;
      
      try {
        await initializeAuth();
      } finally {
        if (isMounted) {
          initializingRef.current = false;
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted || initializingRef.current) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
              const user: User = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
              };
              
              setAuthState({
                isAuthenticated: true,
                user,
                loading: false,
                error: null,
                loggingOut: false,
              });
            }
          } else if (event === 'SIGNED_OUT') {
            setAuthState({
              isAuthenticated: false,
              user: null,
              loading: false,
              error: null,
              loggingOut: false,
            });
          } else if (event === 'USER_UPDATED' && session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
            };
            
            setAuthState({
              isAuthenticated: true,
              user,
              loading: false,
              error: null,
              loggingOut: false,
            });
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initializeAuth, setAuthState, setLoading]);

  return <>{children}</>;
};