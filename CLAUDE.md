# CLAUDE.md — Eleva: Planejador de Estudos Inteligente

This file provides context and guidelines for AI assistants working in this codebase.

## Project Overview

**Eleva** is a full-stack SaaS web application for intelligent study planning, targeting Brazilian competitive exams (concursos and vestibulares). It is written primarily in Portuguese (pt-BR). Key capabilities include:

- AI-powered essay correction (Google Gemini API)
- Spaced repetition flashcards (SM-2 algorithm)
- Study cycle management and weekly planning
- Error notebook, quiz mode, and performance analytics
- Gamification (XP, streaks, badges, rankings)
- Stripe subscription billing (PRO and PREMIUM plans)
- Social features (friends, groups, rankings)

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + TypeScript 5.8 |
| Build tool | Vite 6 |
| Routing | React Router DOM 6 |
| State management | Zustand 5 (24 stores) |
| Styling | TailwindCSS 4 (utility-first) |
| UI primitives | Radix UI, cmdk |
| Icons | Lucide React |
| Animations | Framer Motion 11 |
| Database / Auth | Supabase (PostgreSQL + RLS) |
| AI | Google Gemini API (`@google/generative-ai`) |
| Payments | Stripe (frontend `@stripe/stripe-js` + edge functions) |
| Charts | Recharts |
| Drag & drop | @dnd-kit/core, @dnd-kit/sortable |
| Forms | React Hook Form + Zod |
| Date utilities | date-fns 4 |
| PDF handling | pdf.js-dist |
| Testing | Vitest 2 + @testing-library/react + jsdom |

---

## Repository Structure

```
/
├── src/
│   ├── config/          # App-level configuration constants
│   ├── pages/           # Admin and special-purpose page components
│   └── index.css        # Global styles (TailwindCSS directives)
├── components/          # 102 React components organized by feature
│   └── ui/              # Shared UI primitives (Button, Card, Modal, etc.)
├── stores/              # 24 Zustand store files
├── services/            # External API and business logic services
├── hooks/               # Custom React hooks
├── utils/               # Pure utility functions
├── types/               # TypeScript type definitions
├── routes/              # React Router route configuration
├── contexts/            # React context providers
├── data/                # Static/mock data files
├── lib/                 # Internal library helpers
├── supabase/
│   ├── functions/       # Deno-based edge functions (Stripe webhooks)
│   ├── migrations/      # SQL database migrations
│   └── config.toml      # Supabase project config
├── tests/
│   ├── setup.ts         # Global test setup (mocks for matchMedia, ResizeObserver)
│   └── unit/            # Unit tests (stores, components, utils)
├── public/              # Static assets
├── App.tsx              # Root component with providers and error boundaries
├── index.tsx            # Application entry point
├── vite.config.ts       # Vite build configuration
├── vitest.config.ts     # Vitest test configuration
├── tailwind.config.cjs  # Tailwind theme and plugins
├── tsconfig.json        # TypeScript strict mode configuration
├── vercel.json          # Vercel deployment + CSP security headers
└── netlify.toml         # Netlify deployment + cache headers
```

---

## Common Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start Vite dev server at http://localhost:5173

# Build & Preview
npm run build        # Production build to dist/
npm run preview      # Preview production build locally at :4173
npm run build:production  # Explicit production mode build
npm run build:analyze     # Build with bundle visualizer (outputs stats.html)

