# WRS

Water refilling station app. npm-workspaces monorepo:

- `contract/` — `@wrs/contract`, shared zod schemas and types (`.ts` source, no build step)
- `api/` — Fastify + Knex + MySQL
- `ui/` — Vue 3 + Vite

## Requirements

- Node 24 (`nvm use`)
- Docker Desktop (MySQL runs in `api/compose.yaml`)

## Setup

```sh
npm install
npm run setup   # creates api/.env and ui/.env, generates JWT_SECRET
docker compose -f api/compose.yaml up -d --wait db
npm run migrate
npm run seed
npm run dev     # api + ui together
```

## Scripts (run from the repo root)

| Script | What it does |
| --- | --- |
| `npm run dev` | api (`serve`) and ui dev server in parallel |
| `npm run serve` | MySQL up, migrate, api in watch mode |
| `npm run migrate` | latest migrations |
| `npm run seed` | run seeds |
| `npm run db:reset` | roll back all migrations, migrate, seed (the running api keeps serving) |
| `npm run type-check` | type-check every workspace |
| `npm run lint` | lint every workspace |
| `npm run build` | build the ui |
| `npm run db:scratch -w api -- wrs_scratch_<name> [--seed] [--init-only]` | throwaway database for experiments |
| `npm run db:scratch:drop -w api -- wrs_scratch_<name>` | drop it |

The api `Dockerfile` and the compose `api` profile do not build from a workspace subfolder yet.

## Logins

Every seeded account uses the shared dev password `wrs12345`.

| Username | Name | Roles |
| --- | --- | --- |
| `owner` | Demo Owner | owner, cashier, rider, washer, helper |
| `cashier` | Ligaya Santos | cashier |
| `rider1` | Mario Cruz | rider |
| `rider2` | Ramil Bautista | rider |
| `washer` | Boyet Reyes | washer |
| `helper` | Fernando Dela Cruz | helper |
| `multi` | Corazon Villanueva | cashier, rider |
