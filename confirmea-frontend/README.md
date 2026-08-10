# Confirmea (prototype)

The "Confirm Me" / Confirmea app — a last-minute booking marketplace for hair, beauty,
nails, waxing, and massage appointments. Built for the Winter Scholarship project with
Julia.

Wired to the real `confirmea-backend` API. Now supports **two account types in one
app**: customers browsing and booking slots, and businesses managing their own open
slots and bookings — the app shows a completely different dashboard depending on
which kind of account you log in with.

Admin/moderation tooling still lives in the separate `confirmea-admin-app` web panel,
not this app.

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

Your phone and computer need to be on the same Wi-Fi network.

Then:

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, same as always.

## Logging in as each account type

- **Customer:** `fletch@example.com` / `password123`, or tap "Sign up" to register a
  new one (self-registration always creates a customer account). Fletch has a
  completed, unreviewed booking seeded — logging in as him triggers the "rate your
  visit" star prompt immediately, a ready demo of that flow.
- **Business:** `barebeautybar@confirmea.app` / `business123`, or
  `saltandco@confirmea.app` / `business123`. Business accounts aren't self-serve —
  they're created by an admin (via the backend's `POST /businesses/:id/account`, seeded
  for these two for demo purposes). Logging in with one goes straight to the business
  dashboard instead of the customer Discover screen.

## What's in here

### Customer side
- **Discover tab**: real listings from `GET /listings`, filter by category, search.
  Refetches every time you come back to this screen (not just on first load), so a
  slot that just filled up — here or from another customer — disappears instead of
  lingering from a stale fetch. Slots with only 1-2 spots left on a multi-spot listing
  show a "spots left" callout. Ratings are real now — aggregated live from actual
  reviews of the business, not static seed numbers. A business with no reviews yet
  shows "New — no reviews yet" instead of a fake star count.
- **Location bias**: tap the suburb name under the greeting ("Newcastle, NSW ▾") to
  pick from 8 real Newcastle-area suburbs. This isn't live GPS — it's a manual
  location picker — but the distances and closest-first sorting behind it are real:
  the backend computes actual haversine distance between the selected suburb's
  coordinates and each business's, and sorts accordingly. Picking a suburb refetches
  Discover immediately.
- **Booking flow**: reserve a slot for real via `POST /bookings`. Payment still happens
  in person. If two people go for the last spot on a slot at the same moment, the
  server (not just the UI) decides who gets it — the other gets a clear "just filled
  up" message instead of a phantom booking.
- **Bookings tab**: `GET /bookings/mine`.
- **Review prompt**: after a business marks you arrived, your next login shows a
  lightweight modal — "How was your visit?" with five tappable stars. One review per
  completed booking; the backend rejects a second attempt. Tapping "Not now" dismisses
  it for that session only — you'll be asked again next time you log in. This modal
  lives above the whole app (a real `Modal`, not a screen), so it shows up regardless
  of which tab you land on after login.

### Business side
- **Slots tab**: every open slot this business has posted, with a live "X of Y spots
  booked" count and a distinct **Full** badge once it hits capacity (separate from
  **Closed**, which is the business manually pulling it down). Tap **+** to post a new
  one — service, category, price, optional discount, a **day/time picker** (Today or
  Tomorrow, half-hour slots from 8:00 AM to 9:00 PM) instead of free text, and a
  **capacity stepper** for how many customers can accept it. Once that many have
  booked, it stops showing up on Discover automatically. Tap "Close this slot" to pull
  it down early without losing its booking history.
- **Bookings tab**: every customer who's booked one of this business's slots, with
  their name, email, and which service/time they booked. Tap "Mark arrived" once
  they've shown up — this closes the booking out as `Completed`.
- **Profile tab**: shared with the customer version, shows business info and logout
  instead of customer account info.

Every business-side write is scoped server-side to the logged-in business's own data —
one business can never see or touch another's bookings or listings, even by guessing
IDs. Verified directly against the API before this was wired into the UI.

### A note on confirmations

Logout, "close this slot", and "mark arrived" all use a custom `ConfirmModal`
component now, not `Alert.alert` with multiple buttons. `Alert.alert`'s multi-button
behavior doesn't translate reliably to React Native Web — it falls back to
`window.confirm()`, which doesn't map cleanly onto per-button callbacks, and was the
cause of "the logout button doesn't work" on the web preview. `ConfirmModal` is a real
React Native `Modal`, so it behaves identically on web, iOS, and Android since it's
our own component rather than a platform-specific bridge.

Color scheme is apricot (#F2A65A) and black (#1A1A1A) on a warm cream background, per
Julia's whimsical/friendly styling preference — unchanged.

## Project structure

```
src/
  api/           config.ts (backend URL — edit this), client.ts (fetch wrapper)
  context/       AuthContext (login/session, now role-aware), BookingsContext
                 (customer bookings), BusinessContext (business listings + bookings),
                 ReviewsContext (pending reviews + submitting a rating)
  components/    ServiceCard, CategoryPill, Badge, ReviewPromptModal, ConfirmModal,
                 LocationPickerModal
  screens/       LoginScreen, HomeScreen, ListingDetailScreen, BookingsScreen,
                 ProfileScreen (shared), BusinessSlotsScreen, AddSlotScreen,
                 BusinessBookingsScreen
  navigation/    RootNavigator — branches into ClientTabs or BusinessTabs by role,
                 after a loading state while checking for a saved session
  types.ts       shared types, matching the backend's JSON shapes field-for-field
  theme/         design tokens (apricot/black brand, shared with the admin panel)
```

## Next steps

- Let a customer see or edit a review they've already left (currently write-once,
  no way to view your own review history in the app)
- Show the business's rating on their own Profile tab — the backend's
  `GET /business/profile` already returns `rating`/`reviewCount`, just not surfaced
  in the UI yet
- Real geolocation instead of the seeded `distanceKm` values
- Push notifications — e.g. notify a business when a slot gets booked, or a customer
  when their business marks them arrived
- Let a business edit an existing slot (including capacity) instead of only closing
  and re-posting
- A real calendar/date picker if slots ever need to go beyond "Today"/"Tomorrow" —
  the current day+time chip picker is deliberately scoped to a last-minute app
- Consider a refresh token flow before this goes near production — same caveat as
  everywhere else in this project: the current 7-day JWT expiry is fine for a
  prototype, not for real use
