import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { BookingRow, ListingRow } from "../types.js";

const router = Router();

type ListingJoinRow = ListingRow & { business_name: string; business_address: string };

function serialize(row: BookingRow & { listing?: unknown }) {
  return {
    id: row.id,
    userId: row.user_id,
    listingId: row.listing_id,
    status: row.status,
    createdAt: row.created_at,
    listing: row.listing,
  };
}

function listingSummary(row: ListingJoinRow) {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.business_name,
    address: row.business_address,
    service: row.service,
    category: row.category,
    price: row.price,
    discountPercent: row.discount_percent,
    slotTime: row.slot_time,
  };
}

// Customer only — reserve a listing. No payment happens here; that's in person.
const createSchema = z.object({ listingId: z.number().int() });

router.post(
  "/",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const { listingId } = createSchema.parse(req.body);

    // better-sqlite3 is synchronous, so this whole check-then-insert runs as one
    // uninterrupted block on Node's single thread — no other request can slip a
    // booking in between the count check and the insert below.
    const bookNow = db.transaction(() => {
      const listing = db
        .prepare(
          `SELECT l.*, b.name AS business_name, b.address AS business_address FROM listings l
           JOIN businesses b ON b.id = l.business_id
           WHERE l.id = ? AND l.is_active = 1`
        )
        .get(listingId) as ListingJoinRow | undefined;
      if (!listing) throw new ApiError(404, "That slot isn't available.");

      const { count: bookedCount } = db
        .prepare("SELECT COUNT(*) AS count FROM bookings WHERE listing_id = ? AND status IN ('Upcoming', 'Offered')")
        .get(listingId) as { count: number };
      if (bookedCount >= listing.capacity) {
        throw new ApiError(409, "This slot just filled up — try another one.");
      }

      const result = db
        .prepare("INSERT INTO bookings (user_id, listing_id) VALUES (?, ?)")
        .run(req.user!.sub, listingId);

      const row = db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.lastInsertRowid) as BookingRow;
      return serialize({ ...row, listing: listingSummary(listing) });
    });

    res.status(201).json(bookNow());
  })
);

// Customer only — their own bookings, most recent first.
router.get(
  "/mine",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare("SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC")
      .all(req.user!.sub) as BookingRow[];

    const withListings = rows.map((booking) => {
      const listing = db
        .prepare(
          `SELECT l.*, b.name AS business_name, b.address AS business_address FROM listings l
           JOIN businesses b ON b.id = l.business_id
           WHERE l.id = ?`
        )
        .get(booking.listing_id) as ListingJoinRow | undefined;
      return serialize({ ...booking, listing: listing ? listingSummary(listing) : null });
    });

    res.json(withListings);
  })
);

// Customer only — completed bookings that haven't been reviewed yet. The mobile
// app checks this after login and prompts for a star rating if anything's pending.
router.get(
  "/pending-review",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare(
        `SELECT bk.id AS booking_id, l.business_id, b.name AS business_name,
                l.service, l.slot_time
         FROM bookings bk
         JOIN listings l ON l.id = bk.listing_id
         JOIN businesses b ON b.id = l.business_id
         LEFT JOIN reviews r ON r.booking_id = bk.id
         WHERE bk.user_id = ? AND bk.status = 'Completed' AND r.id IS NULL
         ORDER BY bk.created_at ASC`
      )
      .all(req.user!.sub) as {
      booking_id: number;
      business_id: number;
      business_name: string;
      service: string;
      slot_time: string;
    }[];

    res.json(
      rows.map((row) => ({
        bookingId: row.booking_id,
        businessId: row.business_id,
        businessName: row.business_name,
        service: row.service,
        slotTime: row.slot_time,
      }))
    );
  })
);

// Customer only — rate a completed visit. One review per booking, enforced by the
// reviews table's UNIQUE constraint on booking_id as well as this explicit check.
const reviewSchema = z.object({ rating: z.number().int().min(1).max(5) });

