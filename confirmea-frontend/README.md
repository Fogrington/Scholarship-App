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

**To run the web preview instead** (e.g. for screen-sharing on a call):
```bash
npx expo start --web
```
`react-dom` and `react-native-web` are already in `package.json`, so this should
work out of the box. Remember the Explore tab's map won't render on web — see the
note about it below — everything else works the same as on a phone.

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

- **App icon, splash screen, and Android adaptive icon** are set now (`app.json` +
  `assets/`) — no more default Expo placeholder icon on your home screen. All three
  are generated from the same brand mark (apricot circle, black checkmark) used
  throughout the app and admin panel, for a consistent identity everywhere Confirmea
  shows up.
- **Actionable empty states have a prominent CTA now**, not just a small icon in a
  corner: the business Slots tab's empty state has a big "Post your first slot"
  button (not just the small **+** in the header), and the customer Bookings tab's
  empty state has a "Browse open slots" button that jumps straight to Discover.
  Empty states with nothing the user can directly act on (like the business
  Bookings tab, which depends on customers booking) are left as plain informational
  text.

### Customer side
- **Discover tab is business-first now**, not listing-first: one card per business
  that currently has at least one open offer, from the new
  `GET /businesses/with-offers`, instead of one card per individual slot. Businesses
  routinely have more than one open offer at a time across different services, so
  advertising each slot separately on the main list was noisy and repetitive — tap a
  business card to see everything it currently has open. Category pills filter by
  what the business specializes in (its own `category`), not by whichever specific
  service happens to be open right now.
- **Business detail screen** (new): tapping a business shows its info (photo,
  category, rating, address) and a list of every one of its currently open offers.
  Tap an offer to go to the same booking flow as before.
- **Cartoon illustrations, not photos**: each category (Hair, Nails, Beauty, Waxing,
  Massage) gets a simple flat illustration instead of the earlier hotlinked stock
  photos — no network dependency to show them, and matches the "keep it simple for
  the prototype" brief. See `src/data/categoryIllustrations.ts` and
  `assets/illustrations/`.
- **Location is remembered now**: picking a suburb persists via `AsyncStorage`
  (`src/context/LocationContext.tsx`), so you don't have to re-pick it every time you
  open the app. Still a manual suburb picker, not live GPS, but the distances and
  closest-first sorting behind it are real — the backend computes actual haversine
  distance between the selected suburb's coordinates and each business's.
- **Explore tab** (new): a map of Newcastle with a pin for every business that
  currently has an open offer. Tap a pin's callout to jump straight to that
  business's detail screen — same screen as tapping a Discover card, just reached a
  different way. **On the web preview this shows a list instead of a map** (with a
  banner explaining why) — `react-native-maps` has no web support, and Metro can't
  bundle its native internals for web even behind a runtime check, so the split
  happens at the file level: `src/components/BusinessMap.native.tsx` (the real map,
  iOS/Android only) vs `src/components/BusinessMap.tsx` (the web fallback list).
  Metro picks the right one automatically per platform.
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
- **Requests tab** (new): can't find an open slot that suits you? Post what you're
  after — a category and an optional note — and businesses that specialize in it can
  see your request and offer you a slot directly. One active request at a time; a big
  "I'm looking for a service" button when you don't have one, a status card when you
  do. When a business offers you something, a modal alert pops up ("You've got an
  offer!") the same way the review prompt does — Accept confirms the booking, Decline
  asks a follow-up question: keep your request open for other businesses to try, or
  take it down.

### Business side
- **Requests tab** (new): open requests from customers looking for this business's
  specialty, oldest first — the customer who's been waiting longest shows up first,
  tagged "Longest waiting". Tap one to fill out an offer (service, price, optional
  discount, the same day/time picker used for posting a regular slot) and send it —
  the customer gets the alert immediately (well, next time they open the app; there's
  no push notification infrastructure yet, see Next steps). This offer is private —
  it never shows up on public Discover, only to the one customer it was made for.

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

### Customer ratings (Uber-style) and no-shows

Marking a booking now has two outcomes, not one: "Mark arrived" (unchanged) or the
new "No-show" — both close the booking out, just with a different status. After
either, a lightweight star-rating prompt (`RateCustomerModal`) lets the business
rate the customer 1-5, optional and skippable. It's the mirror of the customer
review system: one rating per booking, aggregated per customer. A customer's
aggregate shows up on the business's Bookings tab next to their name, and on the
customer's own Profile tab ("No ratings from businesses yet" until they have one —
Fletch is seeded with a 5-star rating for the demo). Ratings persist even for
bookings that haven't individually been rated — the aggregate follows the customer
across all their history with any business, not just one.

