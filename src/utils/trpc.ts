import { createTRPCNext } from '@trpc/next';
import { httpBatchLink, TRPCClientError, type TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import type { AppRouter } from '../server/root';
import { supabase } from '../lib/supabase/client';
import { authStore, authStateAtom } from '../store/authStore';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// Error interceptor link - catches all errors before React Query
const errorLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next: (value) => observer.next(value),
        error: (err) => {
          // Debug logging (development only)
          if (process.env.NODE_ENV === 'development') {
            console.log('[tRPC Link] Error intercepted:', err);
            console.log('[tRPC Link] Error data:', err?.data);
            console.log('[tRPC Link] Error code:', err?.data?.code);
          }

          // Check if UNAUTHORIZED and redirect
          if (err instanceof TRPCClientError && err.data?.code === 'UNAUTHORIZED') {
            if (process.env.NODE_ENV === 'development') {
              console.log('[tRPC Link] Redirecting to / due to UNAUTHORIZED');
            }
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }

          // Pass error through to React Query
          observer.error(err);
        },
        complete: () => observer.complete(),
      });
      return unsubscribe;
    });
  };
};

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        errorLink,
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          async headers() {
            // Check Jotai auth state first (single source of truth)
            const authState = authStore.get(authStateAtom);

            // State 1: Definitely authenticated
            if (authState.isAuthenticated) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[tRPC] Authenticated - fetching session from Supabase');
              }
              // Fetch session from Supabase to get fresh access token
              const { data: { session } } = await supabase.auth.getSession();

              if (session?.access_token) {
                return {
                  authorization: `Bearer ${session.access_token}`,
                };
              }

              // Session missing but Jotai says authenticated - log warning
              if (process.env.NODE_ENV === 'development') {
                console.warn('[tRPC] Auth state mismatch: Jotai says authenticated but no Supabase session');
              }

              return {};
            }

            // State 2: Still initializing - check Supabase directly
            // This allows OAuth callbacks to work before Jotai initializes
            if (authState.loading) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[tRPC] Auth state loading - checking Supabase session directly');
              }
              // Fetch session from Supabase to get fresh access token
              const { data: { session } } = await supabase.auth.getSession();

              if (session?.access_token) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('[tRPC] Using session during initialization');
                }
                return {
                  authorization: `Bearer ${session.access_token}`,
                };
              }

              return {};
            }

            // State 3: Not loading, not authenticated = definitively logged out
            // Block auth headers to prevent stale session from being used
            if (process.env.NODE_ENV === 'development') {
              console.log('[tRPC] Not authenticated - no auth headers sent');
            }
            return {};
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            // Smart retry: never retry auth errors, limit retries for others
            retry: (failureCount, error: any) => {
              // Never retry UNAUTHORIZED - redirect handled by error link
              if (error?.data?.code === 'UNAUTHORIZED') return false;
              // Limit other errors to 1 retry (not 3)
              return failureCount < 1;
            },
            // Strict defaults for better UX
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
          mutations: {
            // Never retry mutations
            retry: false,
          },
        },
      },
    };
  },
  ssr: false,
});