# Testing
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open Vitest UI dashboard
npm run test:coverage  # Run with v8 coverage report
```

There is no separate lint command configured. TypeScript type checking is performed at build time by Vite.

---

## Architecture & Conventions

### State Management

All global state lives in **Zustand stores** (`/stores`). Each store is a custom hook file named `use<Feature>Store.ts`.

- Components read state by subscribing to the specific store slice they need.
- Stores call **services** for async operations (Supabase queries, API calls).
- Local UI state (e.g., hover, open/close) uses `useState` inside components.
- Modal visibility is centralized in `useModalStore`.

**Do not** use React Context for application data — only for utility/infrastructure (breadcrumbs, etc.).

### Component Architecture

- Feature components live in `/components` (e.g., `Dashboard.tsx`, `FlashcardsPage.tsx`).
- Shared UI primitives live in `/components/ui/` (Button, Card, Input, Modal, Tabs, etc.).
- All routes are **lazy-loaded** via `React.lazy()` in `/routes/index.tsx` — follow this pattern for new pages.
- Use **error boundaries** where appropriate, especially around feature sections.
- Use **skeleton loaders** for async data — never show raw loading spinners on large sections.

### Services Layer

Services in `/services/` abstract all external interactions:

| Service | Purpose |
|---|---|
| `supabaseClient.ts` | Supabase client singleton (DB, Auth, Storage) |
| `geminiService.ts` | Google Gemini AI integration for essay correction |
| `stripeService.ts` | Stripe checkout and portal session creation |
| `flashcardService.ts` | Flashcard CRUD operations |
| `srsService.ts` | Spaced repetition scheduling (SM-2 algorithm) |
| `quizService.ts` | Quiz generation and persistence |

**Always go through services** for external calls. Do not call Supabase or fetch APIs directly inside components.

### TypeScript

- Strict mode is enabled (`tsconfig.json`). Do not use `any` without a comment explaining why.
- Main shared types are in `types/types.ts`.
- Supabase-generated database types are in `types/supabase.ts` — regenerate with the Supabase CLI when schema changes.
- Use **Zod** for runtime validation at API/form boundaries.

### Styling

- Use **TailwindCSS utility classes** exclusively. Do not write custom CSS unless absolutely required.
- Custom theme tokens are in `tailwind.config.cjs`.
- The app supports dark mode — always test both modes when styling new components.
- Responsive design is required — use Tailwind responsive prefixes (`md:`, `lg:`, etc.).

### Routing

All routes are defined in `/routes/index.tsx`. Admin routes are protected with role checks. When adding a new route:

1. Create the page component in `/components` or `/src/pages`.
2. Add a lazy import at the top of `routes/index.tsx`.
3. Add the `<Route>` entry in the appropriate section.
4. Update the sidebar navigation in `Sidebar.tsx` and `MobileHeader.tsx` if needed.

---

## Database (Supabase / PostgreSQL)

### Key Tables

| Table | Description |
|---|---|
| `profiles` | User profile data (XP, streak, onboarding) |
| `editais` | Study plans / exam blueprints |
| `disciplinas` | Subjects within a study plan |
| `topicos` | Topics within subjects |
| `sessoes_estudo` | Individual study session records |
| `ciclos` | Study rotation cycles |
| `sessoes_ciclo` | Sessions within cycles |
| `revisoes` | Spaced repetition scheduled reviews |
| `flashcards` | Flashcard cards and decks |
| `revisoes_flashcard` | Flashcard review history |
| `caderno_erros` | Error notebook entries |
| `xp_log` | XP event history |
| `subscriptions` | Stripe subscription state |

### Conventions

- **Row Level Security (RLS)** is enforced on all user-scoped tables. Never disable RLS.
- All migrations go in `supabase/migrations/` as numbered SQL files.
- Use the Supabase client from `services/supabaseClient.ts` — never instantiate a new client.

---

## Subscription & Payments

The app has three tiers: **Free**, **PRO**, and **PREMIUM**. Subscription state is managed in `useSubscriptionStore`.

- Stripe Checkout and Customer Portal sessions are created by Supabase Edge Functions in `supabase/functions/`.
- Webhook events are handled by `supabase/functions/stripe-webhook/`.
- Feature gating is done inside components/stores by checking `subscription.plan`.
- The app has a **3-day free trial** mechanic — respect this when building new paid features.

---

## AI / Gemini Integration

Essay correction (`CorretorRedacao.tsx`) uses Google Gemini via `services/geminiService.ts`. The service is large (~164KB) due to the detailed prompting logic. When modifying:

- Prompts are entirely in Portuguese (pt-BR).
- Scores are generated per criterion: conteúdo, estrutura, linguagem, argumentação.
- Keep the Gemini API key in `VITE_GEMINI_API_KEY` env var.

---

## Environment Variables

Required variables (copy `.env.example` to `.env`):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GEMINI_API_KEY           # Optional — only for essay correction
VITE_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY             # Server-side only (edge functions)
STRIPE_WEBHOOK_SECRET
VITE_STRIPE_PRICE_PRO_MONTHLY
VITE_STRIPE_PRICE_PRO_YEARLY
VITE_STRIPE_PRICE_PREMIUM_MONTHLY
VITE_STRIPE_PRICE_PREMIUM_YEARLY
VITE_APP_URL                  # Full URL for OAuth redirects
```

`VITE_` prefixed vars are bundled into the frontend. Never put secret keys in `VITE_` vars.

---

## Testing

Tests live in `tests/unit/`. The setup file (`tests/setup.ts`) provides global mocks for browser APIs not present in jsdom (matchMedia, ResizeObserver).

- Write unit tests for all utility functions in `utils/`.
- Write store tests when stores contain non-trivial logic.
- Use `@testing-library/react` for component tests — test behavior, not implementation.
- Coverage is tracked with v8. Run `npm run test:coverage` to generate the report.

---

## Deployment

The app deploys to either **Vercel** or **Netlify** (both configured):

- All routes return `index.html` (SPA rewrite).
- Security headers (CSP, X-Frame-Options, etc.) are set in `vercel.json` / `netlify.toml`.
- CSP allows scripts from Stripe, Google Analytics, and Google APIs — update it if new external scripts are added.
- Assets are cached for 1 year with content-hash filenames (Vite default).

---

## Language & Localization

- **All user-facing text is in Portuguese (pt-BR).**
- Variable names, comments, and commit messages may be in either Portuguese or English.
- Keep new UI strings in Portuguese to match the existing codebase.

---

## Key Conventions Summary

1. Use Zustand stores for all shared/async state — not Context or component state.
2. Use the service layer for all external API calls.
3. Lazy-load all page-level components via `React.lazy()`.
4. Write TailwindCSS classes — avoid custom CSS.
5. Keep TypeScript strict — avoid `any`.
6. All DB access must go through the Supabase client singleton with RLS in place.
7. Never put secret keys in `VITE_` environment variables.
8. All user-facing copy must be in Portuguese (pt-BR).
9. Follow the existing modal pattern via `useModalStore` for new modals.
10. Add new routes to `/routes/index.tsx` with lazy imports.
