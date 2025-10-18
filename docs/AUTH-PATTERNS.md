# Authentication Architecture Guide

This document outlines the authentication patterns, architecture, and best practices for this Next.js + tRPC + Supabase template.

## Core Security Principles

### 1. Server is the Security Boundary
**Never trust the client.** All auth checks at the server level are mandatory. Client-side checks are for UX only, never for security.

### 2. Defense in Depth
Multiple layers of protection ensure security even if one layer fails. Our architecture has 5 independent verification layers.

### 3. Simplicity by Default
Most pages only need tRPC queries with protected procedures. Client-side auth hooks are available but optional - use them sparingly for specific UX needs.

### 4. Idiomatic tRPC
Lean on server validation. The server decides authentication state, the client follows its lead.

### 5. Single Source of Truth
Jotai atom (`authStateAtom`) is the client-side source of truth for auth state. All components read from it.

## Architecture Overview

### Five Layers of Defense

Our authentication uses defense-in-depth with five independent verification layers:

```
┌─────────────────────────────────────────────┐
│ Layer 1: AuthProvider (Initialization)     │
├─────────────────────────────────────────────┤
│ Layer 2: Jotai State (Client Source of Truth)│
├─────────────────────────────────────────────┤
│ Layer 3: tRPC Headers (Blocks Stale Sessions)│
├─────────────────────────────────────────────┤
│ Layer 4: Server Context (JWT Validation)   │
├─────────────────────────────────────────────┤
│ Layer 5: Protected Procedures (Access Control)│
└─────────────────────────────────────────────┘
```

#### Layer 1: AuthProvider
```typescript
// src/components/auth/AuthProvider.tsx
// Initializes auth on app load
// Listens to Supabase auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
// Updates Jotai state reactively
```

**Purpose:** Keep client state synchronized with Supabase auth state.

#### Layer 2: Jotai State
```typescript
// src/store/authStore.ts
export const authStateAtom = atom<AuthState>({
  isAuthenticated: boolean,
  user: User | null,
  loading: boolean,
  error: string | null,
  loggingOut: boolean
});
```

**Purpose:** Single source of truth for all components.

#### Layer 3: tRPC Headers Check
```typescript
// src/utils/trpc.ts headers function
async headers() {
  const authState = authStore.get(authStateAtom);

  if (!authState.isAuthenticated) {
    return {}; // No auth header sent
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { authorization: `Bearer ${session.access_token}` };
  }

  return {};
}
```

**Purpose:** Prevent stale Supabase sessions from sending auth after logout. **This is why tRPC-only works!**

#### Layer 4: Server Context
```typescript
// src/server/context.ts
export async function createContext(opts: CreateNextContextOptions) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // getUser checks for freshness --
    // "Gets the current user details if there is an existing session. This method performs a network request to the Supabase Auth server, so the returned value is authentic and can be used to base authorization rules on.
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    // Validates JWT, checks expiry, verifies signature
  }
  return { user: user || null };
}
```

**Purpose:** Validate every request server-side. **Security boundary.**

#### Layer 5: Protected Procedures
```typescript
// src/server/trpc.ts
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { user: ctx.user } });
});
```

**Purpose:** Enforce authenticated-only access at procedure level.

### Error Handling & Redirect

All UNAUTHORIZED errors are caught globally:

```typescript
// src/utils/trpc.ts error link
if (err.data?.code === 'UNAUTHORIZED') {
  window.location.href = '/';
}
```

**This means:** Any protected page that uses tRPC queries automatically redirects on auth failure.

## Default Pattern: tRPC-Only Protection

**Use this for 95% of protected pages.**

### Pattern
```typescript
// src/pages/dashboard.tsx
export default function Dashboard() {
  // Protected query - server validates auth
  const { data, isLoading } = trpc.example.getUser.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If unauthorized, error link redirects
  if (!data) return null;

  return (
    <Layout>
      <DashboardContent data={data} />
    </Layout>
  );
}
```

### Why This Works

