# Confirmea Backend

A real API for Confirmea — Express + TypeScript + SQLite (via `better-sqlite3`), no
external services required. This replaces the mock data currently sitting separately
in the mobile app and the admin panel with one shared source of truth.

Runs entirely on your machine at `http://localhost:4000`. The database is a single
file (`data/confirmea.db`) — easy to inspect, easy to delete and start over.

## Setup

```bash
npm install
cp .env.example .env
npm run seed   # creates the SQLite file and populates starter data
npm run dev    # starts the API on http://localhost:4000 with auto-reload
```

Seeded logins:
- **Admin:** `admin@confirmea.app` / `admin123`
- **Customer:** `fletch@example.com` / `password123`

To wipe and start fresh, just delete the `data/` folder and run `npm run seed` again.

## How auth works

Stateless JWTs. Log in or register to get a token back, then send it on every
subsequent request:

```
Authorization: Bearer <token>
```

Tokens carry a `role` (`customer` or `admin`), and routes are locked down with
`requireAuth` / `requireRole("admin")` middleware. This is what both frontends should
switch to instead of their current mock login.

## API reference

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | `{ email, password, name, role? }` returns `{ token, user }`. `role` defaults to `customer`. |
| POST | `/auth/login` | — | `{ email, password }` returns `{ token, user }` |
| GET | `/auth/me` | any | Current user from the token |

### Applications (business sign-ups)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/applications` | — | Submit a new application (public — a business doesn't need an account to apply) |
| GET | `/applications` | admin | List all, optional `?status=pending` (or approved / rejected) |
| GET | `/applications/:id` | admin | One application |
| PATCH | `/applications/:id/checklist` | admin | `{ key: "abn" | "address" | "contact", value: boolean }` |
| PATCH | `/applications/:id/approve` | admin | `{ notes? }`. Fails with 400 unless all three checklist items are true. Creates the live `business` row. |
| PATCH | `/applications/:id/reject` | admin | `{ notes?, reason }` — `reason` is required |

### Businesses
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/businesses` | — | Public directory (for the consumer app) |
| GET | `/businesses/admin` | admin | Same, plus an `openComplaints` count per business |
| GET | `/businesses/:id` | — | One business |

### Listings (bookable slots)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/listings` | — | `?category=Hair` and/or `?search=...` |
| GET | `/listings/:id` | — | One listing |
| POST | `/listings` | admin | Create a listing under a business (business self-service comes later) |

### Bookings
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/bookings` | customer | `{ listingId }` — no payment info, that's handled in person |
| GET | `/bookings/mine` | customer | The logged-in customer's bookings |

### Complaints
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/complaints` | any logged-in user | `{ businessId, category, complainantName, details }` |
| GET | `/complaints` | admin | Optional `?status=open` (or resolved / dismissed) |
| PATCH | `/complaints/:id/resolve` | admin | `{ notes?, resolution }` — `resolution` required |
| PATCH | `/complaints/:id/dismiss` | admin | Same shape as resolve |

All error responses look like `{ "error": "message" }` (validation errors also include
a `details` field from Zod).

## Wiring up the two frontends

Neither frontend talks to this yet — that's the next step. Rough plan:

1. **Admin panel** (`confirmea-admin-app`): swap `AuthContext`'s fake login for a real
   `POST /auth/login` call, and swap `AdminDataContext`'s in-memory state for `fetch`
   calls to `/applications`, `/complaints`, `/businesses/admin`.
2. **Mobile app** (`confirmea` Expo project): same idea — `AuthContext` calls
   `/auth/login` / `/auth/register`, `HomeScreen` fetches `/listings`, and
   `BookingsContext` calls `POST /bookings` and `GET /bookings/mine` instead of
   holding everything in React state.
3. Point both at `http://localhost:4000` for local dev (the Expo app on a physical
   phone will need your computer's LAN IP instead of `localhost` — Expo will warn you
   about this).

## Project structure

```
src/
  db/
    schema.sql     table definitions
    index.ts       opens the SQLite file, applies schema.sql
    seed.ts        starter data (npm run seed)
  routes/          one file per resource
  middleware/      requireAuth, requireRole, error handler
  utils/           password hashing, JWT sign/verify, async route wrapper
  types.ts         shared TypeScript types for DB rows
  server.ts        Express app + route wiring
```

## Notes

- SQLite is genuinely fine for a four-week prototype and even small real usage — no
  separate database server to run. If you ever outgrow it, the SQL is close enough to
  Postgres that migrating later isn't a rewrite.
- `JWT_SECRET` in `.env.example` is a placeholder — change it before this touches
  anything beyond your own machine.
