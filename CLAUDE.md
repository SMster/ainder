# CLAUDE.md

Guidance for working in this repository.

## Project: "Tinder for AIs" (AInder)

A Tinder-style web app where users swipe through cards representing **LLMs / AI models**,
judging them by their feature sets instead of by people.

- **Swipe left** → that AI model is dismissed and never shown to the user again.
- **Swipe right** → the user is "compatible" with that model; it appears in their **Matches** list.
- **Preferences** → users pick the AI **features** they care about; cards highlight matching
  features, show a match score, and the deck is sorted best-match-first.

## Tech stack

| Concern   | Choice                                                                 |
| --------- | ---------------------------------------------------------------------- |
| Framework | Next.js (App Router) + TypeScript                                      |
| ORM       | Prisma                                                                 |
| Database  | Supabase (Postgres) — **live**; was SQLite locally during early dev    |
| Auth      | Supabase Auth — email/password **and** Google OAuth, via `@supabase/ssr` |
| Styling   | Tailwind CSS v4                                                        |
| Swipe UI  | Framer Motion                                                          |
| API       | Next.js Server Actions + Route Handlers (`app/auth/callback`)          |
| Hosting   | Vercel (GitHub integration; auto-deploys on push to `main`) — **live** |

### Why Prisma
Prisma abstracts the database, so the same schema and queries ran on SQLite locally during
early dev and now run unchanged on Supabase Postgres. The migration was a datasource change
(`provider = "sqlite"` → `"postgresql"`), not a rewrite.

### Auth + DB interaction (important)
Identity lives in **Supabase Auth**; application tables (`AIModel`, `Swipe`, etc.) live in the
**Supabase Postgres** database. To keep the two aligned, **`User.id` stores the Supabase auth
UUID** (`auth.users.id`) rather than a generated cuid.

How it works in code:
- `lib/supabase/{server,client,middleware}.ts` — `@supabase/ssr` clients for Server
  Components/Actions, Client Components, and the session-refresh middleware.
- `middleware.ts` — refreshes the auth session cookie on every request.
- `lib/auth.ts` — `getCurrentUser()` reads the Supabase session, **upserts a `User` keyed by the
  auth UUID**, and redirects to `/login` when signed out. `getOptionalUser()` is the
  non-redirecting variant (used by `<Nav>` and `/login`).
- `lib/auth-actions.ts` — `signIn` / `signUp` / `signOut` server actions (email/password).
- `app/login/page.tsx` — email/password form + **Continue with Google** button.
- `components/GoogleSignInButton.tsx` — kicks off `signInWithOAuth({ provider: "google" })`.
- `app/auth/callback/route.ts` — exchanges the OAuth `code` for a session, then redirects.

The whole app reads identity through `getCurrentUser()`, so pages/actions/queries did **not**
change when the original dev-user shim was replaced with real Supabase Auth — by design.

> **Google OAuth config lives in the Supabase dashboard** (Authentication → Providers → Google:
> Client ID + Secret), **not** in `.env`. The app only needs `NEXT_PUBLIC_SUPABASE_URL` and
> `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Supabase performs the token exchange server-side. Any
> `AUTH_GOOGLE_*` vars in `.env` are inert (Auth.js naming; unused here).

## Database models

Defined in `prisma/schema.prisma`. Shape:

- **User** — `id` = Supabase auth UUID, `email`, `name?`. Has `swipes`, `preferences`.
- **AIModel** — the swipeable card: `name`, `provider`, `tagline?`, `description?`,
  `imageUrl?`, `contextWindow?`, `pricing?`. Has `features`, `swipes`.
- **Feature** — a capability tag (`name` unique, `category?`), e.g. `vision`, `function-calling`.
- **AIModelFeature** — join table linking `AIModel` ↔ `Feature` (composite PK).
- **Swipe** — a user's `LEFT`/`RIGHT` decision on an `AIModel`. `@@unique([userId, aiModelId])`.
- **UserPreference** — a user's desired `Feature` with a `weight` for match scoring.

### Core data rules
- **`Swipe` is the single source of truth.** There is no separate `Match` table.
  - **Deck** = `AIModel`s the user has *not* swiped on yet (no `Swipe` row).
  - **Matches** = `AIModel`s where the user's `Swipe.direction == RIGHT`.
  - **Dismissed** = `Swipe.direction == LEFT` (excluded from the deck forever).
- The `@@unique([userId, aiModelId])` constraint guarantees one decision per model per user.
- `Feature` / `AIModelFeature` exist from the start so preference matching is a pure join.

## Project layout

```
app/
  layout.tsx              # root layout + <Nav>
  globals.css             # Tailwind v4 entry + theme
  page.tsx                # swipe deck (Discover) — fetches deck, sorts by preference match
  matches/page.tsx        # matches list — server component + inline unmatch action
  preferences/page.tsx    # pick preferred features
  login/page.tsx          # email/password form + Continue with Google
  auth/callback/route.ts  # OAuth code → session exchange
components/
  Nav.tsx                 # top nav; shows email + Sign out when authed, else Sign in
  ModelCard.tsx           # presentational card; highlights preferred features + score
  SwipeCard.tsx           # draggable card (framer-motion) with LIKE/NOPE overlays
  SwipeDeck.tsx           # client deck: stack, swipe controls, optimistic state
  PreferenceEditor.tsx    # client feature toggles
  GoogleSignInButton.tsx  # client; starts Google OAuth
