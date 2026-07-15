-- Confirmea database schema.
-- SQLite via better-sqlite3. Booleans are stored as 0/1 integers (SQLite has no bool type).

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin')) DEFAULT 'customer',
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
  approved_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  rating REAL NOT NULL DEFAULT 5,
  reviews INTEGER NOT NULL DEFAULT 0,
  distance_km REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A customer reserving a listing. Payment happens in person, not through the app.
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  status TEXT NOT NULL CHECK (status IN ('Upcoming', 'Completed', 'Cancelled')) DEFAULT 'Upcoming',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A complaint raised against a business, reviewed by an admin.
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id),
  category TEXT NOT NULL,
  complainant_name TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved', 'dismissed')) DEFAULT 'open',
  notes TEXT NOT NULL DEFAULT '',
  resolution TEXT NOT NULL DEFAULT '',
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_listings_business ON listings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_complaints_business ON complaints(business_id);
