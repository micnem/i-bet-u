# CLAUDE.md - AI Assistant Guide for IBetU

This document provides essential context for AI assistants working with the IBetU codebase.

## Project Overview

IBetU is a full-stack web application for making and tracking friendly bets. Users can create bets, invite friends, track outcomes, climb leaderboards, and manage payments. The app features achievements/gamification, friend networks, and email notifications.

**Key tagline:** "Turn friendly wagers into unforgettable moments"

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TanStack Router (file-based routing), TanStack Start (SSR) |
| Styling | Tailwind CSS v4, Lucide React icons |
| Backend | Supabase (PostgreSQL + Auth), `createServerFn` RPC pattern |
| Email | Resend |
| Build | Vite 7, pnpm |
| Deployment | Cloudflare Workers (serverless edge) |
| Testing | Vitest, @testing-library/react |
| Linting | Biome (replaces ESLint/Prettier) |

## Directory Structure

```
src/
├── api/                    # Server functions (createServerFn endpoints)
│   ├── achievements/       # Achievement definitions, checkers, DB ops
│   ├── bets.ts            # Bet CRUD, status transitions (~1000 LOC)
│   ├── friends.ts         # Friend request management
│   ├── users.ts           # User profile operations
│   ├── reminders.ts       # Email notifications via Resend
│   ├── notifications.ts   # Notification aggregation
│   └── social.ts          # Social features
├── routes/                 # File-based routing (TanStack Router)
│   ├── __root.tsx         # Root layout with AuthProvider, Header
│   ├── auth/              # Login, signup routes
│   ├── bets/              # Bet creation and detail views
│   ├── friends/           # Friend management
│   ├── invite/            # Invitation links
│   ├── dashboard.tsx      # Main user dashboard
│   ├── leaderboard.tsx    # Global leaderboard
│   ├── profile.tsx        # User profile
│   └── settings.tsx       # User settings
├── components/             # Reusable React components
│   ├── AuthProvider.tsx   # Auth state management
│   ├── AuthGuard.tsx      # Route protection
│   ├── Header.tsx         # Navigation, notifications
│   ├── BetReactions.tsx   # Bet reaction system
│   └── QRCode.tsx         # Friend invitation QR codes
├── lib/                    # Utilities and helpers
│   ├── supabase.ts        # Supabase client initialization
│   ├── supabase-browser.ts # Browser-specific Supabase client
│   ├── auth.ts            # Server-side auth helpers
│   ├── database.types.ts  # TypeScript types (auto-generated)
│   ├── validation.ts      # Email/OTP validation
│   ├── bet-templates.ts   # Pre-defined bet templates
│   ├── bet-utils.ts       # Bet status utilities
│   └── sharing.ts         # Share/invite link generation
├── router.tsx             # Router configuration
├── start.ts               # Server middleware
├── styles.css             # Global Tailwind CSS + custom utilities
└── routeTree.gen.ts       # Auto-generated (excluded from Biome)

supabase/
├── schema.sql             # Full database schema
└── migrations/            # Timestamped SQL migrations
```

## Development Commands

```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build
pnpm test         # Run tests via Vitest
pnpm lint         # Run Biome linter
pnpm format       # Format with Biome
pnpm check        # Full Biome check (lint + format)
pnpm deploy       # Build and deploy to Cloudflare Workers
```

## Code Style & Conventions

### Biome Configuration

- **Indentation:** Tabs (not spaces)
- **Quotes:** Double quotes for strings
- **Imports:** Auto-organized by Biome
- **Excluded files:** `routeTree.gen.ts`, `styles.css`

### Naming Conventions

- **Functions/variables:** camelCase
- **Components/Types:** PascalCase
- **Files:** kebab-case for utilities, PascalCase for components
- **Database columns:** snake_case

### Component Patterns

**Route components (file-based):**
```tsx
export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  validateSearch: (search) => ({ /* type-safe search params */ })
})
```

**Server functions:**
```tsx
export const getBetById = createServerFn({ method: "GET" })
  .inputValidator((data: { betId: string }) => data)
  .handler(async ({ data: { betId } }) => {
    // Server-only logic
    return { error: null, data: {...} }
  })
```

