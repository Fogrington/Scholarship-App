# Confirmea Backend

The real API for Confirmea — Express + TypeScript + SQLite (via `better-sqlite3`), no
external services required. Both the mobile app (`confirmea`) and the admin panel
(`confirmea-admin-app`) talk to this instead of holding their own mock data.

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
- **Admin:** `admin@confirmea.app` / `admin123` — the web admin panel
- **Customer:** `fletch@example.com` / `password123` — the mobile app. Has one
  completed, unreviewed booking, so logging in immediately triggers the "rate your
  visit" star-rating prompt — a ready-made demo of that flow.
- **Business:** `barebeautybar@confirmea.app` / `business123` and
  `saltandco@confirmea.app` / `business123` — also the mobile app, but lands on the
  business dashboard instead of the customer screens. Both are Hair category, and
  there's one seeded open Hair request (from Maya Chen, one of the dummy reviewer
  accounts below) — log in as either and check the Requests tab for a ready-made demo
  of the "looking for a service" flow. Salt & Co also has an `Upcoming` booking ready
  to mark arrived/no-show and rate the customer on, for demoing that flow live.
- **Dummy reviewers:** `reviewer1@confirmea.app` through `reviewer10@confirmea.app`,
  all `reviewer123` — not meant to be logged into during a demo, just the accounts
  behind the fabricated review history that gives each business a realistic rating.
  Every dummy review is attached to a real (fabricated) completed booking, not a
  free-floating number.

To wipe and start fresh, just delete the `data/` folder and run `npm run seed` again.
Do this any time you pull schema changes — SQLite won't add new columns to an existing
file on its own.

## How auth works

Stateless JWTs. Log in to get a token back, then send it on every subsequent request:

```
Authorization: Bearer <token>
```

Tokens carry a `role` (`customer`, `admin`, or `business`) and, for business accounts,
a `businessId`. Routes are locked down with `requireAuth` / `requireRole(...)`
middleware. Every `/business/*` route trusts `businessId` from the verified token
only — never from anything the client sends — so one business account can't act on
another's data even by guessing IDs.

Public self-registration (`POST /auth/register`) only ever creates `customer`
accounts. Admin and business accounts are created deliberately — admin accounts are
seeded, business accounts via the admin-only `POST /businesses/:id/account`.

## API reference

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | `{ email, password, name }` returns `{ token, user }`. Always creates a `customer`. |
| POST | `/auth/login` | — | `{ email, password }` returns `{ token, user }`. For business accounts, `user` also includes `businessId` and `businessName`. |
| GET | `/auth/me` | any | Current user from the token |

### Applications (business sign-ups)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/applications` | — | Submit a new application (public — no account needed to apply) |
| GET | `/applications` | admin | List all, optional `?status=pending` (or approved / rejected) |
| GET | `/applications/:id` | admin | One application |
| PATCH | `/applications/:id/checklist` | admin | `{ key: "abn" or "address" or "contact", value: boolean }` |
| PATCH | `/applications/:id/approve` | admin | `{ notes? }`. 400 unless all three checklist items are true. Creates the live `business` row. |
| PATCH | `/applications/:id/reject` | admin | `{ notes?, reason }` — `reason` required |

