# Supabase Postgres Setup

This app uses Prisma, so Supabase should be used as the PostgreSQL database first. The existing app auth can stay as-is; Supabase Auth is optional and would be a separate migration.

## 1. Create The Supabase Database User

In Supabase, open your project, go to SQL Editor, and run this. Replace `custom_password` with a strong password.

```sql
create user "prisma" with password 'custom_password' bypassrls createdb;

grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

## 2. Update `.env`

In Supabase, open Dashboard -> Connect. Copy the Supavisor Session pooler connection string. It should use port `5432`.

Set both values in `.env`:

```env
DATABASE_URL="postgresql://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
```

Use the `prisma` user and password from step 1.

## 3. Migrate

Run:

```powershell
npm run db:migrate
npx prisma generate
npm run dev
```

If the connection works, the old `localhost:5432` error will disappear.

## Notes

- Keep using Prisma Client from `src/lib/prisma.ts`; no route code needs to change just to use Supabase Postgres.
- `@supabase/supabase-js` is installed, but this app does not need it for Prisma database access.
- If you later want Supabase Auth, plan that as a separate auth migration because the app currently uses its own `User`, OTP, JWT, and refresh-token tables.
