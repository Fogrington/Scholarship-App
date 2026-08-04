# Confirmea (prototype)

The "Confirm Me" / Confirmea app — a last-minute booking marketplace for hair, beauty,
nails, waxing, and massage appointments. Built for the Winter Scholarship project with
Julia.

Now wired to the real `confirmea-backend` API instead of in-memory mock data — a
business approved in the admin panel actually shows up bookable here.

**This build is scoped to the average client user only.** Business and admin tooling
lives in the separate `confirmea-admin-app` web panel, not this mobile app.

## Running it

You need the backend running first (see `confirmea-backend/README.md`):

```bash
# in confirmea-backend/
npm install
cp .env.example .env
npm run seed
npm run dev      # http://localhost:4000
```

Then, **before running this app**, open `src/api/config.ts` and set `LAN_IP` to your
computer's actual network IP — Expo Go on your phone can't reach your computer via
`localhost`, since that means "the phone itself" from the phone's point of view.

```bash
# Mac:     ipconfig getifaddr en0
# Windows: ipconfig   (look for "IPv4 Address" under your Wi-Fi adapter)
```

Your phone and computer need to be on the same Wi-Fi network. Full details, including
the iOS Simulator / Android Emulator exceptions, are in the comments at the top of
`src/api/config.ts`.

Then:

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, same as before. Log in with the seeded customer
account — **fletch@example.com** / **password123** — or tap "New to Confirmea? Sign up"
to create a fresh account (it hits the real `/auth/register` endpoint).

## What's in here

- **Login screen**: real login/signup against the backend now, not a mock. Session
  persists across app restarts via `AsyncStorage`, so you don't have to log in every
  time. Rejects admin accounts client-side — those belong in the admin panel.
- **Discover tab**: fetches real listings from `GET /listings`, with loading and error
  states. Category filter and search still work the same as before, just filtering
  real data now instead of six hardcoded entries.
- **Booking flow**: tap a slot → detail screen → reserve. This now calls
  `POST /bookings` for real — the reservation is a row in the backend's SQLite
  database, not local state that resets on refresh. Payment still happens **in
  person** at the business; the app just advertises the price.
- **Bookings tab**: fetches `GET /bookings/mine`, so it reflects whatever's actually
  in the database for your account, including from previous sessions.

Color scheme is apricot (#F2A65A) and black (#1A1A1A) on a warm cream background, per
Julia's whimsical/friendly styling preference — unchanged.

## Project structure

```
src/
  api/           config.ts (backend URL — edit this), client.ts (fetch wrapper)
  context/       AuthContext (real login/session via AsyncStorage), BookingsContext
                 (fetches + posts real bookings)
  screens/       LoginScreen, HomeScreen, ListingDetailScreen, BookingsScreen,
                 ProfileScreen
  navigation/    RootNavigator — shows a loading spinner while checking for a saved
                 session, then gates Login vs the main tabs
  types.ts       shared types, matching the backend's JSON shapes field-for-field
  theme/         design tokens (apricot/black brand, shared with the admin panel)
```

## Next steps

- Real geolocation instead of the seeded `distanceKm` values
- A proper business registration flow that feeds into the admin panel's applications
  queue (right now businesses only get created via an approved application, seeded or
  entered manually)
- Push notifications for booking confirmations/reminders
- Consider a refresh token flow before this goes near production — same caveat as the
  admin panel's 7-day JWT