### Businesses
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/businesses` | — | Public directory (consumer app). Includes `rating` (null until the business has at least one review) and `reviewCount`, aggregated live from the `reviews` table. |
| GET | `/businesses/with-offers` | — | Businesses that currently have at least one open, bookable listing — this is what Discover and the Explore map actually browse (business-first, not listing-first). Optional `?category=Hair` (filters by the *business's* own specialty, not any one listing's category), `?search=...`, and `?lat=&lng=` for a real `distanceKm` and closest-first sort. Each result includes `openOffers`, the count of currently bookable listings. |
| GET | `/businesses/admin` | admin | Same as `/businesses`, plus an `openComplaints` count per business |
| GET | `/businesses/:id` | — | One business |
| POST | `/businesses/:id/account` | admin | `{ email, password, name }` — creates a business login tied to this business |

### Listings (bookable slots)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/listings` | — | `?category=Hair`, `?businessId=3` (all of one business's open offers — this is what the business detail screen uses), `?search=...`, and/or `?lat=&lng=`. Only returns slots that are active **and** not yet full. When `lat`/`lng` are given, each result gets a real `distanceKm` computed against the business's coordinates, and results are sorted closest-first. |
| GET | `/listings/:id` | — | One listing, regardless of fullness — includes `capacity`, `remainingSpots`, `isFull`, and the same optional `?lat=&lng=` distance behavior |
| POST | `/listings` | admin | Create a listing under any business, `capacity` optional (defaults to 1) |

### Bookings (customer side)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/bookings` | customer | `{ listingId }` — no payment info, that's handled in person. Returns 409 if the slot filled up between the customer loading the list and booking (enforced server-side inside a transaction, not just hidden by the UI). |
| GET | `/bookings/mine` | customer | The logged-in customer's bookings |
| GET | `/bookings/pending-review` | customer | Completed bookings with no review yet — the mobile app prompts a star rating for these after login |
| POST | `/bookings/:id/review` | customer | `{ rating: 1-5 }` — one review per booking, enforced by a UNIQUE constraint plus an explicit check. 400 unless the booking is `Completed`, 409 if already reviewed. |
| GET | `/bookings/pending-offer` | customer | A business's offer against the customer's open request, still awaiting yes/no — the mobile app alerts on this after login |
| POST | `/bookings/:id/respond` | customer | `{ accept: boolean, keepRequestOpen?: boolean }` — accept confirms the booking and closes the request as `matched`. Decline needs `keepRequestOpen` to decide whether the request goes back to `open` or closes as `withdrawn`. |

### Requests ("looking for a service")
A customer posts an open call for a category; businesses that specialize in it see
the request (oldest first) and can offer a slot. One active (`open` or `offered`)
request per customer at a time.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/requests` | customer | `{ category, note? }`. 409 if the customer already has an active request. |
| GET | `/requests/mine` | customer | The customer's current active request, or `null` |
| PATCH | `/requests/:id/withdraw` | customer | Takes down an `open` request. Once a business has offered, resolve it via `POST /bookings/:id/respond` instead. |
| GET | `/requests/open` | business | Open requests matching this business's own category, oldest first |
| POST | `/requests/:id/offer` | business | `{ service, price, discountPercent?, slotTime }` — creates a private, 1-capacity listing plus a booking in `Offered` status, and flips the request to `offered` (hiding it from every other business immediately, not just this one — verified against two separate business logins). 409 if the request isn't open anymore, 403 if the category doesn't match. |

### Business dashboard (business side)
Every route here uses the `businessId` embedded in the logged-in business's token —
never a value from the request.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/business/profile` | business | This account's business record |
| GET | `/business/listings` | business | All of this business's listings (active and closed), each with an `upcomingBookings` count |
| POST | `/business/listings` | business | `{ service, category, price, discountPercent?, slotTime, capacity }` — posts a new open slot. `capacity` is required — how many customers can accept it before it stops showing up publicly. |
| PATCH | `/business/listings/:id/close` | business | Sets `isActive: false` — stops it showing up publicly, keeps booking history. 403 if it's not this business's listing. |
| GET | `/business/bookings` | business | Every booking against this business's listings, with customer name/email, optional `?status=Upcoming`. Includes `Offered` bookings too. Each customer also has `rating`/`reviewCount` — their aggregate rating from *all* businesses, not just this one — and a `canRateCustomer` flag (true once attendance is recorded and this specific booking hasn't been rated yet). |
| PATCH | `/business/bookings/:id/arrived` | business | Marks a booking `Completed`. 403 if it's not this business's booking, 400 if it's not `Upcoming`. |
| PATCH | `/business/bookings/:id/no-show` | business | Marks a booking `NoShow` instead — same checks as `/arrived`. |
| POST | `/business/bookings/:id/rate-customer` | business | `{ rating: 1-5 }` — rate the customer, the reverse of a customer reviewing a business. Only allowed once attendance is recorded (`Completed` or `NoShow`), one rating per booking (409 if already rated). |

### Complaints (business complaints + app feedback)
Both types land in the same admin inbox. `complainant_name` always comes from the
logged-in user's own account — never trusted from the request body, so no one can
file on behalf of someone else.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/complaints` | any logged-in user | `{ type: 'business', businessId, category, details }` to complain about a business, or `{ type: 'app', category, details }` for feedback about Confirmea itself |
| GET | `/complaints` | admin | Optional `?status=open` (or resolved/dismissed) and/or `?type=business` (or app) |
| PATCH | `/complaints/:id/resolve` | admin | `{ notes?, resolution }` — `resolution` required |
| PATCH | `/complaints/:id/dismiss` | admin | Same shape as resolve |

All error responses look like `{ "error": "message" }` (validation errors also include
a `details` field from Zod).

## Project structure

```
src/
  db/
    schema.sql     table definitions
    index.ts       opens the SQLite file, applies schema.sql
    seed.ts        starter data (npm run seed)
  routes/
    auth.routes.ts          register / login / me
    applications.routes.ts  admin review queue
    businesses.routes.ts    public directory + admin view + account creation
    listings.routes.ts      public browsing + admin creation
    bookings.routes.ts      customer booking flow
    business.routes.ts      business dashboard (own listings + bookings)
    complaints.routes.ts    admin complaint review
  middleware/      requireAuth, requireRole, error handler
  utils/           password hashing, JWT sign/verify, async route wrapper, haversine
                   distance calculation (geo.ts)
  types.ts         shared TypeScript types for DB rows
  server.ts        Express app + route wiring
```

## Notes

- SQLite is genuinely fine for a four-week prototype and even small real usage — no
  separate database server to run. If you ever outgrow it, the SQL is close enough to
  Postgres that migrating later isn't a rewrite.
- `JWT_SECRET` in `.env.example` is a placeholder — change it before this touches
  anything beyond your own machine.
- The admin panel's Businesses page can create a business login directly now — click
  a business with "no login" to open the create-account form. Still no reset/edit
  flow for an existing login.
- Ratings are deliberately not editable or deletable once submitted — there's no
  "update my review" endpoint yet. A customer gets exactly one shot per completed
  booking, which is enough for the prototype but worth revisiting for real use.
- Location is suburb selection, not real GPS tracking — the mobile app has a fixed
  list of Newcastle suburbs with real coordinates (`NEWCASTLE_SUBURBS` in its
  `types.ts`), and businesses have real coordinates too (their suburb's centroid, not
  a surveyed address point). Distance is a genuine haversine calculation between the
  two, not a fake number — it's just not driven by the device's actual location.