lib/
  prisma.ts               # Prisma client singleton
  auth.ts                 # getCurrentUser() (redirects) + getOptionalUser()
  auth-actions.ts         # signIn / signUp / signOut server actions
  data.ts                 # getDeck/getMatches/getAllFeatures/getPreferredFeatures/matchScore
  actions.ts              # Server Actions: recordSwipe / unmatch / resetSwipes / setPreference
  supabase/
    server.ts             # @supabase/ssr server client (cookies)
    client.ts             # @supabase/ssr browser client
    middleware.ts         # updateSession() helper
middleware.ts             # refreshes the Supabase session each request
prisma/
  schema.prisma           # datasource = postgresql (url=pooled, directUrl=direct)
  migrations/             # Postgres migration history (applied to Supabase)
  seed.ts                 # seed AIModels + Features
mcp-schema-server/        # local MCP server: renders the Prisma schema as an ER diagram
.claude/launch.json       # preview/dev launch config (uses absolute node.exe path)
```

### Environment variables (`.env`, gitignored)
- `DATABASE_URL` — Supabase **transaction pooler** (port 6543, `?pgbouncer=true`) — app runtime.
- `DIRECT_URL` — Supabase **session pooler / direct** (port 5432) — Prisma migrations.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Auth/API (anon key is
  safe in the browser).
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; currently unused. See `.env.example`.

### Running locally
Node lives at `C:\Program Files\nodejs` (on PATH for new shells). With `.env` populated:
`npm run dev` → http://localhost:3000. You must sign in (email/password or Google) at `/login`;
the deck and matches read from Supabase Postgres.

## Common commands

```bash
npm install                       # install deps
npm run dev                       # start Next.js dev server
npx prisma migrate dev            # create/apply a migration (against Supabase via DIRECT_URL)
npx prisma db seed                # seed the database
npx prisma studio                 # browse the DB in a GUI
npx prisma validate               # validate the schema
npm test                          # run unit tests once (Vitest)
npm run test:watch                # run unit tests in watch mode
```

## Testing

Unit tests use **Vitest** and live in `tests/`. They cover the pure, DB-free logic only —
no database, network, or React rendering — so they run fast and need no env vars:

- `tests/data.test.ts` — `matchScore` (preference scoring) and `sortDeckByPreference`
  (best-match-first deck ordering).
- `tests/format.test.ts` — `formatContext` (token-count display helper).

`vitest.config.ts` mirrors the `@/*` → `./*` path alias from `tsconfig.json`. To keep logic
testable, prefer extracting pure helpers into `lib/` (e.g. `lib/format.ts`, `sortDeckByPreference`
in `lib/data.ts`) rather than inlining them in components/pages.

> Do **not** run `next build` while the dev server is running — it overwrites `.next` and the
> running dev server then serves unstyled pages. Stop the server (and `rm -rf .next`) to recover.

## Schema-viewer MCP server (`mcp-schema-server/`)

A local stdio MCP server that renders `prisma/schema.prisma` as an interactive ER diagram
(dbdiagram.io style) in the browser, fully offline. Registered for this project in `.mcp.json`.
Tools: `show_schema` (opens the diagram), `get_schema_dbml`, `get_schema_json`. See its README.

## How Supabase was set up (record)

1. Created a hosted Supabase project; copied the pooled + direct Postgres connection strings.
2. Switched `prisma/schema.prisma` datasource `sqlite` → `postgresql` (added `directUrl`).
3. Set `DATABASE_URL` / `DIRECT_URL` + Supabase URL/anon key in `.env`.
4. Regenerated the initial migration for Postgres (`prisma migrate dev`), then seeded.
5. Replaced the dev-user auth shim with Supabase Auth (`@supabase/ssr`) + login UI.
6. Enabled Google OAuth: created a Google Cloud OAuth client (redirect URI =
   `https://<ref>.supabase.co/auth/v1/callback`), pasted Client ID/Secret into Supabase, and
   allow-listed `http://localhost:3000/**` under Auth → URL Configuration.

## Deployment (Vercel)

Live at **https://ainder-seven.vercel.app**, deployed via Vercel's GitHub integration — every
push to `main` triggers a production build.

- **Build:** `npm install` runs `postinstall: prisma generate` (Vercel caches `node_modules`, so
  the Prisma client is regenerated each build) → then `next build`. No `vercel.json` needed.
- **Vercel env vars** (Settings → Environment Variables, Production): `DATABASE_URL` (pooled
  6543), `DIRECT_URL` (5432), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The
  `NEXT_PUBLIC_*` values are inlined at build time, so they must exist before the first build.
- **Migrations do NOT run on Vercel.** Apply schema changes locally with `npx prisma migrate dev`
  (uses `DIRECT_URL`), then push.
- **Production auth redirect config (required, easy to miss):** Supabase → Authentication → URL
  Configuration must include the prod domain — **Site URL** `https://ainder-seven.vercel.app`
  and **Redirect URLs** `https://ainder-seven.vercel.app/**` (keep `http://localhost:3000/**` for
  local dev). The Google Cloud OAuth client's Authorized JS origins must include the prod domain;
  its redirect URI stays the Supabase callback. **Symptom of missing this:** Google OAuth bounces
  to `localhost` or errors with `flow_state_already_used` — the Site URL / Redirect URLs are
  missing the current domain.

## Conventions

- TypeScript everywhere; prefer Server Components and Server Actions for data access.
- Keep all DB access behind `lib/prisma.ts` (singleton to avoid dev hot-reload connection leaks).
- Read identity only through `getCurrentUser()` / `getOptionalUser()` — never read Supabase
  sessions directly in pages/components.
- Never commit `.env` (gitignored). Google OAuth Client ID/Secret belong in the **Supabase
  dashboard**, not `.env`.
- When adding a swipeable model, attach its `Feature`s via `AIModelFeature`, not freeform text.
