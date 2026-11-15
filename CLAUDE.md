# Student Ops

Student management dashboard: students, cohorts and managers, with Supabase Auth.
Next.js 16 (App Router) + Supabase + shadcn/ui, deployed on Vercel. Package manager: **pnpm**.
The source was imported from the Vercel production deployment.

## Commands
- `pnpm dev` — dev server
- `pnpm build` — production build (run before calling a change done)
- There are no lint or test scripts yet.

## Layout
- `app/(dashboard)/` — students, cohorts, managers
- `app/auth/` — login, sign-up and the auth callback
- `lib/supabase/` — `client.ts` (browser), `server.ts` (server), `proxy.ts` (session refresh used by `middleware.ts`), data helpers
- `components/ui/` — shadcn/ui components

## Rules
- The Supabase project is production. Schema changes are additive only; never drop or truncate.
  When a change needs SQL, say so and give the exact statements to run in the Supabase SQL editor.
- Only the publishable key belongs in the browser; never use the service role key client-side.
- Never read or print `.env*` files.
- Preview: `.claude/launch.json` → `student-ops` (port 3011).
