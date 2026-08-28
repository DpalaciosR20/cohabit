# Cohabit

Cohabit is a shared home-management app for couples/roommates: a shared shopping list, expense tracking with flexible splits, real-time sync between household members, recurring bill reminders, and balance tracking.

Built as a learning project to practice full-stack engineering with an agile workflow — from product backlog to production deployment — using modern, production-grade tooling.

## Status

🟢 Live in production: [cohabit-seven.vercel.app](https://cohabit-seven.vercel.app) — MVP complete, iterating on the backlog.

## Tech stack

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** Next.js Route Handlers
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Auth:** Auth.js (NextAuth), credentials + bcrypt
- **Realtime:** Supabase Realtime (`postgres_changes`)
- **Testing:** Vitest + React Testing Library
- **Hosting:** Vercel

## Environments

Production and local development use **separate Supabase projects**, so local testing and seed data never touch real user data. Copy `.env.example` to `.env` and fill in your own dev project's credentials — production's values live only in Vercel's environment variables.

## Getting started

```bash
npm install                 # also runs `prisma generate` via postinstall
npx prisma migrate deploy   # apply the schema to your dev database
npx prisma db seed          # optional: create test accounts + sample data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seeded test accounts

`npx prisma db seed` creates (password `password123` for all):

| Email | Notes |
|---|---|
| `diego@example.com` | Member of "Depa de prueba", with sample shopping items, expenses, and bills |
| `novia@example.com` | Same household as Diego |
| `solo@example.com` | No household yet — useful for testing the create/join flow |

Safe to re-run; it upserts and skips work that's already there instead of duplicating.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npx prisma db seed` | Populate dev database with test accounts and sample data |

## Data model

See [`prisma/schema.prisma`](prisma/schema.prisma) for the full schema: `User`, `Household`, `HouseholdMember`, `ShoppingList`/`ShoppingItem`, `Expense`/`ExpenseSplit`, `Category`, `Bill`, `Budget`.

## Roadmap

Tracked as [GitHub issues](https://github.com/DpalaciosR20/cohabit/issues), prioritized with MoSCoW.

**MVP (must-have) — shipped:**

- [x] Auth & household creation/joining
- [x] Shared shopping list (real-time)
- [x] Expense tracking with flexible splits
- [x] Balance / "who owes who" view
- [x] Real-time sync

**Should-have:**

- [x] Editing/deleting expenses and shopping items — *surfaced by real usage, shipped ahead of the original backlog order*
- [x] Recurring bill reminders (rent, utilities, installment purchases)
- [ ] Settling up debts manually

See the issue tracker for the full `could-have` backlog (receipt scanning, notifications, savings goals, and more).
