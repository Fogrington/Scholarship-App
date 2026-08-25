-- Confirmea database schema.
-- SQLite via better-sqlite3. Booleans are stored as 0/1 integers (SQLite has no bool type).

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin', 'business')) DEFAULT 'customer',
  -- Only set when role = 'business': which business this login manages.
  business_id INTEGER REFERENCES businesses(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A business's submission to join the marketplace. Reviewed by an admin.
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  abn TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  checklist_abn INTEGER NOT NULL DEFAULT 0,
  checklist_address INTEGER NOT NULL DEFAULT 0,
  checklist_contact INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  decision_reason TEXT NOT NULL DEFAULT '',
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT
);

-- Created once an application is approved. This is what shows up in the consumer app.
CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER REFERENCES applications(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  -- Used to compute real distance from a customer's selected suburb. Nullable so a
  -- business can exist before its location is known.
  latitude REAL,
  longitude REAL,
  approved_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A customer's open call for a service ("I'm looking for a haircut"). Businesses
-- that specialize in the matching category can see it and offer a slot. One active
-- (open or offered) request per user at a time, enforced in the route handler.
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('open', 'offered', 'matched', 'withdrawn')) DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bookable last-minute slots offered by a business.
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id),
  service TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  discount_percent INTEGER,
  slot_time TEXT NOT NULL,
  -- How many customers can accept this slot before it stops showing up publicly.
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  rating REAL NOT NULL DEFAULT 5,
  reviews INTEGER NOT NULL DEFAULT 0,
  distance_km REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A customer reserving a listing. Payment happens in person, not through the app.
-- request_id is set only for bookings created by a business offering a slot in
-- response to a customer's open request (see the requests table below) — normal
-- public bookings leave it null.
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  status TEXT NOT NULL CHECK (status IN ('Offered', 'Upcoming', 'Completed', 'Cancelled', 'NoShow')) DEFAULT 'Upcoming',
  request_id INTEGER REFERENCES requests(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A complaint or piece of feedback reviewed by an admin. type='business' targets a
-- specific business (business_id set); type='app' is feedback/a suggestion about
-- Confirmea itself (business_id null). Both land in the same admin inbox.
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('business', 'app')) DEFAULT 'business',
  business_id INTEGER REFERENCES businesses(id),
  user_id INTEGER REFERENCES users(id),
  category TEXT NOT NULL,
  complainant_name TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved', 'dismissed')) DEFAULT 'open',
  notes TEXT NOT NULL DEFAULT '',
  resolution TEXT NOT NULL DEFAULT '',
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- A customer's 1-5 star review of a completed booking. One review per booking —
-- you can only rate a visit once, and only after the business marks you arrived.
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
  business_id INTEGER NOT NULL REFERENCES businesses(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The reverse of reviews — a business's 1-5 star rating of a customer, given after
-- marking them either arrived (Completed) or a no-show (NoShow). One rating per
-- booking. Aggregated per customer, like a rider rating on Uber.
CREATE TABLE IF NOT EXISTS customer_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
  business_id INTEGER NOT NULL REFERENCES businesses(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_listings_business ON listings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_complaints_business ON complaints(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_category_status ON requests(category, status);
CREATE INDEX IF NOT EXISTS idx_customer_ratings_user ON customer_ratings(user_id);
