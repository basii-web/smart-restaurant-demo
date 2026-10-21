# Smart Restaurant QR Ordering System

A premium bilingual hotel restaurant ordering system built with React, Vite, and Supabase. It includes a customer QR menu, kitchen operations, billing, and a premium admin dashboard.

## Quick start

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project's API settings. Never use a service-role key in the browser.
3. Run `supabase/schema.sql` in the Supabase SQL Editor.
4. In Supabase Authentication, create a staff user. Copy that user's UUID, then add its profile in the SQL Editor, replacing the UUID:

   ```sql
   insert into public.profiles (id, full_name, role, is_active)
   values ('AUTH_USER_UUID', 'Restaurant Admin', 'admin', true);
   ```

5. Restart the dev server with `npm run dev`. The navigation should show **Live data**.
6. Sign in with the staff email and password created in Supabase Authentication.

## Demo mode

If either Supabase environment variable is absent, the app runs in demo mode with local mock data. Environment variables are read when Vite starts, so restart the server after changing `.env`.

## Included interfaces

- Customer menu with bilingual English/Tamil labels
- Cart and order placement flow
- Kitchen dashboard with new, cooking, ready, and served states
- Billing and receipt panel
- Admin menu and QR management panel

## Database

`supabase/schema.sql` creates the single-restaurant schema, menu categories, starter tables, row-level policies, the `menu-images` Storage bucket, and the validated `place_order` RPC. Orders are priced and stock-checked in the database. Live staff accounts need a matching active row in `public.profiles`; roles are `admin`, `kitchen`, and `cashier`.

The SQL schema is intended for initial setup or repeatable re-application. Back up production data before running schema changes against an existing project.
