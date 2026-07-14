# Confirmea (prototype)

Frontend-only prototype for the "Confirm Me" / Confirmea app — a last-minute booking
marketplace for hair, beauty, nails, waxing, and massage appointments. Built for the
Winter Scholarship project with Julia.

This is UI only — all data is mocked in `src/data/mockData.ts`. No backend and no real
geolocation yet. **This build is scoped to the average client user only.** Business and
admin tooling (registration approvals, business dashboards) is intentionally left out —
per Julia's steer, that will live in its own dedicated system, most likely a web-based
admin panel, not this mobile app.

## What's in here

- **Login screen**: sits in front of the app — no real backend auth yet, any
  email/password combination logs you in for demo purposes. Business/admin accounts
  won't authenticate here at all once that system exists.
- **Client app** (bottom tabs): Discover (browse + filter open slots by category,
  search), Bookings (live — updates as soon as you reserve a slot), Profile
- **Booking flow**: tap a slot -> detail screen -> reserve. Payment happens **in person**
  at the business, not through the app — the app just advertises the price so people
  know what to expect and shows a "pay at the business" badge instead of implying an
  online transaction.
- Reserving a slot on the detail screen now updates the Bookings tab immediately via
  shared app state (`src/context/BookingsContext.tsx`) — this was broken in the first
  pass and is fixed.
- Dropped the "in X minutes/hours" countdown on listings, since it wasn't backed by a
  real clock or timezone. Slot times are shown as-is (e.g. "Today, 4:30 PM"); once
  there's a real backend this can come back properly localised to Australian Eastern
  time.

Color scheme is apricot (#F2A65A) and black (#1A1A1A) on a warm cream background, per
Julia's whimsical/friendly styling preference.

## Running it on your phone with Expo Go

1. Install [Node.js](https://nodejs.org/) (LTS) if you don't have it.
2. Install [Expo Go](https://expo.dev/go) on your phone (App Store / Google Play).
3. In this folder, run:

   ```bash
   npm install
   npx expo start
   ```

4. Scan the QR code that appears with your phone's camera (iOS) or the Expo Go app
   (Android). Make sure your phone and computer are on the same Wi-Fi network.
5. Log in with anything (e.g. `test@test.com` / `password`) to reach the dashboard.

## Next steps (from the meeting notes)

- Swap mock listings for real geolocation-based data
- Build the actual authentication backend for the client login screen
- Design the separate business/admin web portal (registration intake with ABN +
  address verification, approvals queue, business dashboard for filling slots)
- Investigate integration with existing salon booking software
- Look into optional deposit/no-show fee handling if the in-person payment model ever
  needs a backstop
- If real-time slot timing comes back, make sure it's genuinely computed from a live
  clock in AEST rather than static mock data
