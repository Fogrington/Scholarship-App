# Confirmea (prototype)

Frontend-only prototype for the "Confirm Me" / Confirmea app — a last-minute booking
marketplace for hair, beauty, nails, waxing, and massage appointments. Built for the
Winter Scholarship project with Julia.

This is UI only — all data is mocked in `src/data/mockData.ts`. No backend, no real
geolocation or payments yet.

## What's in here

- **Client app** (bottom tabs): Discover (browse + filter open slots by category,
  search), Bookings (upcoming bookings), Profile
- **Booking flow**: tap a slot -> detail screen -> confirm (no deposit, per the
  "Uber-style" model discussed)
- **Business dashboard**: toggle listing status, mark slots open/filled — reachable
  from Profile -> "Business dashboard" (prototype-only shortcut, no real auth split yet)
- **Admin approvals**: approve/reject pending business registrations (shows ABN +
  address per the verification requirement) — reachable from Profile -> "Admin
  approvals"

Color scheme is apricot (#F2A65A) and black (#1A1A1A) on a warm cream background,
per Julia's whimsical/friendly styling preference.

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

## Next steps (from the meeting notes)

- Swap mock listings for real geolocation-based data
- Build out the business registration intake form (ABN + address -> admin queue)
- Investigate integration with existing salon booking software
- Look into optional deposit/no-show fee handling via a third-party payment provider
- Split client/business/admin into proper authenticated roles instead of the
  Profile-screen shortcut used here for demo purposes
