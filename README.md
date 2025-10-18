# Kaiba Manor

![Kaiba Manor](kaiba-manor.jpeg)

> A definitive template for starting to take over the world.

A production-ready Next.js template with modern authentication, type-safe APIs, and a clean OKLCH color system. Built for developers who want to ship fast without compromising on architecture.

## Tech Stack

- **Next.js 14 and React 18** - Pages Router for traditional file-based routing (used in lieu of Next@15 and React@19 for LTS)
- **tRPC v11** - End-to-end type-safe APIs with automatic client generation
- **Supabase** - Authentication backend with JWT tokens
- **TanStack Query** (React Query v5) - Powerful data fetching and caching
- **Jotai** - Atomic state management for client-side auth state
- **Tailwind CSS** - Utility-first styling with OKLCH color system
- **shadcn/ui** - 40+ accessible, customizable components
- **TypeScript** - Full type safety across the stack

## Key Architecture

### Data-Layer Authentication

No middleware required. Authentication happens at the tRPC procedure level:

- **Client**: Sends requests with `Bearer` token from Supabase session
- **Server**: tRPC context validates token via `supabaseAdmin.auth.getUser()`
- **Protection**: `protectedProcedure` enforces auth at the data layer
- **Error Handling**: Global error link automatically redirects on `UNAUTHORIZED`

This approach is more flexible and granular than route-level protection, enabling future RBAC and per-procedure permissions.

### OKLCH Color System

Native OKLCH colors without HSL wrappers for accurate color representation:

```css
/* globals.css */
:root {
  --background: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  /* ... */
}
```

```ts
// tailwind.config.ts
colors: {
  background: 'var(--background)', // No hsl() wrapper
  primary: 'var(--primary)',
}
```

### Smart Query Defaults

Strict React Query configuration for better UX:

- **No retries on auth errors** - Instant redirect, no hanging spinners
- **Limited retries** - Only 1 retry for non-auth errors
- **No background refetches** - Explicit data fetching only
- **5-minute stale time** - Reduce unnecessary requests

## Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase account (free tier works)

### Setup

1. **Clone and install**
   ```bash
   git clone <your-repo>
   cd kaiba-manor
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Project URL from Supabase dashboard
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Anon/public key
   - `SUPABASE_SECRET_KEY` - Service role key (keep secure!)

3. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components (Login, SignUp, Profile)
│   ├── layout/        # Layout components (Header, Layout)
│   └── ui/            # shadcn/ui components (40+ components)
├── hooks/             # Custom React hooks
├── lib/
│   └── supabase/      # Supabase client configuration
├── pages/
│   ├── api/trpc/      # tRPC API endpoint
│   ├── dashboard.tsx  # Protected dashboard page
│   ├── index.tsx      # Public landing page
│   └── _app.tsx       # App wrapper with tRPC provider
├── server/
│   ├── context.ts     # tRPC context with auth validation
│   ├── routers/       # tRPC route definitions
│   ├── root.ts        # Root tRPC router
│   └── trpc.ts        # tRPC instance and protectedProcedure
├── store/
│   └── authStore.ts   # Jotai auth state atoms
├── styles/
│   └── globals.css    # Global styles with OKLCH colors
├── types/
│   └── supatypes.types.ts  # Generated Supabase types (via npm run supagen)
└── utils/
    └── trpc.ts        # tRPC client with error handling

scripts/
└── supagen.js         # Supabase type generator script
```

## Authentication Flow

### Client → Server

1. User logs in via Supabase Auth (email/password, OAuth, magic link)
2. Supabase returns session with `access_token` (JWT)
3. tRPC client includes token in `Authorization: Bearer <token>` header
4. Server validates token in `createContext()` via `supabaseAdmin.auth.getUser()`

### Protected Procedures

```ts
// server/routers/example.ts
export const exampleRouter = router({
  getUser: protectedProcedure.query(({ ctx }) => {
    // ctx.user is guaranteed to exist (TypeScript enforced)
    return { user: ctx.user };
  }),
});
```

### Error Handling

Global error link in `src/utils/trpc.ts` intercepts all errors:

```ts
// Automatic redirect on UNAUTHORIZED
if (err instanceof TRPCClientError && err.data?.code === 'UNAUTHORIZED') {
  window.location.href = '/';
}
```

No manual error handling needed in components!

## Development

### Adding Protected Pages

Just call protected tRPC procedures - no wrapper components needed:

```tsx
export default function MyPage() {
  const { data, isLoading } = trpc.example.getUser.useQuery();

  if (isLoading) return <Loader />;
  if (!data) return null; // Auto-redirects via error link

  return <div>Hello {data.user.name}!</div>;
}
```

### Using Colors

All shadcn/ui components automatically use the OKLCH color system:

```tsx
<Button variant="default">Primary</Button>
<Card className="bg-muted">Content</Card>
```

Custom colors via Tailwind utilities:

```tsx
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
</div>
```

### Adding tRPC Procedures

1. Define procedure in `src/server/routers/`
2. Add to root router in `src/server/root.ts`
3. Use in components via `trpc.routerName.procedureName.useQuery()` or `.useMutation()`

### Generating Supabase Types

Automatically generate TypeScript types from your Supabase schema:

```bash
npm run supagen
```

This command:
- Reads `NEXT_PUBLIC_SUPABASE_URL` from `.env.local`
- Extracts the project ID automatically
- Generates types for `auth` and `public` schemas
- Outputs to `src/types/supatypes.types.ts`

No hardcoded project IDs needed - works across all environments!

**Usage in code:**
```ts
import { Database, Tables } from '@/types/supatypes.types';

// Get user row type
type User = Tables<'users'>;

// Use with Supabase client
const { data } = await supabase
  .from('users')
  .select('*')
  .returns<User[]>();
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, etc.)
4. Deploy

Vercel auto-detects Next.js and configures build settings.

### Other Platforms

Standard Next.js deployment:

```bash
npm run build
npm start
```

Ensure environment variables are set in your hosting platform.

## License

MIT
