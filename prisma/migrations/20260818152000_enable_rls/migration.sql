-- Enable Row Level Security on every table in the `public` schema.
--
-- WHY THIS EXISTS
-- Supabase auto-generates a PostgREST API over the `public` schema, so every
-- table there is reachable over HTTPS by the `anon` / `authenticator` roles.
-- Postgres creates tables with RLS DISABLED by default, which means a freshly
-- migrated database exposes all of its rows to anyone holding the (public)
-- anon key.
--
-- WHY THERE ARE NO POLICIES
-- The application never talks to PostgREST. All queries go through Prisma using
-- the `postgres` role, which has `rolbypassrls = true` — RLS is never evaluated
-- for application traffic. `anon` and `authenticator` have
-- `rolbypassrls = false`, so for them RLS *is* evaluated, and a table with RLS
-- enabled and zero policies denies every row.
--
-- Net effect: the PostgREST/anon path is closed, the Prisma path is unaffected.
-- The absence of policies is intentional. Do NOT add permissive policies here
-- "to make things work" — if something breaks, it is not connecting as
-- `postgres` and that is the thing to fix.
--
-- RE-RUN SAFETY
-- `enable row level security` on an already-enabled table is a no-op, so this
-- migration is safe to (re-)apply against a database where RLS is already on.
--
-- NOTE: `_prisma_migrations` is deliberately not included here — see the
-- migration's accompanying commit message.

alter table public.users enable row level security;
alter table public.cars enable row level security;
alter table public.maintenance_items enable row level security;
alter table public.mileage_logs enable row level security;
alter table public.car_events enable row level security;
alter table public.fines enable row level security;
alter table public.service_records enable row level security;
