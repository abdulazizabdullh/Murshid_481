# Murshid Frontend

This is the React/Vite frontend for the Murshid project.

## Requirements

- Node.js 18+
- npm (ships with Node)
- Supabase project (for auth and profile storage)

## Local Setup

```sh
cd Murshid-Frontend
npm install
```

Copy the environment template and fill in the values:

```sh
cp env.example .env
```

Required variables:

- `VITE_SUPABASE_URL` – your Supabase project URL (https://*.supabase.co)
- `VITE_SUPABASE_ANON_KEY` – Supabase anon key
- `VITE_BACKEND_URL` – base URL for the Spring backend (default `http://localhost:8081`)

Start the app:

```sh
npm run dev
```

## Supabase Configuration

1. Enable Email/Password authentication.
2. Add redirect URLs in Authentication → URL Configuration:
   - `http://localhost:5173`
   - `http://localhost:5173/reset-password`
   - Production domains and `https://<your-domain>/reset-password` when deployed.
3. Create the `profiles` table and policies:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text
);

alter table public.profiles enable row level security;

create policy "Read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Update own profile"
  on public.profiles for update
  using (id = auth.uid());
```

## Running with the Backend

Ensure the backend is running (see `../Murshid-Backend/README.md`). The frontend expects the backend at `VITE_BACKEND_URL` and sends the Supabase access token with every authenticated request.
