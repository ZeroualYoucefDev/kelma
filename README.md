# Kelma — a live-data, gamified language learning platform

> Small lessons. Giant streaks.

Kelma is a production-oriented, Duolingo-style language learning web application built **entirely with Next.js 16 App Router**. It combines a polished, high-contrast gamified UI with a curriculum that is assembled **at runtime from public internet APIs and external language datasets** — there is no bundled vocabulary list, no hardcoded translation table and no mock lesson content anywhere in the repository.

This project lives in `kelma/` so it does not disturb the pre-existing portfolio and Laravel application in the workspace root.

---

## 1. Project overview

Kelma turns a language into a game path:

- **Sequential units** with winding, alternating lesson nodes, lock states and completion feedback.
- **Four exercise families** — translation, reverse translation, listening and dictionary meaning — generated from live word, translation and dictionary data.
- **Native-sounding audio** produced at runtime by the browser Web Speech API in the target language's locale.
- **Hearts** (5 max, one heart per 10 minutes), **XP**, **levels**, **gems**, **daily streaks**, **streak freezes** and **daily quests**, all persisted in a local SQLite database.
- **A virtual shop** where gems buy heart refills and streak freezes, and where **Kelma Pro** is purchased through **Chargily Pay API v2** in DZD using CIB or Edahabia cards.
- **Strict passwordless onboarding** — Google SSO and one-time email codes only. A session cannot enter the dashboard until its email factor is verified; the confirmation flow lands directly on `/learn`.

### The "no dummy content" rule

Every piece of learning content is fetched dynamically:

| Content | Source | Connector |
| --- | --- | --- |
| Vocabulary words | Google 10k/20k English frequency dataset on GitHub | `src/services/words.ts` |
| Language names | ISO-639-1 dataset on GitHub (+ `Intl.DisplayNames` fallback) | `src/services/languages.ts` |
| Translations | MyMemory Translation REST API | `src/services/translation.ts` |
| Definitions, phonetics, recordings | Free Dictionary API | `src/services/dictionary.ts` |
| Audio | Browser Web Speech Synthesis API | `src/services/audio.ts` |
| Unit/lesson structure | Derived from the live dataset at request time | `src/services/curriculum.ts` |

Distractors are other live words from the same generated lesson, never invented placeholder strings. All upstream calls are time-boxed and cached in-process; if a provider fails, the UI degrades to a clear error state rather than showing fake data.

---

## 2. Tech stack

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 16.4.6** (App Router, Server Components, Server Actions, Route Handlers, `proxy.ts`) |
| Runtime | React 19.3.1, TypeScript 5.9, Node.js ≥ 20.9 |
| Styling | **Tailwind CSS 4** with a custom high-contrast dark theme; **shadcn-style** primitives built on Radix UI + `class-variance-authority` |
| Icons | `lucide-react` |
| Database | **SQLite** (zero-config local file at `./kelma.db`) |
| ORM | **Drizzle ORM** with Node's built-in `node:sqlite` engine via the `sqlite-proxy` driver; schema auto-created on first run |
| Authentication | **Clerk** — custom passwordless UI with Google SSO and one-time email codes. Passwords are never offered. |
| Payments | **Chargily Pay API v2** (direct REST) — CIB, Edahabia, Chargily app; DZD; HMAC-SHA256 webhooks |
| External data | MyMemory Translation API, Free Dictionary API, Google frequency-word dataset, ISO-639-1 dataset, Web Speech API |
| Feedback | `sonner` toasts |

### Notable Next.js 16 conventions used

- `src/proxy.ts` replaces the deprecated `middleware.ts` for optimistic auth redirects.
- All request-time APIs are asynchronous (`params` is a `Promise`, `cookies()`/`headers()` are awaited).
- Turbopack is the default bundler; no legacy experimental flags are set.
- Route Handlers use the Web `Request`/`Response` APIs and explicit `runtime = "nodejs"` where Node crypto is needed.

---

## 3. Architecture and routing