### Complaints and app feedback

Two entry points, one shared `ComplaintModal` component: "Report an issue" on a
business's detail screen (pre-filled with that business), and "Send feedback about
Confirmea" on the customer Profile tab (no business attached). Both post to the
same `POST /complaints` endpoint with a `type` field, and both land in the admin
panel's Complaints tab together — the admin panel now has a type filter
("All types" / "Business complaints" / "App feedback") alongside the existing
open/resolved/dismissed tabs. The complainant's name is always the logged-in
user's own name, taken server-side — never something the client can spoof.

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
                 ReviewsContext (pending reviews + submitting a rating),
                 LocationContext (persisted suburb selection), RequestsContext
                 (customer's own request + pending offer)
  components/    ServiceCard, CategoryPill, Badge, BusinessCard, ReviewPromptModal,
                 OfferPromptModal, ConfirmModal, LocationPickerModal,
                 CreateRequestModal, BusinessMap.tsx (web fallback list) +
                 BusinessMap.native.tsx (real map — Metro picks per platform)
  screens/       LoginScreen, HomeScreen (Discover, business-first), ExploreScreen
                 (map/list of businesses), BusinessDetailScreen (a business's open
                 offers), ListingDetailScreen (booking flow), BookingsScreen,
                 RequestsScreen (customer), ProfileScreen (shared), BusinessSlotsScreen,
                 AddSlotScreen, BusinessBookingsScreen, BusinessRequestsScreen,
                 MakeOfferScreen
  navigation/    RootNavigator — branches into ClientTabs or BusinessTabs by role;
                 Home, Explore, and the business Requests tab each have their own
                 stack so BusinessDetail/ListingDetail/MakeOffer keep separate
                 back-histories per tab
  data/          categoryIllustrations.ts (local cartoon art)
  utils/         formatDateTime.ts — turns SQLite timestamps into readable local time
  types.ts       shared types, matching the backend's JSON shapes field-for-field
  theme/         design tokens (apricot/black brand, shared with the admin panel)
```

## Next steps

- Let a customer see or edit a review they've already left (currently write-once,
  no way to view your own review history in the app)
- Show the business's rating on their own Profile tab — the backend's
  `GET /business/profile` already returns `rating`/`reviewCount`, just not surfaced
  in the UI yet
- Real GPS instead of the manual suburb picker — the distance math and sorting are
  already real, this would just mean plugging in `expo-location` instead of a fixed
  suburb list, if that's ever worth the added permission-prompt complexity
- Push notifications — this matters more now that requests exist: right now a
  business only sees "you have an offer" when they next open the app, not the moment
  it happens. Real push notifications (or at least a badge count) would make the
  whole request/offer loop feel much more "last-minute"
- Let a business edit an existing slot (including capacity) instead of only closing
  and re-posting
- A real calendar/date picker if slots ever need to go beyond "Today"/"Tomorrow" —
  the current day+time chip picker is deliberately scoped to a last-minute app
- Consider a refresh token flow before this goes near production — same caveat as
  everywhere else in this project: the current 7-day JWT expiry is fine for a
  prototype, not for real use
- Real per-business photos once businesses can upload their own — right now every
  business of the same category shares one cartoon illustration (see
  `src/data/categoryIllustrations.ts`), which is fine for a demo but obviously not
  something real businesses would want long-term
- The Explore map is view-only right now (tap a pin's callout to open the business).
  Clustering pins when zoomed out, or a "search this area" button, would help once
  there are enough businesses that pins start overlapping
- A business currently can't see the outcome of an offer they've already sent
  (accepted/declined/still pending) except by checking their Bookings tab — a
  dedicated "sent offers" view might be worth adding if that becomes a common need
