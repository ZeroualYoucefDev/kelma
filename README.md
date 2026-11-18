# kelma — a live-data language studio

> Small lessons. Giant streaks.

`kelma` is a production-oriented language learning app built with **Next.js 16 App Router**. It has an original, playful brand and UI — not a cloned interface — and a strict flow:

**landing page → passwordless auth → three-step setup → learning dashboard**

Learning content is assembled at runtime from public internet APIs and open datasets. There is no bundled vocabulary list, no hardcoded translation table and no mock lesson content in the repository.

---

## 1. What the app does

- **Public landing page (`/`)** — a vibrant product page with a live language catalogue and a live translation demo. Anonymous visitors only ever land here.
- **Passwordless authentication** — Google SSO, email magic links, or phone OTP. No password field is presented anywhere.
- **Mandatory three-step onboarding** — native language, target language, and daily goal. Nothing is preselected or locked by default; every language is available in both directions.
- **Playful learning dashboard** — custom SVG brand mark, floating stat pills, animated lesson cards, XP, levels, gems, streaks, streak freezes, and daily quests.
- **Four live exercise families** — translation, reverse translation, listening, and dictionary meaning, generated from live word, translation, and dictionary data.
- **Locale-matched audio** — the Web Speech API receives the exact active target locale (`es-ES`, `fr-FR`, `tr-TR`, `it-IT`, etc.) rather than an English default.
- **Hearts with real consequences** — max 5; a wrong answer deducts one immediately, shakes the card, shows a modal alert, syncs to SQLite through a Server Action, and locks free lessons at zero. Pro accounts never lose hearts.
- **Shop and Pro checkout** — gems buy heart refills and streak freezes; Kelma Pro is purchased through **Chargily Pay API v2** in DZD using CIB, Edahabia, or the Chargily app.
- **Profile and Settings** — avatars are chosen there, not during onboarding, so the selected character is preserved across the sidebar, profile, and leaderboard.

### The “no dummy content” rule

| Content | Source | Connector |
| --- | --- | --- |
| Vocabulary words | Google 10k/20k English frequency dataset on GitHub | `src/services/words.ts` |
| Language names | ISO-639-1 dataset on GitHub (+ `Intl.DisplayNames` fallback) | `src/services/languages.ts` |
| Translations | MyMemory Translation REST API | `src/services/translation.ts` |
| Definitions, phonetics, recordings | Free Dictionary API | `src/services/dictionary.ts` |
| Audio | Browser Web Speech Synthesis API | `src/services/audio.ts` |
| Unit/lesson structure | Live dataset-derived structure at request time | `src/services/curriculum.ts` |

Only structural unit and lesson labels live in code. Words, translations, answer choices, and audio locales come from live data. Distractors are other live words from the same generated lesson, never invented placeholders. All upstream calls are time-boxed and cached in process; provider failures surface as clear errors rather than fake content.

---

## 2. Tech stack

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 16.4.6** (App Router, Server Components, Server Actions, Route Handlers, `proxy.ts`) |
| Runtime | React 19.3.1, TypeScript 5.9, Node.js ≥ 20.9 |
| Styling | **Tailwind CSS 4** with a custom dark palette; shadcn-style primitives on Radix UI + `class-variance-authority` |
| Icons | `lucide-react` |
| Database | **SQLite** (zero-config local file, default `./kelma.db`) |
| ORM | **Drizzle ORM** with Node’s built-in `node:sqlite` engine via `sqlite-proxy`; schema is created on first run |
| Authentication | **Clerk Core 3** — custom passwordless UI for Google SSO, email magic links, and phone OTP |
| Payments | **Chargily Pay API v2** direct REST — DZD, CIB/Edahabia/Chargily app, HMAC-SHA256 webhooks |
| External data | MyMemory, Free Dictionary, GitHub frequency/ISO datasets, Web Speech API |
| Feedback | `sonner` toasts |

### Next.js 16 conventions used

- `src/proxy.ts` replaces the deprecated `middleware.ts` for optimistic auth redirects.
- Request-time APIs are asynchronous (`params` is a `Promise`; `cookies()`/`headers()` are awaited).
- Turbopack is the default bundler; no legacy experimental flags are set.
- Route Handlers use Web `Request`/`Response` APIs and declare `runtime = "nodejs"` where Node crypto or `node:sqlite` is needed.