```
src/app/
├── layout.tsx                     # fonts, metadata, ClerkProvider, toasts
├── page.tsx                       # PUBLIC landing page (/)
├── verify/page.tsx                # verification confirmation handler → /learn
├── (auth)/sign-in/[[...sign-in]]  # passwordless sign-in
├── (auth)/sign-up/[[...sign-up]]  # passwordless sign-up
├── (app)/layout.tsx               # PROTECTED shell + verification guard
├── (app)/learn                    # winding unit path
├── (app)/units                    # unit index
├── (app)/units/[unitId]           # unit detail + lesson list
├── (app)/lesson/[lessonId]        # lesson player
├── (app)/quests                   # daily quests
├── (app)/leaderboard              # XP rankings from SQLite
├── (app)/shop                     # gem consumables + Pro checkout
├── (app)/profile                  # stats and recent activity
├── (app)/settings                 # profile, languages, billing, sign-out
└── api/
    ├── checkout/chargily          # creates a DZD checkout
    ├── webhooks/chargily          # HMAC-verified activation handler
    ├── curriculum                 # live curriculum JSON
    └── translate                  # live translation proxy
```

### Public vs authenticated surfaces

- `/` is **marketing only**. A verified, signed-in visitor is redirected to `/learn` before the page renders.
- `/learn`, `/units`, `/lesson`, `/quests`, `/leaderboard`, `/shop`, `/profile` and `/settings` live behind the `(app)` route group. `proxy.ts` performs an optimistic signed-in check; the `(app)` layout re-checks Clerk verification and redirects unverified sessions to `/verify`.
- `/verify` is the confirmation handler: verified users are immediately redirected to `/learn`, bypassing the landing page entirely.

### Verification flow

1. Visitor chooses **Google** or enters an email address for a one-time code. No password field exists.
2. The custom `SignInFuture`/`SignUpFuture` flow verifies the factor and finalizes the session straight into `/learn`.
3. The dashboard layout double-checks `emailAddresses[].verification.status`. Unverified sessions are bounced to `/verify`.

### Gamification state machine

`src/lib/gamification.ts` holds pure rules; `src/actions/progress.ts` is the only writer.

- Wrong answers deduct a heart (Pro accounts never lose hearts).
- One heart regenerates every 10 minutes up to a maximum of 5.
- XP = 10 per correct answer + 5 perfect bonus, multiplied by 1.5 for Pro.
- Gems fund shop purchases; streak freezes absorb one missed UTC day.
- `advanceStreak()` is idempotent within a day and consumes at most one freeze per gap.

### Local preview mode

When Clerk keys are absent, the app runs in an explicitly labelled **preview mode**: the UI and the live curriculum are fully browsable with an in-process progress store, and a banner explains that nothing is persisted. With Clerk configured, progress is saved to SQLite automatically — no database server or manual migration step is required.

---

## 4. Prerequisites and environment variables

- Node.js **20.9+** (tested on 22)
- npm 10+
- No database server required — Kelma creates and uses `./kelma.db`
- A Clerk application with **Google** and **email verification code** factors enabled
- A Chargily Pay merchant account (test keys are fine for development)

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

`.env.example` includes:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3100
DATABASE_URL=./kelma.db

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/learn
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/learn