1. **User accesses dashboard**
2. **Query runs** → tRPC headers check Jotai
3. **If not authenticated:** No Bearer token sent
4. **Server returns 401** → Error link redirects
5. **If authenticated:** Bearer token sent → Server validates → Returns data

**Key insight:** Layer 3 (tRPC headers) already checks client auth before sending requests!

### When to Use

✅ **Use tRPC-only pattern when:**
- Page immediately fetches protected data
- You want server-first auth validation
- Simple, predictable auth flow is desired
- Page has no conditional UI based on user state

**Examples:**
- Dashboard with user data
- Settings page fetching preferences
- Profile page
- Any page that queries user-specific data immediately

## Enhanced Pattern: useAuth Hook

**Use sparingly for specific UX needs only.**

### Pattern
```typescript
// src/pages/conditional-ui.tsx
export default function ConditionalUI() {
  const auth = useAuth(); // Get client auth state
  const { data } = trpc.example.getSettings.useQuery();

  return (
    <Layout>
      {/* Conditional UI based on user state */}
      {auth.user?.role === 'admin' && <AdminPanel />}
      {auth.user?.isPremium && <PremiumFeatures />}

      <RegularContent data={data} />
    </Layout>
  );
}
```

### When to Use

✅ **Use useAuth hook when:**
- Conditional UI rendering based on user properties
- Pages without immediate queries (static content)
- Optimistic UX (show/hide elements before query completes)
- Complex role-based UI logic

❌ **Don't use useAuth for:**
- Standard protected pages (use tRPC query instead)
- Security (always validate server-side)
- Replacing tRPC queries (unnecessary complexity)

### Examples

#### Conditional Features
```typescript
export default function Features() {
  const auth = useAuth();

  return (
    <Layout>
      <FeatureList />

      {/* Show premium features only to premium users */}
      {auth.user?.subscription === 'premium' && (
        <PremiumFeatureSection />
      )}

      {/* Show upgrade prompt to free users */}
      {auth.user?.subscription === 'free' && (
        <UpgradePrompt />
      )}
    </Layout>
  );
}
```

#### Static Documentation with Auth Check
```typescript
export default function ProtectedDocs() {
  const auth = useAuth();

  if (auth.loading) return <Spinner />;

  if (!auth.isAuthenticated) {
    return <LoginPrompt message="Sign in to view documentation" />;
  }

  return (
    <Layout>
      <ProtectedDocumentation />
    </Layout>
  );
}
```

#### Optimistic Home Page
```typescript
export default function Home() {
  const auth = useAuth();

  return (
    <Layout>
      <Hero />

      {/* Conditional CTA based on auth state */}
      {auth.isAuthenticated ? (
        <Link href="/dashboard">Go to Dashboard</Link>
      ) : (
        <Button onClick={() => showLoginModal()}>Get Started</Button>
      )}
    </Layout>
  );
}
```

## Common Scenarios

### Scenario 1: Basic Protected Page
**Need:** Dashboard that shows user data

**Solution:** tRPC-only pattern
```typescript
export default function Dashboard() {
  const { data, isLoading } = trpc.example.getUser.useQuery();

  if (isLoading) return <Spinner />;
  if (!data) return null;

  return <Layout><Content data={data} /></Layout>;
}
```

**Why:** Server validation handles everything. Simple and secure.

### Scenario 2: Role-Based UI
**Need:** Show different UI elements based on user role

**Solution:** useAuth for conditional rendering
```typescript
export default function AdminPanel() {
  const auth = useAuth();
  const { data } = trpc.example.getAdminData.useQuery();

  return (
    <Layout>
      {auth.user?.role === 'admin' && <AdminControls />}
      {auth.user?.role === 'manager' && <ManagerControls />}
      <SharedContent data={data} />
    </Layout>
  );
}
```

**Why:** UI decisions based on user properties. Server still validates data access.

### Scenario 3: Public Page with Auth-Aware CTA
**Need:** Landing page with different CTAs for logged-in users

