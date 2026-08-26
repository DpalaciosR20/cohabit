# Cohabit

Cohabit is a shared home-management app for couples/roommates: a shared shopping list, expense tracking with flexible splits, real-time sync between household members, and monthly budgets.

Built as a learning project to practice full-stack engineering with an agile workflow — from product backlog to deployment — using modern, production-grade tooling.

## Status

🚧 In active development — MVP in progress.

## Tech stack

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** Next.js Route Handlers
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** Auth.js (NextAuth)
- **Realtime:** Supabase Realtime / WebSockets
- **Testing:** Vitest + React Testing Library
- **Hosting:** Vercel (app) + Prisma Postgres / Neon (database)

## Getting started

```bash
npm install
npx prisma dev        # starts a local Postgres instance
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Data model

See [`prisma/schema.prisma`](prisma/schema.prisma) for the full schema: `User`, `Household`, `HouseholdMember`, `ShoppingList`/`ShoppingItem`, `Expense`/`ExpenseSplit`, `Category`, `Budget`.

## Roadmap

MVP scope, tracked as GitHub issues:

- [ ] Auth & household creation/joining
- [ ] Shared shopping list (real-time)
- [ ] Expense tracking with flexible splits
- [ ] Balance / "who owes who" view
- [ ] Monthly budgets per category