---

## 3. Routing and access control

```
src/app/
├── layout.tsx                         # fonts, metadata, ClerkProvider, toasts
├── page.tsx                           # PUBLIC landing page (/)
├── verify/page.tsx                    # magic-link verification handler
├── sso-callback/page.tsx              # Clerk SSO callback handler
├── (auth)/sign-in/[[...sign-in]]      # passwordless sign-in
├── (auth)/sign-up/[[...sign-up]]      # passwordless sign-up
├── onboarding                         # mandatory 3-step setup
├── (app)/layout.tsx                   # protected shell + verification + onboarding guard
├── (app)/learn                        # playful lesson map
├── (app)/units                        # unit index
├── (app)/units/[unitId]               # unit detail + lesson list
├── (app)/lesson/[lessonId]            # lesson player
├── (app)/quests                       # daily quests
├── (app)/leaderboard                  # XP rankings from SQLite
├── (app)/shop                         # gem consumables + Pro checkout
├── (app)/profile                      # avatar picker, stats, recent activity
├── (app)/settings                     # avatar, languages, goal, billing, sign-out
└── api/
    ├── checkout/chargily              # creates a DZD checkout
    ├── webhooks/chargily              # HMAC-verified activation handler
    ├── curriculum                     # live curriculum JSON
    └── translate                      # live translation proxy
```

### Public vs authenticated surfaces

- `/` is the only public product surface. Verified signed-in visitors are sent onward to `/learn`.
- `/sign-in`, `/sign-up`, `/verify`, and `/sso-callback` are passwordless entry points.
- `/onboarding`, `/learn`, `/units`, `/lesson`, `/quests`, `/leaderboard`, `/shop`, `/profile`, and `/settings` are protected. `proxy.ts` redirects anonymous requests to `/`, and the `(app)` layout re-checks the verified server session.
- Unverified sessions are routed through `/verify`; incomplete accounts are forced into `/onboarding`.

### Authentication flow

1. A visitor chooses **Google**, requests an **email magic link**, or requests a **phone OTP**. No password UI exists.
2. Google returns through `/sso-callback`; magic links complete on `/verify`; phone codes are finalized in the auth form.
3. New verified learners go to `/onboarding`. Completed learners go to `/learn`.
4. `getViewer()` only trusts verified Clerk sessions; there is no implicit preview or anonymous dashboard session.

### First-run setup

`/onboarding` is exactly three server-validated steps:

1. **Native language** — searchable, no preselection.
2. **Target language** — the full catalogue remains unlocked; it must differ from the native language.
3. **Daily goal** — 5, 10, 15, or 20 minutes.

`completeOnboarding()` validates every choice on the server before writing to SQLite. Avatars are deliberately not part of onboarding and can be changed later in Profile or Settings.

### Hearts state machine

`src/lib/gamification.ts` holds pure rules and `src/actions/hearts.ts` is the transactional writer.

- Wrong answers call `registerWrongAnswer` immediately through a Server Action.
- Each answer ID is idempotent, so duplicate client events cannot double-charge.
- One heart regenerates every 10 minutes, capped at 5.
- `heart_events` and `progress` are kept in sync; completing a lesson only commits rewards and the latest heart state.
- Free learners are blocked from entering or continuing a lesson at zero hearts until a refill or Pro activation.

---

## 4. Environment variables

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

`.env.local` is ignored by Git. Never commit Clerk or Chargily secrets.

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3100
DATABASE_URL=./kelma.db

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/onboarding
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding

CHARGILY_MODE=test
CHARGILY_BASE_URL=https://pay.chargily.net/test/api/v2
CHARGILY_PUBLIC_KEY=test_pk_...
CHARGILY_API_KEY=test_sk_...
CHARGILY_SECRET_KEY=test_sk_...
CHARGILY_PRO_PRICE_ID=
CHARGILY_PRO_AMOUNT_DZD=9900
LINGUISTICS_CACHE_TTL_SECONDS=86400
```

- `CHARGILY_SECRET_KEY` signs webhooks; if omitted, `CHARGILY_API_KEY` is used.
- `CHARGILY_PRO_PRICE_ID` is optional. When empty, checkout uses `CHARGILY_PRO_AMOUNT_DZD` in minor units (`9900` = 99.00 DZD).
- `webhookMatchesMode()` rejects test events in live mode and live events in test mode.

Without Clerk keys, the landing page still renders, but protected routes redirect to `/` and Server Actions reject anonymous requests. There is no fake dashboard session.

---

## 5. Installation and local development

This repository’s root **is** the app directory.

```bash
npm install
cp .env.example .env.local      # then add real keys
npm run dev                     # http://localhost:3100
```

Useful commands:

```bash
npm run build        # production build
npm run start        # serve the production build on :3100
npm run typecheck    # strict TypeScript check
npm run db:generate  # generate SQL migrations (optional)
```

SQLite tables are created automatically on first run.

### Clerk setup checklist

1. Create an application at [clerk.com](https://clerk.com).
2. Enable **Google** as a social connection.
3. Enable **Email Magic Link** and, optionally, **Phone SMS / OTP**.
4. Add `http://localhost:3100/sso-callback`, `http://localhost:3100/verify`, and your deployed equivalents to allowed redirect URLs.
5. Set the Clerk variables above, with onboarding fallback URLs.
6. Do not enable a password strategy; the UI does not offer one.

### Chargily setup checklist

Test keys are issued only by a registered Chargily merchant account; there is no public sandbox key. Simulated activation is deliberately absent because it would grant Pro without a real payment event.

1. Create a test secret key in the Chargily dashboard.
2. Use `https://pay.chargily.net/test/api/v2` while `CHARGILY_MODE=test`.
3. Optionally create a Price and set `CHARGILY_PRO_PRICE_ID`.
4. Register `https://<your-domain>/api/webhooks/chargily` as a webhook endpoint; checkout also sends `webhook_endpoint` in its request body.
5. Use a test card on the hosted checkout page. A verified `checkout.paid` event activates Pro exactly once.

The webhook reads the **raw body**, verifies the `signature` header with HMAC-SHA256 using the configured secret, ignores cross-mode and non-paid events, and answers `200` so Chargily stops retrying. Activation is idempotent via the unique checkout-id constraint.

---

## 6. Deployment

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and select the repository. The root directory is the repository root.
3. Framework preset: **Next.js**. Build command: `npm run build`.
4. Add every variable from `.env.example` to Project Settings → Environment Variables.
   - Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin.
   - Use a persistent volume for `DATABASE_URL` (for example `./data/kelma.db`); serverless filesystems are ephemeral.
   - Set `CHARGILY_MODE=live` only with live keys.
5. In Clerk, add the deployed domain, `/sso-callback`, and `/verify` to allowed origins and redirect URLs.
6. In Chargily, register the production webhook:
   ```
   https://<your-deployment>/api/webhooks/chargily
   ```
7. Deploy. `npm run build` runs Next’s type generation implicitly.

Production notes:

- External datasets are cached per server instance; tune with `LINGUISTICS_CACHE_TTL_SECONDS`.
- Web Speech audio is generated on the learner’s device, so no audio storage is required.
- Never expose `CLERK_SECRET_KEY`, `CHARGILY_API_KEY`, or `CHARGILY_SECRET_KEY` with a `NEXT_PUBLIC_` prefix.

---

## 7. API surface

| Endpoint | Purpose |
| --- | --- |
| `GET /api/curriculum?source=en&target=es` | Live unit map for the selected language pair |
| `GET /api/translate?q=hello&from=en&to=es` | Live translation proxy |
| `POST /api/checkout/chargily` | Creates a DZD checkout (`cib`, `edahabia`, or `chargily_app`) |
| `POST /api/webhooks/chargily` | Signature-verified Chargily event handler |

---

## 8. Repository layout

```
.
├── src/app                 # App Router routes
├── src/actions             # Server Actions (auth, onboarding, hearts, progress, shop, settings)
├── src/components          # Brand, marketing, auth, onboarding, app, shop, UI
├── src/db                  # Drizzle schema + client
├── src/lib                 # auth, data, gamification, chargily, config, utils, types
├── src/services            # Live internet connectors (no mock data)
├── src/proxy.ts            # Next.js 16 auth proxy
├── drizzle.config.ts
├── .env.example
└── README.md
```

---

## License

MIT. Adapt freely.
