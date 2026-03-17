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

# Database (SQLite is auto-initialized on first run — no manual setup needed)
# To reset: delete ./data/doordash.db and restart the dev server
```

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — primary red `#FF3008`
- **better-sqlite3** — synchronous SQLite with WAL mode
- **bcryptjs** — password hashing (cost factor 12)
- **jose** — JWT for session tokens (Edge Runtime compatible)

## Architecture

### Database Initialization (`db/database.ts`)

Singleton better-sqlite3 connection. On first import, it runs migrations (creates all tables) and seeds the 10 restaurants + menu items if the table is empty. Everything else imports from here — never create a second DB connection.

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

Every cart and order query **must** include `WHERE user_id = ?` using the session-derived userId — never a user-supplied ID. Order detail endpoints use `WHERE id = ? AND user_id = ?` to prevent IDOR attacks.

### Cart Rules (enforced in `app/api/cart/items/route.ts`)

- A user's cart can only contain items from one restaurant at a time
- Adding an item from a different restaurant returns HTTP 409 with the conflicting restaurant name
- `cart_items` has `UNIQUE(user_id, menu_item_id)` — adding the same item performs an upsert on quantity

### Order Placement (`app/api/orders/route.ts`)

Runs in a single SQLite transaction:

1. Fetch cart items with price snapshots from `menu_items`
2. Calculate totals
3. INSERT into `orders`
4. INSERT all items into `order_items` (snapshots `name` and `price` — not FK references)
5. DELETE all `cart_items` for the user

Price snapshots ensure historical order accuracy if menu prices change later.

### Database Schema

```
users         (id, email UNIQUE, name, password_hash, created_at)
restaurants   (id, name, cuisine, description, image_url, rating, delivery_fee, delivery_min, delivery_max, address)
menu_items    (id, restaurant_id→restaurants, category, name, description, price, image_url, is_available)
cart_items    (id, user_id→users, restaurant_id→restaurants, menu_item_id→menu_items, quantity, UNIQUE(user_id, menu_item_id))
orders        (id, user_id→users, restaurant_id→restaurants, status, delivery_address, subtotal, delivery_fee, total, placed_at)
order_items   (id, order_id→orders, menu_item_id→menu_items, name TEXT, price REAL, quantity)
```

### State Management

Two React Contexts wrap the entire app (defined in `components/providers/`):

- **AuthProvider** — current user (`{ id, email, name } | null`), login/logout functions
- **CartProvider** — cart state, addItem/removeItem/updateQuantity/clearCart, sidebar open state

Server Components (home page, restaurant detail) fetch data directly without context. Client Components use context for real-time cart and auth state.

### API Route Conventions

All API routes are under `app/api/`. Every protected route starts with:

```typescript
const userId = parseInt(request.headers.get("x-user-id") ?? "");
if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

All DB queries use better-sqlite3 prepared statements with `?` placeholders — never string interpolation.

## The 10 Restaurants

Bella Napoli (Italian), Sakura Garden (Japanese), Casa Fuego (Mexican), Spice Route (Indian), Golden Dragon (Chinese), Le Petit Bistro (French), Olive & Sea (Mediterranean), Seoul Kitchen (Korean), Thai Orchid (Thai), The American Grill (American).
version and can revert easily.