**Solution:** useAuth for CTA only
```typescript
export default function Landing() {
  const auth = useAuth();

  return (
    <Layout>
      <Hero />
      <Features />

      {auth.isAuthenticated ? (
        <Link href="/dashboard">View Dashboard</Link>
      ) : (
        <LoginButton />
      )}
    </Layout>
  );
}
```

**Why:** Improves UX by avoiding redirect loop. No security implication.

### Scenario 4: Settings Page with Multiple Queries
**Need:** Page that fetches multiple pieces of user data

**Solution:** tRPC-only with multiple queries
```typescript
export default function Settings() {
  const userQuery = trpc.example.getUser.useQuery();
  const prefsQuery = trpc.example.getPreferences.useQuery();
  const billingQuery = trpc.example.getBilling.useQuery();

  const isLoading = userQuery.isLoading || prefsQuery.isLoading || billingQuery.isLoading;

  if (isLoading) return <Spinner />;

  return (
    <Layout>
      <UserSettings data={userQuery.data} />
      <Preferences data={prefsQuery.data} />
      <Billing data={billingQuery.data} />
    </Layout>
  );
}
```

**Why:** All queries protected server-side. Any 401 triggers redirect.

### Scenario 5: Protected Route Without Immediate Query
**Need:** Static page that requires authentication but doesn't fetch data

**Solution:** useAuth with redirect
```typescript
export default function ProtectedStatic() {
  const auth = useAuth();

  if (auth.loading) return <Spinner />;

  if (!auth.isAuthenticated) {
    // Could redirect or show inline prompt
    return (
      <Layout>
        <LoginPrompt message="Sign in to access this content" />
      </Layout>
    );
  }

  return (
    <Layout>
      <StaticProtectedContent />
    </Layout>
  );
}
```

**Why:** No query to trigger auth check, so use client check for UX.

## Logout Pattern

**Always clear React Query cache when logging out.**

```typescript
// src/components/layout/Header.tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const handleLogout = async () => {
  try {
    // Clear all React Query cache completely
    queryClient.clear();

    await signOut();
    router.push('/');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

**Why:** Prevents stale cached data from showing after logout.

**Key:**
- `queryClient.clear()` removes **all** cached data (not just invalidates)
- Call **before** navigation to prevent flash of old data
- Use `useQueryClient()` from `@tanstack/react-query` (idiomatic for `createTRPCNext`)

## Anti-Patterns

### ❌ Adding Client Guards to Every Protected Page

**Bad:**
```typescript
export default function Dashboard() {
  const { isLoading: authLoading } = useRequireAuth(); // Unnecessary!
  const { data, isLoading: queryLoading } = trpc.example.getUser.useQuery();

  if (authLoading || queryLoading) return <Spinner />;

  return <Layout><Content /></Layout>;
}
```

**Why bad:**
- Duplicates auth check (tRPC headers already check)
- Adds complexity without security benefit
- More code to maintain
- Client checks are not security

**Good:**
```typescript
export default function Dashboard() {
  const { data, isLoading } = trpc.example.getUser.useQuery();

  if (isLoading) return <Spinner />;
  if (!data) return null;

  return <Layout><Content /></Layout>;
}
```

### ❌ Using useAuth for Security

**Bad:**
```typescript
export default function AdminPanel() {
  const auth = useAuth();

  // WRONG: Client-side security check
  if (auth.user?.role !== 'admin') {
    return <AccessDenied />;
  }

  // User could modify client state to bypass this!
  return <AdminControls />;
}
```

**Why bad:**
- Client state can be manipulated
- False sense of security
- Server must still validate

**Good:**
```typescript
export default function AdminPanel() {
  const auth = useAuth();

  // Server validates role
  const { data, isLoading } = trpc.admin.getAdminData.useQuery();

  if (isLoading) return <Spinner />;
  if (!data) return null; // 403 from server

  return (
    <Layout>
      {/* Optional: Hide UI client-side for UX */}
      {auth.user?.role === 'admin' && <SensitiveButtons />}

      <AdminContent data={data} />
    </Layout>
  );
}
```

**Why good:** Server validates role in `protectedProcedure`, client just improves UX.

### ❌ Invalidating Instead of Clearing Cache

**Bad:**
```typescript
const utils = trpc.useUtils();

