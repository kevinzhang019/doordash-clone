# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack DoorDash-like food delivery app. Users register/login, browse 20 fake restaurants across various cuisines, add items to a cart, and place orders. All user data (cart, orders) is strictly isolated by authenticated session.

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Build & Production
npm run build
npm start

# Linting & Type Checking
npm run lint
npx tsc --noEmit

# Database
# Supabase PostgreSQL — managed via Supabase Dashboard
# Seed data: run supabase/seed.sql against the database
# Project ID: wtlbtdabfbtvpfwzprqd
```

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — primary red `#FF3008`
- **Supabase** — PostgreSQL database, Storage (images), Row Level Security
- **bcryptjs** — password hashing (cost factor 12)
- **jose** — JWT for session tokens (Edge Runtime compatible)
- **@supabase/supabase-js** — Supabase client for database and storage operations

## Architecture

### Database (Supabase PostgreSQL)

All database operations use the Supabase JS client (`@supabase/supabase-js`). The admin client (`getSupabaseAdmin()` in `lib/supabase.ts`) uses the service role key to bypass RLS — our own auth middleware handles access control.

- **Never** use the service role key on the client side
- **Never** create direct PostgreSQL connections — always use the Supabase client
- Row Level Security (RLS) is enabled on all tables as defense-in-depth
- Order placement uses a PostgreSQL function `place_order()` for atomic transactions

### File Storage (Supabase Storage)

- **restaurant-images** bucket — restaurant photos uploaded by owners
- **avatars** bucket — user profile pictures
- Both buckets are public-read, 5MB limit, JPEG/PNG/WebP only
- Upload via `supabase.storage.from('bucket').upload()` in API routes

### Authentication Flow (Per-Tab Session Isolation)

Each browser tab has its own independent session via `sessionStorage` (not shared cookies). This allows different tabs to be logged into different accounts simultaneously.

1. Register/Login → bcrypt verify → `jose.SignJWT` → JWT returned in response body → stored in `sessionStorage` as `session_token_{role}`
2. A global fetch interceptor (`lib/fetchInterceptor.ts`, installed at module load in `AuthProvider`) patches `window.fetch` to automatically add `Authorization: Bearer <token>` headers to all same-origin API requests
3. `proxy.ts` reads the `Authorization` header (not cookies), verifies JWT, injects `x-user-id` into request headers
4. For page navigations (browser address bar), the proxy lets requests through — client-side auth guards (`useRequireAuth` hook) handle redirects to login
5. Each protected API route handler reads `x-user-id` from headers and scopes all DB queries to that user

Protected API routes (defined in `proxy.ts`): `/api/cart/**`, `/api/orders/**`, `/api/settings/**`, etc.
Client-side auth guards handle page-level protection for `/orders`, `/cart`, `/checkout`, etc.

### User Data Isolation (Critical)

Every cart and order query **must** include `.eq('user_id', userId)` using the session-derived userId — never a user-supplied ID. Order detail endpoints use `.eq('id', orderId).eq('user_id', userId)` to prevent IDOR attacks.

### Security

- **Passwords** — hashed with bcrypt (cost factor 12), never stored in plaintext
- **Emails** — stored in `users` table, protected by RLS policies
- **Addresses** — stored in `user_addresses`, protected by RLS (users can only access their own)
- **Payment data** — only Stripe payment intent IDs stored (no card numbers); Stripe handles PCI compliance
- **RLS** — enabled on all tables; user-scoped tables restrict to `current_setting('app.current_user_id')`
- **Service role key** — server-side only, never exposed to client

### Cart Rules (enforced in `app/api/cart/items/route.ts`)

- A user's cart can only contain items from one restaurant at a time
- Adding an item from a different restaurant returns HTTP 409 with the conflicting restaurant name

### Order Placement (`app/api/orders/route.ts`)

Uses the `place_order()` PostgreSQL function for atomic transaction:

1. Fetch cart items with price snapshots from `menu_items`
2. Validate promo codes and calculate totals
3. INSERT into `orders` and `order_items` (snapshots `name` and `price`)
4. Record promo code usage
5. DELETE all `cart_items` for the user

Price snapshots ensure historical order accuracy if menu prices change later.

### State Management

Two React Contexts wrap the entire app (defined in `components/providers/`):

- **AuthProvider** — current user (`{ id, email, name } | null`), login/logout functions
- **CartProvider** — cart state, addItem/removeItem/updateQuantity/clearCart, sidebar open state

Server Components (home page, restaurant detail) fetch data directly via Supabase. Client Components use context for real-time cart and auth state.

### API Route Conventions

All API routes are under `app/api/`. Every protected route starts with:

```typescript
const userId = parseInt(request.headers.get("x-user-id") ?? "");
if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

All DB queries use the Supabase query builder — never raw SQL string interpolation.

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `JWT_SECRET` — secret for signing session JWTs
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe keys
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps API key

## The 20 Restaurants

Bella Napoli (Italian), Sakura Garden (Japanese), Casa Fuego (Mexican), Spice Route (Indian), Golden Dragon (Chinese), Le Petit Bistro (French), Olive & Sea (Mediterranean), Seoul Kitchen (Korean), Thai Orchid (Thai), The American Grill (American), plus 10 additional restaurants.

## Important Notes

- When using the Supabase query builder, use `.maybeSingle()` instead of `.single()` when a row may not exist (to avoid throwing errors)
- Boolean columns use actual `true`/`false` in PostgreSQL (not 0/1 like SQLite)
- Supabase relation queries replace SQL JOINs: `supabase.from('orders').select('*, restaurants(name)')`
- The old `db/database.ts` and `db/seed.ts` files are kept as reference but are no longer used
- **Stripe SDK v20+ breaking change**: `current_period_end` moved from `Subscription` to `SubscriptionItem`. Access it via `sub.items.data[0].current_period_end`. Similarly, `Invoice.subscription` moved to `invoice.parent.subscription_details.subscription`. Always expand items when retrieving subscriptions: `stripe.subscriptions.retrieve(id, { expand: ['items.data'] })`.
- **`orders` table has a CHECK constraint** (`orders_status_check`) limiting the `status` column to allowed values. When adding new status values (e.g. `'cancelled'`), you must run a migration to drop and recreate the constraint to include the new value — otherwise the UPDATE will silently fail at the DB level.
