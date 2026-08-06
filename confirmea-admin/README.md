# Confirmea Admin

Vite + React + TypeScript, with real client-side routing (`react-router-dom`). Now
wired to the real `confirmea-backend` API instead of in-memory mock data — this is the
first piece of Confirmea where the frontend and backend actually talk to each other.

This is still a **separate app from the Confirmea mobile prototype** — internal admin
tooling, not something end users touch.

## Running it

You need the backend running first (see `confirmea-backend/README.md`):

```bash
# in confirmea-backend/
npm install
cp .env.example .env
npm run seed
npm run dev      # http://localhost:4000
```

Then, in this project:

```bash
npm install
cp .env.example .env
npm run dev       # http://localhost:5173
```

Log in with the seeded admin account: **admin@confirmea.app** / **admin123**.

`.env` just points at the backend:
```
VITE_API_BASE_URL=http://localhost:4000
```
Change that if you ever run the backend somewhere other than `localhost:4000`.

To build a static production bundle instead of running the dev server:

```bash
npm run build
npm run preview   # serves the built dist/ folder locally to sanity-check it
```

## How the auth gate works

- `/login` is a real route, not something you can scroll past.
- Everywhere else (`/overview`, `/applications`, `/complaints`, `/businesses`) is
  wrapped in a `<ProtectedRoute>` component — same pattern as `ProtectedRoute.tsx` on
  CoachConnect. No session → redirected to `/login` via `<Navigate>`, remembering
  where you were headed so you land back there after logging in.
- Logging in calls the real `POST /auth/login`. The JWT and user info come back from
  the backend and get stored in `localStorage`; every subsequent API call sends the
  token as `Authorization: Bearer <token>`.
- The login page also rejects non-admin accounts client-side — if a `customer`-role
  account somehow tries to log in here, it's turned away, since this panel is
  admin-only.
- This is real auth now (the backend actually validates the password and signs the
  token), not just a UX-level gate like the earlier static-HTML version.

## What's in here

- **Overview** — stat cards (pending applications, open complaints, active
  businesses) plus a "needs review" queue and a recent activity feed. The activity
  feed is still session-only — the backend doesn't have an audit-log endpoint yet, so
  it resets on refresh; everything else is real.
- **Applications** — tabbed Pending / Approved / Rejected, pulled from
  `GET /applications`. Opening one shows the **review checklist** (ABN verified,
  address verified, contact verified) — each checkbox is a live
  `PATCH /applications/:id/checklist` call. Approval is disabled until all three are
  ticked, and the backend enforces that too (rejects with a 400 if you somehow bypass
  the UI). Rejecting requires a written reason.
- **Complaints** — tabbed Open / Resolved / Dismissed, from `GET /complaints`.
  Resolving or dismissing requires a written outcome note and hits
  `PATCH /complaints/:id/resolve` or `/dismiss`.
- **Businesses** — from `GET /businesses/admin`, which includes a server-computed
  open-complaints count per business, plus whether it already has a mobile-app login
  (`accountEmail`). Click a business to open its drawer: businesses with no login show
  a create-account form (name, email, temporary password) that calls
  `POST /businesses/:id/account`; businesses that already have one show it read-only.
  There's no reset/edit flow yet — the password has to be shared with the business
  directly.

## Project structure

```
src/
  api/           client.ts — small fetch wrapper, attaches the Bearer token
  context/       AuthContext (real login/session), AdminDataContext (fetches +
                 mutates real applications/complaints/businesses, plus business
                 account creation)
  components/    ProtectedRoute, Drawer, Pill, EmptyState, Icons
  pages/         LoginPage, AdminLayout (sidebar shell), OverviewPage,
                 ApplicationsPage, ComplaintsPage, BusinessesPage,
                 ApplicationDrawer, ComplaintDrawer, BusinessAccountDrawer
  utils/         formatDateTime.ts — turns SQLite timestamps into readable local time
  types.ts       shared types, matching the backend's JSON shapes field-for-field
  theme.css      design tokens (apricot/black brand, shared across both apps)
```

## Next steps

- Wire up the mobile app (`confirmea` Expo project) the same way — same backend,
  same token pattern, just customer-role endpoints (`/listings`, `/bookings`) instead
  of admin ones. **Done** — see the `confirmea` project's README.
- Add a real audit-log endpoint on the backend so the activity feed survives a
  refresh instead of being session-only.
- Consider short-lived tokens + a refresh flow before this goes anywhere near
  production; the current 7-day JWT expiry is fine for a prototype, not for real use.