router.post(
  "/:id/review",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const { rating } = reviewSchema.parse(req.body);

    const booking = db
      .prepare(
        `SELECT bk.*, l.business_id AS listing_business_id
         FROM bookings bk
         JOIN listings l ON l.id = bk.listing_id
         WHERE bk.id = ?`
      )
      .get(req.params.id) as (BookingRow & { listing_business_id: number }) | undefined;

    if (!booking) throw new ApiError(404, "Booking not found.");
    if (booking.user_id !== req.user!.sub) throw new ApiError(403, "That's not your booking.");
    if (booking.status !== "Completed") {
      throw new ApiError(400, "You can only review a visit after it's been marked completed.");
    }

    const existing = db.prepare("SELECT id FROM reviews WHERE booking_id = ?").get(booking.id);
    if (existing) throw new ApiError(409, "You've already reviewed this visit.");

    const result = db
      .prepare("INSERT INTO reviews (booking_id, business_id, user_id, rating) VALUES (?, ?, ?, ?)")
      .run(booking.id, booking.listing_business_id, req.user!.sub, rating);

    res.status(201).json({
      id: result.lastInsertRowid,
      bookingId: booking.id,
      businessId: booking.listing_business_id,
      rating,
    });
  })
);

// Customer only — an offer a business has made against their open request, still
// awaiting a yes/no. The mobile app checks this after login and shows an alert.
router.get(
  "/pending-offer",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const row = db
      .prepare(
        `SELECT bk.id AS booking_id, l.business_id, b.name AS business_name,
                l.service, l.category, l.price, l.discount_percent, l.slot_time
         FROM bookings bk
         JOIN listings l ON l.id = bk.listing_id
         JOIN businesses b ON b.id = l.business_id
         WHERE bk.user_id = ? AND bk.status = 'Offered'
         ORDER BY bk.created_at ASC
         LIMIT 1`
      )
      .get(req.user!.sub) as
      | {
          booking_id: number;
          business_id: number;
          business_name: string;
          service: string;
          category: string;
          price: number;
          discount_percent: number | null;
          slot_time: string;
        }
      | undefined;

    if (!row) {
      res.json(null);
      return;
    }

    res.json({
      bookingId: row.booking_id,
      businessId: row.business_id,
      businessName: row.business_name,
      service: row.service,
      category: row.category,
      price: row.price,
      discountPercent: row.discount_percent,
      slotTime: row.slot_time,
    });
  })
);

// Customer only — accept or decline an offered slot. Declining lets the customer
// choose whether their request goes back to "open" for other businesses to try,
// or closes out entirely.
const respondSchema = z.object({
  accept: z.boolean(),
  keepRequestOpen: z.boolean().optional(),
});

router.post(
  "/:id/respond",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const { accept, keepRequestOpen } = respondSchema.parse(req.body);

    const respond = db.transaction(() => {
      const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id) as
        | BookingRow
        | undefined;
      if (!booking) throw new ApiError(404, "Offer not found.");
      if (booking.user_id !== req.user!.sub) throw new ApiError(403, "That's not your offer.");
      if (booking.status !== "Offered") throw new ApiError(400, "This offer has already been responded to.");

      if (accept) {
        db.prepare("UPDATE bookings SET status = 'Upcoming' WHERE id = ?").run(booking.id);
        if (booking.request_id) {
          db.prepare("UPDATE requests SET status = 'matched' WHERE id = ?").run(booking.request_id);
        }
      } else {
        db.prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?").run(booking.id);
        if (booking.request_id) {
          db.prepare("UPDATE requests SET status = ? WHERE id = ?").run(
            keepRequestOpen ? "open" : "withdrawn",
            booking.request_id
          );
        }
      }

      const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(booking.id) as BookingRow;
      return updated;
    });

    const updated = respond();
    res.json({ id: updated.id, status: updated.status });
  })
);

export default router;
