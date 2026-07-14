# Confirmea Admin

A proper web app now — Vite + React + TypeScript, with real client-side routing
(`react-router-dom`) instead of the earlier static HTML pages. Runs on a local dev
server just like any other web project, at `http://localhost:5173`.

This is still a **separate app from the Confirmea mobile prototype** — internal admin
tooling, not something end users touch. All data is mocked in `src/data/mockData.ts`.
No backend yet.

## Running it

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser. Log in with anything (e.g.
`test@test.com` / `password`) — there's no real backend yet, so any credentials work.

To build a static production bundle instead of running the dev server:

```bash
npm run build
npm run preview   # serves the built dist/ folder locally to sanity-check it
```

## How the auth gate works

- `/login` is a real route, not something you can scroll past.
- Everywhere else (`/overview`, `/applications`, `/complaints`, `/businesses`) is
  wrapped in a `<ProtectedRoute>` component — the same pattern you used for
  `ProtectedRoute.tsx` on CoachConnect. If there's no session, it redirects to
  `/login` via React Router's `<Navigate>`, and remembers where you were headed so
  you land back there after logging in.
- The session itself is stored in `localStorage` (`confirmea_admin_session`), so it
  survives a page refresh. Logging out clears it and sends you back to `/login`.
- This is still client-side only — there's no server verifying the session, so it's a
  UX-level gate, not real security. That comes with the real backend.

## What's in here

- **Overview** — stat cards (pending applications, open complaints, active
  businesses, approved all-time) plus a "needs review" queue and a recent activity
  feed that logs every approve / reject / resolve / dismiss action in the session.
- **Applications** — tabbed Pending / Approved / Rejected. Opening one shows a
  **review checklist** (ABN verified, address verified, contact verified) — approval
  is disabled until all three are ticked. Rejecting requires a written reason.
- **Complaints** — tabbed Open / Resolved / Dismissed, filed against the same
  businesses as the consumer app's mock listings, for continuity. Resolving or
  dismissing requires a written outcome note.
- **Businesses** — the live directory, flagging which ones have open complaints.

## Project structure

```
src/
  context/       AuthContext (session), AdminDataContext (applications/complaints/etc.)
  components/    ProtectedRoute, Drawer, Pill, EmptyState, Icons
  pages/         LoginPage, AdminLayout (sidebar shell), OverviewPage,
                 ApplicationsPage, ComplaintsPage, BusinessesPage,
                 ApplicationDrawer, ComplaintDrawer
  data/          mockData.ts — types + seed data
  theme.css      design tokens (apricot/black brand, shared across both apps)
```

## Next steps

- Swap the mock data + in-memory context for real API calls once there's a backend
- Replace the `localStorage` session with a real authenticated session/token
- Add role-based access if there end up being multiple admin permission levels