CHARGILY_API_KEY=test_sk_...
CHARGILY_SECRET_KEY=test_sk_...
CHARGILY_MODE=test
CHARGILY_PRO_PRICE_ID=
CHARGILY_PRO_AMOUNT_DZD=9900
LINGUISTICS_CACHE_TTL_SECONDS=86400
```

`CHARGILY_SECRET_KEY` signs webhooks; if omitted, `CHARGILY_API_KEY` is used. `CHARGILY_PRO_PRICE_ID` is optional — when empty, checkout uses `CHARGILY_PRO_AMOUNT_DZD` (minor units, so `9900` = 99.00 DZD).

---

## 5. Installation and local development

```bash
cd kelma
npm install
cp .env.example .env.local      # then edit with real keys
npm run dev                     # http://localhost:3100 (SQLite tables created automatically)
```

Useful commands:

```bash
npm run build        # production build
npm run start        # serve the production build on :3100
npm run typecheck    # strict TypeScript check
npm run db:generate  # generate SQL migrations (optional)
```

If you do not yet have Clerk keys, you can still run `npm run dev` and explore the whole UI in preview mode. Once Clerk is configured, SQLite persistence starts automatically.

### Clerk setup checklist

1. Create an application at [clerk.com](https://clerk.com).
2. Enable **Google** as a social connection.
3. Enable **Email address → Email verification code**.
4. Keep phone, magic-link and password strategies disabled in the UI.
5. Add `http://localhost:3100` (and your Vercel URL) to allowed origins/redirect URLs.
7. Set the four environment variables above.

### Chargily setup checklist

1. Create a test secret key in the Chargily dashboard.
2. Optionally create a Price for the Pro plan and set `CHARGILY_PRO_PRICE_ID`.
3. Register `https://<your-domain>/api/webhooks/chargily` as a webhook endpoint (the checkout request also sends `webhook_endpoint`).
4. Use a test card in the Chargily checkout page; on `checkout.paid`, the webhook activates Pro.

---

## 6. Deployment (Vercel)

1. Push the repository to GitHub.
2. In Vercel, **Add New → Project** and select the repository. Because the app is in a subdirectory, set the **Root Directory** to `kelma`.
3. Framework preset: **Next.js** (Vercel detects Next 16). Build command `npm run build`, output auto-detected.
4. Add every variable from `.env.example` to Vercel **Project Settings → Environment Variables**.
   - Set `NEXT_PUBLIC_APP_URL=https://<your-deployment>.vercel.app`.
   - Set `DATABASE_URL` to a SQLite file path on a persistent volume (for example `./data/kelma.db`). Serverless filesystems are ephemeral, so use a persistent mount for real deployments.
   - Set `CHARGILY_MODE=live` only once live keys are in place.
5. In Clerk, add the Vercel domain to allowed origins and redirect URLs.
6. In Chargily, register the production webhook:
   ```
   https://<your-deployment>.vercel.app/api/webhooks/chargily
   ```
   The route reads the **raw body**, verifies `signature` with HMAC-SHA256 using `CHARGILY_SECRET_KEY`, handles `checkout.paid`, and answers `200` so Chargily stops retrying. Activation is idempotent thanks to a unique checkout-id constraint.
7. Deploy. `npm run build` also runs `next typegen` implicitly through the App Router build; no extra build script is needed.

### Production notes

- The external datasets are cached per server instance for one day; set `LINGUISTICS_CACHE_TTL_SECONDS` to tune this.
- Web Speech audio is generated on the learner's device, so no audio assets or storage are required.
- The in-memory preview store is never used when `DATABASE_URL` is present.
- Never expose `CLERK_SECRET_KEY`, `CHARGILY_API_KEY` or `CHARGILY_SECRET_KEY` with a `NEXT_PUBLIC_` prefix.

---

## 7. API surface

| Endpoint | Purpose |
| --- | --- |
| `GET /api/curriculum?source=en&target=es` | Live unit map |
| `GET /api/translate?q=hello&from=en&to=es` | Live translation proxy |
| `POST /api/checkout/chargily` | Creates a DZD checkout (`cib`, `edahabia` or `chargily_app`) |
| `POST /api/webhooks/chargily` | Verified Chargily event handler |

---

## 8. Repository layout

```
kelma/
├── src/app                 # App Router routes
├── src/actions             # Server Actions (progress, shop, settings)
├── src/components          # UI, marketing, dashboard, shop, auth
├── src/db                  # Drizzle schema + client
├── src/lib                 # auth, data, gamification, config, utils, types
├── src/services            # Live internet connectors (no mock data)
├── proxy.ts                # Next.js 16 auth proxy
├── drizzle.config.ts
├── .env.example
└── README.md
```

---

## License

MIT. Adapt freely.
