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
    // Coordinates are each business's suburb centroid — close enough for a
    // last-minute booking app to sort "closest first", not survey-grade precision.
    const businesses = [
      { name: "Salt & Co Hair Studio", category: "Hair", address: "12 Hunter St, Newcastle", lat: -32.9283, lng: 151.7817 },
      { name: "Bare Beauty Bar", category: "Beauty", address: "45 Darby St, Cooks Hill", lat: -32.9313, lng: 151.7676 },
      { name: "Polished Nail Lounge", category: "Nails", address: "8 King St, Newcastle", lat: -32.9283, lng: 151.7817 },
      { name: "Smooth Skin Studio", category: "Waxing", address: "3 Beaumont St, Hamilton", lat: -32.9260, lng: 151.7407 },
      { name: "Unwind Massage Co", category: "Massage", address: "22 Union St, The Junction", lat: -32.9366, lng: 151.7597 },
      { name: "Barber & Sons", category: "Hair", address: "17 Hunter St, Newcastle", lat: -32.9283, lng: 151.7817 },
    ];
    const businessIds: Record<string, number> = {};
    for (const b of businesses) {
      const result = db
        .prepare("INSERT INTO businesses (name, category, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)")
        .run(b.name, b.category, b.address, b.lat, b.lng);
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
    // rating/reviews and distance are no longer stored per-listing — rating is
    // computed live from the reviews table, and distance is computed live from the
    // business's lat/lng against whichever suburb the customer has selected.
    const listings = [
      { biz: "Salt & Co Hair Studio", service: "Women's Cut & Blow Dry", category: "Hair", price: 65, discount: 20, slot: "Today, 4:30 PM", capacity: 1 },
      { biz: "Bare Beauty Bar", service: "Express Facial", category: "Beauty", price: 55, discount: 15, slot: "Today, 5:00 PM", capacity: 2 },
      { biz: "Polished Nail Lounge", service: "Gel Manicure", category: "Nails", price: 45, discount: null, slot: "Today, 3:45 PM", capacity: 1 },
      { biz: "Smooth Skin Studio", service: "Leg Wax", category: "Waxing", price: 40, discount: null, slot: "Tomorrow, 10:00 AM", capacity: 1 },
      { biz: "Unwind Massage Co", service: "60min Relaxation Massage", category: "Massage", price: 95, discount: 10, slot: "Today, 6:15 PM", capacity: 1 },
      { biz: "Barber & Sons", service: "Men's Cut & Beard Trim", category: "Hair", price: 38, discount: null, slot: "Today, 4:00 PM", capacity: 3 },
    ];
    const listingIds: Record<string, number> = {};
    for (const l of listings) {
      const result = db
        .prepare(
          `INSERT INTO listings (business_id, service, category, price, discount_percent, slot_time, capacity)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(businessIds[l.biz], l.service, l.category, l.price, l.discount, l.slot, l.capacity);
      listingIds[l.biz] = Number(result.lastInsertRowid);
    }

    // ---- Dummy reviewers + review history, to give each business a realistic
    // rating for demo purposes. Every review is backed by a real (fabricated)
    // completed booking — ratings aren't just numbers floating free of any visit. ----
    const dummyReviewers = [
      "Maya Chen", "Liam O'Brien", "Aisha Patel", "Jack Nguyen", "Chloe Ahmed",
      "Ryan Kelly", "Priya Singh", "Noah Wallace", "Zoe Martinez", "Ethan Cho",
    ];
    const reviewerIds: number[] = dummyReviewers.map((name, i) => {
      const email = `reviewer${i + 1}@confirmea.app`;
      const result = db
        .prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'customer')")
        .run(email, hashPassword("reviewer123"), name);
      return Number(result.lastInsertRowid);
    });

    let reviewerCursor = 0;
    function nextReviewer(): number {
      const id = reviewerIds[reviewerCursor % reviewerIds.length];
      reviewerCursor += 1;
      return id;
    }

    function addReview(bizName: string, rating: number) {
      const listingId = listingIds[bizName];
      const businessId = businessIds[bizName];
      const reviewerId = nextReviewer();
      const bookingResult = db
        .prepare("INSERT INTO bookings (user_id, listing_id, status) VALUES (?, ?, 'Completed')")
        .run(reviewerId, listingId);
      db.prepare("INSERT INTO reviews (booking_id, business_id, user_id, rating) VALUES (?, ?, ?, ?)").run(
        Number(bookingResult.lastInsertRowid),
        businessId,
        reviewerId,
        rating
      );
    }

    const reviewRatings: Record<string, number[]> = {
      "Salt & Co Hair Studio": [5, 5, 4, 5, 4, 5, 3, 5],
      "Bare Beauty Bar": [5, 4, 5, 5, 4],
      "Polished Nail Lounge": [4, 4, 3, 5, 4, 4],
      "Smooth Skin Studio": [5, 5, 5, 4],
      "Unwind Massage Co": [5, 5, 5, 5, 5, 4],
      "Barber & Sons": [4, 5, 4, 3, 4, 5, 5, 4, 4],
      // Northside Barbers gets none — a newly-approved business with no reviews yet
      // demonstrates the "no ratings yet" state.
    };
    for (const [bizName, ratings] of Object.entries(reviewRatings)) {
      for (const rating of ratings) {
        addReview(bizName, rating);
      }
    }

    // Fletch (the main demo customer) has one completed, unreviewed booking — logging
    // in as Fletch immediately triggers the "rate your visit" prompt for this one.
    const fletchId = db.prepare("SELECT id FROM users WHERE email = ?").get("fletch@example.com") as { id: number };
    db.prepare("INSERT INTO bookings (user_id, listing_id, status) VALUES (?, ?, 'Completed')").run(
      fletchId.id,
      listingIds["Barber & Sons"]
    );

    // A second, already-settled visit for Fletch — reviewed (so it doesn't also
    // trigger the review prompt) and rated by the business, so Fletch's own Profile
    // tab has a real customer rating to show off in the demo.
    const fletchSecondBooking = db
      .prepare("INSERT INTO bookings (user_id, listing_id, status) VALUES (?, ?, 'Completed')")
      .run(fletchId.id, listingIds["Salt & Co Hair Studio"]);
    db.prepare("INSERT INTO reviews (booking_id, business_id, user_id, rating) VALUES (?, ?, ?, ?)").run(
      Number(fletchSecondBooking.lastInsertRowid),
      businessIds["Salt & Co Hair Studio"],
      fletchId.id,
      5
    );
    db.prepare(
      "INSERT INTO customer_ratings (booking_id, business_id, user_id, rating) VALUES (?, ?, ?, ?)"
    ).run(Number(fletchSecondBooking.lastInsertRowid), businessIds["Salt & Co Hair Studio"], fletchId.id, 5);

    // An Upcoming booking against Salt & Co, from a real (dummy) customer account —
    // gives the business demo something to mark arrived/no-show and rate live,
    // rather than the presenter having to create a booking from scratch first.
    db.prepare("INSERT INTO bookings (user_id, listing_id, status) VALUES (?, ?, 'Upcoming')").run(
      reviewerIds[3],
      listingIds["Salt & Co Hair Studio"]
    );

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

    // ---- One piece of app feedback (not tied to any business), from Fletch ----
    db.prepare(
      `INSERT INTO complaints (type, business_id, user_id, category, complainant_name, details, status)
       VALUES ('app', NULL, ?, ?, ?, ?, 'open')`
    ).run(
      fletchId.id,
      "Suggestion",
      "Fletch",
      "Would be great to filter Discover by price range, not just category and distance."
    );
    // ---- A demo open request, so the business dashboard's Requests tab has
    // something to show without the presenter needing to create one live. Category
    // matches both Salt & Co Hair Studio and Barber & Sons. ----
    db.prepare("INSERT INTO requests (user_id, category, note) VALUES (?, ?, ?)").run(
      reviewerIds[0],
      "Hair",
      "Need a quick trim before a work event this afternoon — flexible on timing!"
    );
  });

  txn();
  console.log("Seed complete.");
  console.log("Admin login: admin@confirmea.app / admin123");
  console.log("Customer login: fletch@example.com / password123");
  console.log("Business logins: barebeautybar@confirmea.app / business123, saltandco@confirmea.app / business123");
  console.log("Fletch has one completed, unreviewed booking — logging in prompts a star rating.");
  console.log("10 dummy reviewer accounts also seeded (reviewer1..10@confirmea.app / reviewer123) for review history.");
  console.log("One open Hair request is seeded too — log in as a Hair business to see it on the Requests tab.");
  console.log("Salt & Co has an Upcoming booking ready to mark arrived/no-show and rate the customer on.");
  console.log("Fletch has a customer rating already (5 stars) — check his Profile tab.");
  console.log("One app-feedback item (not tied to a business) is seeded in the admin Complaints tab.");
}

seed();