### API Response Pattern

All API functions return a consistent shape:
```typescript
{ error: string | null, data: T | null }
```

### CSS Utility Classes

Custom Tailwind utilities are defined in `src/styles.css`:
- `.ibetu-btn-primary`, `.ibetu-btn-secondary`, `.ibetu-btn-outline`
- `.ibetu-input`, `.ibetu-label`, `.ibetu-card`
- `.ibetu-orange-text`, `.ibetu-orange-bg`

**Color scheme:** Orange primary (#f97316), white backgrounds, gray text

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles (extends auth.users) |
| `friendships` | Bidirectional friend relationships |
| `bets` | Main betting entity with status tracking |
| `comments` | Bet discussions |
| `bet_reactions` | User reactions to bets |
| `user_achievements` | Earned achievement badges |
| `payment_reminders` | Payment nudge tracking |

### Key Enums

- `bet_status`: pending, active, completed, declined, expired
- `bet_outcome`: win, loss, pending, disputed
- `friend_request_status`: pending, accepted, declined
- `verification_method`: mutual_agreement, third_party, photo_proof, honor_system

### Important Constraints

- All tables have Row-Level Security (RLS) enabled
- Users cannot bet against themselves (`creator_id != opponent_id`)
- Amounts must be positive (`amount > 0`)
- Friendships are unique per user pair

## Environment Variables

Required variables (see `.env.example`):

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Browser-accessible (VITE_ prefix)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Email
RESEND_API_KEY=re_your-api-key
```

## Authentication Flow

1. `AuthProvider` wraps entire app in `__root.tsx`
2. Use `useAuth()` hook for session state
3. Use `useUser()` hook for current user profile
4. Server functions call `getCurrentUser()` for auth checks
5. `AuthGuard` component protects authenticated routes

## Testing

- **Framework:** Vitest with jsdom environment
- **Test location:** `src/**/*.test.{ts,tsx}`
- **Setup file:** `src/test/setup.ts`
- Run with: `pnpm test`

## Deployment

1. **Build:** Vite bundles the app with TanStack Start
2. **Deploy:** Cloudflare Workers via Wrangler
3. **Migrations:** GitHub Actions auto-runs Supabase migrations on push to main

## Common Gotchas

1. **Supabase clients are lazily initialized** - avoid accessing at module level
2. **Route tree is auto-generated** - never edit `routeTree.gen.ts` directly
3. **Service role key is server-only** - never expose to client code
4. **RLS policies apply** - ensure queries respect row-level security
5. **VITE_ prefix required** - for client-accessible env vars

## API Modules Overview

| Module | Key Functions |
|--------|---------------|
| `bets.ts` | `createBet`, `acceptBet`, `declineBet`, `approveBetResult`, `undoWinnerDeclaration`, `getUserBets`, `getBetById` |
| `friends.ts` | `getFriends`, `addFriendByUsername`, `acceptFriendRequest`, `declineFriendRequest` |
| `users.ts` | `getCurrentUserProfile`, `updateUserProfile`, `getUserStats`, `updatePaymentLink`, `updateEmailPreferences` |
| `reminders.ts` | `sendBetInvitationEmail`, `sendBetAcceptedEmail`, `sendWinnerConfirmationEmail` |
| `notifications.ts` | `getNotifications`, `getNotificationCounts` |

## Bet Lifecycle

1. **pending** - Created, awaiting opponent acceptance
2. **active** - Both parties agreed, bet is live
3. **completed** - Winner declared and both approved
4. **declined** - Opponent rejected the bet
5. **expired** - Deadline passed without resolution

## Working with This Codebase

When making changes:

1. **Read existing code first** - understand patterns before modifying
2. **Run `pnpm check` after every change** - this runs Biome lint and format checks. Fix any errors before committing. Use `pnpm check --write` to auto-fix formatting issues.
3. **Follow the API pattern** - return `{ error, data }` from server functions
4. **Test locally** - run `pnpm dev` and test changes
5. **Check types** - TypeScript strict mode is enabled
6. **Respect RLS** - database queries should work with row-level security
