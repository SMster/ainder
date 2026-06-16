# CLAUDE.md

Guidance for working in this repository.

## Project: "Tinder for AIs"

A Tinder-style web app where users swipe through cards representing **LLMs / AI models**,
judging them by their feature sets instead of by people.

- **Swipe left** → that AI model is dismissed and never shown to the user again.
- **Swipe right** → the user is "compatible" with that model; it appears in their **Matches** list.
- **Phase 2** → users define their own AI **preferences**, and cards highlight which features match.

## Tech stack

| Concern        | Choice                                                              |
| -------------- | ------------------------------------------------------------------- |
| Framework      | Next.js (App Router) + TypeScript                                   |
| ORM            | Prisma                                                              |
| DB (local)     | SQLite (`prisma/dev.db`)                                            |
| DB (prod)      | Supabase (Postgres) — app data migrated later                       |
| Auth           | Supabase Auth (multi-user identity from day one)                    |
| Styling        | Tailwind CSS                                                        |
| Swipe UI       | Framer Motion (or `react-tinder-card`)                              |
| API            | Next.js Server Actions + Route Handlers (`app/api/...`)             |

### Why Prisma + SQLite first
Prisma abstracts the database, so the same schema and queries run on SQLite locally and on
Supabase Postgres in production. Migration is a config change, not a rewrite.

### Auth + DB interaction (important)
Identity lives in **Supabase Auth from day one**, while application tables (`AIModel`, `Swipe`,
etc.) live in **local SQLite during development** and migrate to Supabase Postgres later.
To keep the two aligned, **`User.id` stores the Supabase auth UUID** (`auth.users.id`) rather
than a generated cuid. On sign-in, upsert a `User` row keyed by that UUID.

**Current state:** auth is a **dev shim** in `lib/auth.ts` — `getCurrentUser()` returns a single
fixed dev user and upserts it. The entire app reads identity through this one function, so
swapping in Supabase Auth means implementing only `lib/auth.ts` (read the Supabase session,
upsert a `User` keyed by the auth UUID) and adding login UI — no changes to pages, actions, or
queries.

## Database models

Defined in `prisma/schema.prisma`. Shape:

- **User** — `id` = Supabase auth UUID, `email`, `name?`. Has `swipes`, `preferences`.
- **AIModel** — the swipeable card: `name`, `provider`, `tagline?`, `description?`,
  `imageUrl?`, `contextWindow?`, `pricing?`. Has `features`, `swipes`.
- **Feature** — a capability tag (`name` unique, `category?`), e.g. `vision`, `function-calling`.
- **AIModelFeature** — join table linking `AIModel` ↔ `Feature` (composite PK).
- **Swipe** — a user's `LEFT`/`RIGHT` decision on an `AIModel`. `@@unique([userId, aiModelId])`.
- **UserPreference** (phase 2) — a user's desired `Feature` with a `weight` for match scoring.

### Core data rules
- **`Swipe` is the single source of truth.** There is no separate `Match` table.
  - **Deck** = `AIModel`s the user has *not* swiped on yet (no `Swipe` row).
  - **Matches** = `AIModel`s where the user's `Swipe.direction == RIGHT`.
  - **Dismissed** = `Swipe.direction == LEFT` (excluded from the deck forever).
- The `@@unique([userId, aiModelId])` constraint guarantees one decision per model per user.
- `Feature` / `AIModelFeature` exist from the start so phase-2 preference matching is a
  pure join — no schema migration needed to add it.

## Project layout

```
app/
  layout.tsx            # root layout + <Nav>
  globals.css           # Tailwind v4 entry + theme
  page.tsx              # swipe deck (Discover) — fetches deck, sorts by preference match
  matches/page.tsx      # matches list — server component + inline unmatch action
  preferences/page.tsx  # phase 2: pick preferred features
components/
  Nav.tsx               # top nav (Discover / Matches / Preferences)
  ModelCard.tsx         # presentational card; highlights preferred features + score
  SwipeCard.tsx         # draggable card (framer-motion) with LIKE/NOPE overlays
  SwipeDeck.tsx         # client deck: stack, swipe controls, optimistic state
  PreferenceEditor.tsx  # phase 2: client feature toggles
lib/
  prisma.ts             # Prisma client singleton
  auth.ts               # getCurrentUser() — DEV SHIM, replace with Supabase Auth
  data.ts               # getDeck/getMatches/getAllFeatures/getPreferredFeatures/matchScore
  actions.ts            # Server Actions: recordSwipe / unmatch / resetSwipes / setPreference
prisma/
  schema.prisma
  seed.ts               # seed AIModels + Features
  dev.db                # local SQLite (gitignored)
.claude/launch.json     # preview/dev launch config (uses absolute node.exe path)
```

### Running locally
Node lives at `C:\Program Files\nodejs` (on PATH for new shells). From the project root:
`npm run dev` → http://localhost:3000. The deck and matches read from `prisma/dev.db`.

## Common commands

```bash
npm install                       # install deps
npm run dev                       # start Next.js dev server (once UI exists)
npx prisma migrate dev            # create/apply a migration (dev)
npx prisma db seed                # seed the database
npx prisma studio                 # browse the DB in a GUI
npx prisma validate               # validate the schema
```

## Migrating to Supabase (later)

1. Create a Supabase project; copy the Postgres connection strings.
2. In `prisma/schema.prisma`, change `datasource db { provider = "sqlite" }` to `"postgresql"`.
3. Set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct, for migrations) in `.env`.
4. Run `npx prisma migrate deploy`, then re-seed.
5. App tables move; Supabase Auth identity is already in place — no auth retrofit.

## Conventions

- TypeScript everywhere; prefer Server Components and Server Actions for data access.
- Keep all DB access behind `lib/prisma.ts` (singleton to avoid dev hot-reload connection leaks).
- On sign-in, upsert the `User` row keyed by the Supabase auth UUID (`User.id`).
- Never commit `prisma/dev.db` or `.env` — both are gitignored.
- When adding a swipeable model, attach its `Feature`s via `AIModelFeature`, not freeform text.