const handleLogout = async () => {
  await utils.invalidate(); // Marks stale but keeps cache!
  await signOut();
};
```

**Why bad:**
- React Query serves stale cache while refetching
- User sees old data briefly after logout
- Not truly clearing state

**Good:**
```typescript
const queryClient = useQueryClient();

const handleLogout = async () => {
  queryClient.clear(); // Completely removes cache
  await signOut();
};
```

### ❌ Blocking Layout While Checking Auth

**Bad:**
```typescript
export function Layout({ children }) {
  const { isLoading } = useRequireAuth();

  if (isLoading) return <FullPageSpinner />; // Blocks entire layout!

  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
```

**Why bad:**
- Every page shows full-page spinner
- Delays rendering even for public pages
- Poor UX

**Good:**
```typescript
export function Layout({ children }) {
  return (
    <>
      <Header />  {/* Always renders */}
      <main>{children}</main>  {/* Page controls its own loading */}
    </>
  );
}

// Each page handles its own loading
export default function Dashboard() {
  const { data, isLoading } = trpc.example.getUser.useQuery();
  if (isLoading) return <Spinner />; // Only content spinner

  return <Layout><Content /></Layout>;
}
```

### ❌ Creating Separate Authenticated Layout

**Bad:**
```typescript
// AuthenticatedLayout.tsx
export function AuthenticatedLayout({ children }) {
  const { isLoading } = useRequireAuth();
  if (isLoading) return <Spinner />;
  return <Layout>{children}</Layout>;
}

// Requires wrapping every protected page
export default function Dashboard() {
  return (
    <AuthenticatedLayout>
      <DashboardContent />
    </AuthenticatedLayout>
  );
}
```

**Why bad:**
- Over-engineering for tRPC's built-in protection
- Every page needs explicit wrapper
- More components to maintain
- Doesn't add security (server still validates)

**Good:**
```typescript
// Just use standard Layout
export default function Dashboard() {
  const { data, isLoading } = trpc.example.getUser.useQuery();
  if (isLoading) return <Spinner />;

  return (
    <Layout>
      <DashboardContent data={data} />
    </Layout>
  );
}
```

**Why good:** tRPC query handles auth. Layout stays simple.

### ❌ Using HOCs for Route Protection

**Bad:**
```typescript
// withAuth.tsx HOC
export function withAuth(Component) {
  return function ProtectedComponent(props) {
    const { isLoading } = useRequireAuth();
    if (isLoading) return <Spinner />;
    return <Component {...props} />;
  };
}

export default withAuth(Dashboard);
```

**Why bad:**
- Adds wrapper layer without security benefit
- HOC pattern is outdated in modern React
- tRPC already protects server-side
- Debugging becomes harder

**Good:**
```typescript
// Just use tRPC query directly
export default function Dashboard() {
  const { data, isLoading } = trpc.example.getUser.useQuery();
  if (isLoading) return <Spinner />;
  return <Layout><Content /></Layout>;
}
```

## Troubleshooting

### Issue: "Dashboard shows cached data after logout"

**Symptom:** After logout, navigating to dashboard briefly shows old user data

**Cause:** React Query cache not cleared

**Fix:**
```typescript
const queryClient = useQueryClient();

const handleLogout = async () => {
  queryClient.clear(); // Add this!
  await signOut();
};
```

### Issue: "Logged out user makes unnecessary API calls"

**Symptom:** Network tab shows 401 requests after logout

**Cause:** Expected behavior! tRPC query runs, gets 401, redirects. This is by design.

**Impact:** Minimal (one 401 per page visit)

**If concerned:** Add `useAuth` check for specific pages:
```typescript
const auth = useAuth();

const { data } = trpc.example.getUser.useQuery({
  enabled: auth.isAuthenticated // Only run query if authenticated
});
```

### Issue: "Flash of login UI after OAuth callback"

**Symptom:** After OAuth login, briefly see login buttons before dashboard

**Cause:** AuthProvider hasn't finished initializing when page loads

**Expected:** tRPC headers check handles this! Query runs during `loading: true`, finds session, proceeds.

**Fix if needed:** Add loading state to home page
```typescript
const auth = useAuth();

{auth.loading ? (
  <Spinner />
) : auth.isAuthenticated ? (
  <Link href="/dashboard">Dashboard</Link>
) : (
  <LoginButton />
)}
```

### Issue: "User can see dashboard for split second before redirect"

**Symptom:** Protected page renders briefly before 401 redirect

**Cause:** Dashboard renders while query is loading, then error redirects

**Expected behavior:** Loading spinner shows, then redirect. No actual data visible.

**To prevent:** Show loading outside Layout
```typescript
if (isLoading) {
  return <Spinner />; // Before Layout renders
}

return <Layout><Content /></Layout>;
```

### Issue: "Session persists after signOut()"

**Symptom:** After logout, tRPC queries still send auth headers

**Cause:** Was fixed! tRPC headers now check Jotai state

**Verify fix:**
```typescript
// src/utils/trpc.ts should have:
const authState = authStore.get(authStateAtom);
if (!authState.isAuthenticated) {
  return {}; // No auth header
}
```

**Check:** Logout should log `[Auth] Session successfully cleared` in console

### Issue: "Auth state out of sync with Supabase"

**Symptom:** Header shows logged in, but queries fail with 401

**Cause:** Jotai state not updated after Supabase auth change

**Debug:**
```typescript
// Check AuthProvider is listening
// src/components/auth/AuthProvider.tsx should log:
console.log('Auth state change:', event, session?.user?.id);
```

**Common causes:**
- AuthProvider not mounted (check `_app.tsx` wraps app)
- Jotai store not properly shared (check `authStore` instance used)
- Manual Supabase client changes (use atoms instead)

## Best Practices Summary

### Do ✅

1. **Default to tRPC-only** for protected pages
2. **Clear cache on logout** using `queryClient.clear()`
3. **Use useAuth** for conditional UI only
4. **Let Layout render** without auth checks
5. **Trust the server** as security boundary
6. **Keep it simple** - less code is better

### Don't ❌

1. **Don't add client guards** to every page
2. **Don't use client state** for security
3. **Don't create authenticated layouts** (over-engineering)
4. **Don't use HOCs** for route protection (outdated)
5. **Don't invalidate** cache on logout (clear it)
6. **Don't block layout** while checking auth

## Architecture Benefits

### Why This Pattern Works

1. **Simple by Default:** Most pages are just tRPC queries
2. **Secure:** Server validates every request (5 layers!)
3. **Flexible:** useAuth available when needed
4. **Maintainable:** Consistent pattern across codebase
5. **Performant:** No unnecessary client-side checks
6. **Idiomatic:** Follows tRPC best practices

### Comparison to Alternatives

#### vs. Next.js Middleware
**Middleware:**
- Server-side redirects (zero client flash)
- Centralized route config
- More complex setup
- Cookie management issues

**Our approach:**
- Client-side redirects (sub-100ms flash)
- Per-page auth decisions
- Simpler setup
- Jotai + Supabase sync

**Verdict:** Our approach is simpler for small-medium apps. Use middleware for large apps with many protected routes.

#### vs. Route Guards on Every Page
**Guards:**
- Explicit protection visible in code
- Duplicate auth logic everywhere
- More code to maintain
- False sense of security

**Our approach:**
- Implicit protection via tRPC
- DRY (auth logic in headers + server)
- Less code
- Server is security boundary

**Verdict:** Our approach is better. Guards don't add security, just complexity.

#### vs. Context-Based Auth
**Context:**
- Works without tRPC
- More boilerplate
- Prop drilling issues

**Our approach:**
- Leverages tRPC's built-in patterns
- Jotai (no prop drilling)
- Type-safe end-to-end

**Verdict:** Our approach is better for tRPC apps.

## Integration with tRPC

### How tRPC Queries Trigger Auth

```typescript
// 1. Component renders
export default function Dashboard() {
  // 2. Query starts
  const { data } = trpc.example.getUser.useQuery();

  // 3. tRPC headers function runs
  // src/utils/trpc.ts:
  // - Checks authStore.get(authStateAtom)
  // - Returns Bearer token if authenticated

  // 4. Request sent to server
  // 5. createContext runs (src/server/context.ts)
  // 6. protectedProcedure checks ctx.user
  // 7. Query resolver runs or 401 thrown

  // 8. Error link catches 401, redirects
}
```

### Query Options for Auth Control

```typescript
// Disable query until authenticated
const { data } = trpc.example.getUser.useQuery(undefined, {
  enabled: auth.isAuthenticated
});

// Retry logic (already configured, but can override)
const { data } = trpc.example.getUser.useQuery(undefined, {
  retry: false // Don't retry 401s
});

// Suspense mode (for React 18+)
const { data } = trpc.example.getUser.useSuspenseQuery();
// Throws promise while loading, caught by <Suspense>
```

### Protected Procedure Pattern

```typescript
// src/server/routers/example.ts
export const exampleRouter = router({
  // Public - no auth required
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.text}` };
    }),

  // Protected - requires auth
  getUser: protectedProcedure.query(({ ctx }) => {
    // ctx.user is guaranteed to exist (protectedProcedure checks)
    return { user: ctx.user };
  }),

  // Protected mutation
  updateProfile: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ ctx, input }) => {
      // Update user data
      // ctx.user available and type-safe
    }),
});
```

## Quick Reference

### When to Use What

| Scenario | Pattern | Why |
|----------|---------|-----|
| Protected page with data fetch | tRPC query only | Server validates, simple |
| Role-based UI elements | useAuth + tRPC query | Conditional UI, server validates data |
| Public page with auth CTA | useAuth only | No data fetch, UX decision |
| Settings page | tRPC queries only | Multiple protected queries |
| Static docs (auth required) | useAuth + inline prompt | No query, show prompt instead of redirect |
| Logout handler | queryClient.clear() | Remove all cached data |

### Code Snippets

#### Standard Protected Page
```typescript
const { data, isLoading } = trpc.example.getUser.useQuery();
if (isLoading) return <Spinner />;
if (!data) return null;
return <Layout><Content data={data} /></Layout>;
```

#### Conditional UI
```typescript
const auth = useAuth();
{auth.user?.isPremium && <PremiumFeature />}
```

#### Logout
```typescript
const queryClient = useQueryClient();
queryClient.clear();
await signOut();
router.push('/');
```

## Testing Auth Flows

### Test Scenarios

1. **Logged-out user visits protected page:**
   - Should show loading spinner
   - Should redirect to home after 401
   - Should not flash content

2. **OAuth callback:**
   - Should initialize auth during loading
   - Should render dashboard after session confirmed
   - Should not show login UI

3. **Logout:**
   - Should clear all cached queries
   - Should redirect to home
   - Should show login UI in header
   - Revisiting dashboard should show loading → redirect

4. **Token expiry:**
   - Old token → 401 → redirect
   - Should not show stale data
   - Should prompt login

### Manual Testing Checklist

- [ ] Login via OAuth works
- [ ] Login via email/password works
- [ ] Dashboard loads after login
- [ ] Protected queries return data
- [ ] Logout clears cache (no flash of old data)
- [ ] After logout, dashboard redirects
- [ ] After logout, header shows login buttons
- [ ] Revisit dashboard after logout → clean redirect
- [ ] Multiple protected pages all work
- [ ] Conditional UI shows/hides correctly

---

**Remember:** Keep it simple. Default to tRPC queries. Use client auth hooks only when you have a specific UX need. The server is your security boundary.
