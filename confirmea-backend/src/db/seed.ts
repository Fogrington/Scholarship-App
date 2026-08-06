import db from "./index.js";
import { hashPassword } from "../utils/password.js";

function alreadySeeded(): boolean {
  const row = db.prepare("SELECT COUNT(*) as count FROM businesses").get() as { count: number };
  return row.count > 0;
}

function seed() {
  if (alreadySeeded()) {
    console.log("Database already has data — skipping seed. Delete data/confirmea.db to reseed from scratch.");
    return;
  }

  const txn = db.transaction(() => {
    // ---- Users ----
    db.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)").run(
      "admin@confirmea.app",
      hashPassword("admin123"),
      "Admin",
      "admin"
    );
    db.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)").run(
      "fletch@example.com",
      hashPassword("password123"),
      "Fletch",
      "customer"
    );

    // ---- Businesses already live (matches the consumer app's original mock listings) ----
    const businesses = [
      { name: "Salt & Co Hair Studio", category: "Hair", address: "12 Hunter St, Newcastle" },
      { name: "Bare Beauty Bar", category: "Beauty", address: "45 Darby St, Cooks Hill" },
      { name: "Polished Nail Lounge", category: "Nails", address: "8 King St, Newcastle" },
      { name: "Smooth Skin Studio", category: "Waxing", address: "3 Beaumont St, Hamilton" },
      { name: "Unwind Massage Co", category: "Massage", address: "22 Union St, The Junction" },
      { name: "Barber & Sons", category: "Hair", address: "17 Hunter St, Newcastle" },
    ];
    const businessIds: Record<string, number> = {};
    for (const b of businesses) {
      const result = db
        .prepare("INSERT INTO businesses (name, category, address) VALUES (?, ?, ?)")
        .run(b.name, b.category, b.address);
      businessIds[b.name] = Number(result.lastInsertRowid);
    }

    // ---- Business accounts (log into the mobile app's business dashboard) ----
    db.prepare(
      "INSERT INTO users (email, password_hash, name, role, business_id) VALUES (?, ?, ?, 'business', ?)"
    ).run("barebeautybar@confirmea.app", hashPassword("business123"), "Bare Beauty Bar", businessIds["Bare Beauty Bar"]);

    db.prepare(
      "INSERT INTO users (email, password_hash, name, role, business_id) VALUES (?, ?, ?, 'business', ?)"
    ).run("saltandco@confirmea.app", hashPassword("business123"), "Salt & Co Hair Studio", businessIds["Salt & Co Hair Studio"]);

    // ---- Listings (bookable slots) for those businesses ----
    const listings = [
      { biz: "Salt & Co Hair Studio", service: "Women's Cut & Blow Dry", category: "Hair", price: 65, discount: 20, slot: "Today, 4:30 PM", capacity: 1, rating: 4.8, reviews: 212, distance: 1.2 },
      { biz: "Bare Beauty Bar", service: "Express Facial", category: "Beauty", price: 55, discount: 15, slot: "Today, 5:00 PM", capacity: 2, rating: 4.9, reviews: 88, distance: 0.8 },
      { biz: "Polished Nail Lounge", service: "Gel Manicure", category: "Nails", price: 45, discount: null, slot: "Today, 3:45 PM", capacity: 1, rating: 4.6, reviews: 150, distance: 2.4 },
      { biz: "Smooth Skin Studio", service: "Leg Wax", category: "Waxing", price: 40, discount: null, slot: "Tomorrow, 10:00 AM", capacity: 1, rating: 4.7, reviews: 64, distance: 1.9 },
      { biz: "Unwind Massage Co", service: "60min Relaxation Massage", category: "Massage", price: 95, discount: 10, slot: "Today, 6:15 PM", capacity: 1, rating: 5.0, reviews: 41, distance: 3.1 },
      { biz: "Barber & Sons", service: "Men's Cut & Beard Trim", category: "Hair", price: 38, discount: null, slot: "Today, 4:00 PM", capacity: 3, rating: 4.5, reviews: 302, distance: 0.5 },
    ];
    for (const l of listings) {
      db.prepare(
        `INSERT INTO listings (business_id, service, category, price, discount_percent, slot_time, capacity, rating, reviews, distance_km)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(businessIds[l.biz], l.service, l.category, l.price, l.discount, l.slot, l.capacity, l.rating, l.reviews, l.distance);
    }

    // ---- Applications (the admin panel's review queue) ----
    db.prepare(
      `INSERT INTO applications
        (business_name, category, abn, address, contact_name, contact_email, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).run("Glow Beauty Rooms", "Beauty", "51 824 753 556", "9 Wolfe St, Newcastle", "Priya Nair", "priya@glowbeauty.com.au", "0412 555 210");

    db.prepare(
      `INSERT INTO applications
        (business_name, category, abn, address, contact_name, contact_email, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).run("The Wax Bar Newcastle", "Waxing", "12 345 678 910", "101 Hunter St, Newcastle", "Meg Ellis", "meg@waxbarnewy.com.au", "0400 118 774");

    db.prepare(
      `INSERT INTO applications
        (business_name, category, abn, address, contact_name, contact_email, contact_phone, status,
         checklist_abn, checklist_address, checklist_contact, notes, decision_reason, decided_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'rejected', 1, 0, 1, ?, ?, datetime('now'))`
    ).run(
      "Zen Massage Therapy",
      "Massage",
      "88 102 556 771",
      "15 Beaumont St, Hamilton",
      "Owen Fisk",
      "owen@zenmassage.com.au",
      "0433 909 221",
      "ABN lookup returned a different registered business name at this address.",
      "ABN could not be verified against the registered business address. Reapply once ASIC records are updated."
    );

    // Northside Barbers — already approved, so it gets both an application row and a business row.
    const northsideApp = db
      .prepare(
        `INSERT INTO applications
          (business_name, category, abn, address, contact_name, contact_email, contact_phone, status,
           checklist_abn, checklist_address, checklist_contact, notes, decided_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 1, 1, 1, ?, datetime('now'))`
      )
      .run(
        "Northside Barbers",
        "Hair",
        "33 221 445 902",
        "4 Griffiths Rd, Lambton",
        "Dave Kalani",
        "dave@northsidebarbers.com.au",
        "0421 664 330",
        "Called to confirm trading hours, all good."
      );
    db.prepare("INSERT INTO businesses (application_id, name, category, address) VALUES (?, ?, ?, ?)").run(
      Number(northsideApp.lastInsertRowid),
      "Northside Barbers",
      "Hair",
      "4 Griffiths Rd, Lambton"
    );

    // ---- Complaints against the existing businesses ----
    db.prepare(
      `INSERT INTO complaints (business_id, category, complainant_name, details, status)
       VALUES (?, ?, ?, ?, 'open')`
    ).run(businessIds["Salt & Co Hair Studio"], "Service quality", "J. Reyes", "Stylist ran 40 minutes late with no notice sent through the app.");

    db.prepare(
      `INSERT INTO complaints (business_id, category, complainant_name, details, status)
       VALUES (?, ?, ?, ?, 'open')`
    ).run(businessIds["Barber & Sons"], "No-show", "T. Wallace", "Booked slot was marked filled in the app, but the business was closed on arrival.");

    db.prepare(
      `INSERT INTO complaints (business_id, category, complainant_name, details, status, notes, resolution, resolved_at)
       VALUES (?, ?, ?, ?, 'resolved', ?, ?, datetime('now'))`
    ).run(
      businessIds["Unwind Massage Co"],
      "Billing dispute",
      "S. Cho",
      "Charged more in person than the price advertised in the app.",
      "Confirmed with business — pricing was out of date in their system.",
      "Business updated their listed price and refunded the $12 difference."
    );

    db.prepare(
      `INSERT INTO complaints (business_id, category, complainant_name, details, status, notes, resolution, resolved_at)
       VALUES (?, ?, ?, ?, 'dismissed', ?, ?, datetime('now'))`
    ).run(
      businessIds["Bare Beauty Bar"],
      "Hygiene concern",
      "A. Ibrahim",
      "Raised a concern about tool sanitation during an express facial.",
      "Site visit conducted.",
      "No issue found on inspection; complainant notified."
    );
  });

  txn();
  console.log("Seed complete.");
  console.log("Admin login: admin@confirmea.app / admin123");
  console.log("Customer login: fletch@example.com / password123");
  console.log("Business logins: barebeautybar@confirmea.app / business123, saltandco@confirmea.app / business123");
}

seed();
