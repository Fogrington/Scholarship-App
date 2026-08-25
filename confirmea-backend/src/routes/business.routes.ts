import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { BookingRow, BusinessRow, ListingRow } from "../types.js";

const router = Router();

// Every route here is a business account acting on its own data only — never
// trust a businessId from the request body/params, always use req.user.businessId
// from the verified JWT.
router.use(requireAuth, requireRole("business"));

function requireBusinessId(req: import("express").Request): number {
  const businessId = req.user?.businessId;
  if (!businessId) {
    throw new ApiError(403, "This account isn't linked to a business.");
  }
  return businessId;
}

// ---- Profile ----
router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const businessId = requireBusinessId(req);
    const business = db.prepare("SELECT * FROM businesses WHERE id = ?").get(businessId) as
      | BusinessRow
      | undefined;
    if (!business) throw new ApiError(404, "Business not found.");

    const { avg_rating, review_count } = db
      .prepare(
        `SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE business_id = ?`
      )
      .get(businessId) as { avg_rating: number | null; review_count: number };

    res.json({
      id: business.id,
      name: business.name,
      category: business.category,
      address: business.address,
      approvedAt: business.approved_at,
      rating: avg_rating !== null ? Math.round(avg_rating * 10) / 10 : null,
      reviewCount: review_count,
    });
  })
);

// ---- Listings (open slots) ----
type ListingWithCount = ListingRow & { upcoming_count: number };

function serializeListing(row: ListingWithCount) {
  const remainingSpots = row.capacity - row.upcoming_count;
  return {
    id: row.id,
    businessId: row.business_id,
    service: row.service,
    category: row.category,
    price: row.price,
    discountPercent: row.discount_percent,
    slotTime: row.slot_time,
    capacity: row.capacity,
    upcomingBookings: row.upcoming_count,
    remainingSpots,
    isFull: remainingSpots <= 0,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

router.get(
  "/listings",
  asyncHandler(async (req, res) => {
    const businessId = requireBusinessId(req);
    const rows = db
      .prepare(
        `SELECT l.*,
                (SELECT COUNT(*) FROM bookings b WHERE b.listing_id = l.id AND b.status IN ('Upcoming', 'Offered')) AS upcoming_count
         FROM listings l
         WHERE l.business_id = ?
         ORDER BY l.created_at DESC`
      )
      .all(businessId) as ListingWithCount[];
    res.json(rows.map(serializeListing));
  })
);

const createListingSchema = z.object({
  service: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  slotTime: z.string().min(1),
  capacity: z.number().int().min(1).max(100),
});

router.post(
  "/listings",
  asyncHandler(async (req, res) => {
    const businessId = requireBusinessId(req);
    const data = createListingSchema.parse(req.body);

    const result = db
      .prepare(
        `INSERT INTO listings (business_id, service, category, price, discount_percent, slot_time, capacity)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        businessId,
        data.service,
        data.category,
        data.price,
        data.discountPercent ?? null,
        data.slotTime,
        data.capacity
      );

    const row = db
      .prepare(`SELECT l.*, 0 AS upcoming_count FROM listings l WHERE l.id = ?`)
      .get(result.lastInsertRowid) as ListingWithCount;
    res.status(201).json(serializeListing(row));
  })
);

// Stop advertising a slot without deleting its booking history.
router.patch(
  "/listings/:id/close",
  asyncHandler(async (req, res) => {
    const businessId = requireBusinessId(req);
    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id) as
      | ListingRow
      | undefined;
    if (!listing) throw new ApiError(404, "Listing not found.");
    if (listing.business_id !== businessId) throw new ApiError(403, "That's not your listing.");

    db.prepare("UPDATE listings SET is_active = 0 WHERE id = ?").run(listing.id);
    const row = db
      .prepare(
        `SELECT l.*,
                (SELECT COUNT(*) FROM bookings b WHERE b.listing_id = l.id AND b.status IN ('Upcoming', 'Offered')) AS upcoming_count
         FROM listings l WHERE l.id = ?`
      )
      .get(listing.id) as ListingWithCount;
    res.json(serializeListing(row));
  })
);

// ---- Bookings (who's accepted a slot) ----
type BookingJoinRow = BookingRow & {
  customer_name: string;
  customer_email: string;
  service: string;
  category: string;
  price: number;
  discount_percent: number | null;
  slot_time: string;
  customer_avg_rating: number | null;
  customer_rating_count: number;
  rated_this_booking: number;
};

const BOOKING_SELECT = `
  SELECT bk.*, u.name AS customer_name, u.email AS customer_email,
         l.service, l.category, l.price, l.discount_percent, l.slot_time,
         (SELECT AVG(cr.rating) FROM customer_ratings cr WHERE cr.user_id = bk.user_id) AS customer_avg_rating,
         (SELECT COUNT(*) FROM customer_ratings cr WHERE cr.user_id = bk.user_id) AS customer_rating_count,
         (SELECT COUNT(*) FROM customer_ratings cr WHERE cr.booking_id = bk.id) AS rated_this_booking
  FROM bookings bk
  JOIN listings l ON l.id = bk.listing_id
  JOIN users u ON u.id = bk.user_id
`;

function serializeBooking(row: BookingJoinRow) {
  const canRateCustomer = (row.status === "Completed" || row.status === "NoShow") && row.rated_this_booking === 0;
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      rating: row.customer_avg_rating !== null ? Math.round(row.customer_avg_rating * 10) / 10 : null,
      reviewCount: row.customer_rating_count,
    },
    listing: {
      id: row.listing_id,
      service: row.service,
      category: row.category,
      price: row.price,
      discountPercent: row.discount_percent,
      slotTime: row.slot_time,
    },
    canRateCustomer,
  };
}

router.get(
  "/bookings",
  asyncHandler(async (req, res) => {
    const businessId = requireBusinessId(req);
    const status = req.query.status as string | undefined;

    let query = `${BOOKING_SELECT} WHERE l.business_id = ?`;
    const params: unknown[] = [businessId];
    if (status) {
      query += " AND bk.status = ?";
      params.push(status);
    }
    query += " ORDER BY bk.created_at DESC";

    const rows = db.prepare(query).all(...params) as BookingJoinRow[];
    res.json(rows.map(serializeBooking));
  })
);

// Shared by /arrived and /no-show — both close a booking out with an attendance
// outcome, verifying it's this business's own upcoming booking first.
function markAttendance(nextStatus: "Completed" | "NoShow") {
  return asyncHandler(async (req: import("express").Request, res: import("express").Response) => {
    const businessId = requireBusinessId(req);

    const booking = db
      .prepare(
        `SELECT bk.*, l.business_id AS listing_business_id
         FROM bookings bk
         JOIN listings l ON l.id = bk.listing_id
         WHERE bk.id = ?`
      )
      .get(req.params.id) as (BookingRow & { listing_business_id: number }) | undefined;

    if (!booking) throw new ApiError(404, "Booking not found.");
    if (booking.listing_business_id !== businessId) throw new ApiError(403, "That's not your booking.");
    if (booking.status !== "Upcoming") throw new ApiError(400, "This booking is already closed out.");

    db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(nextStatus, booking.id);

    const row = db.prepare(`${BOOKING_SELECT} WHERE bk.id = ?`).get(booking.id) as BookingJoinRow;
    res.json(serializeBooking(row));
  });
}

// Mark a customer as arrived — closes out the booking as Completed.
router.patch("/bookings/:id/arrived", markAttendance("Completed"));

// Mark a customer as a no-show — closes out the booking without them showing up.
router.patch("/bookings/:id/no-show", markAttendance("NoShow"));

// Rate the customer 1-5 stars, after attendance has been recorded either way. One
// rating per booking — mirrors how a customer reviews a business, just reversed.
const rateCustomerSchema = z.object({ rating: z.number().int().min(1).max(5) });

router.post(
  "/bookings/:id/rate-customer",
  asyncHandler(async (req, res) => {
    const businessId = requireBusinessId(req);
    const { rating } = rateCustomerSchema.parse(req.body);

    const booking = db
      .prepare(
        `SELECT bk.*, l.business_id AS listing_business_id
         FROM bookings bk
         JOIN listings l ON l.id = bk.listing_id
         WHERE bk.id = ?`
      )
      .get(req.params.id) as (BookingRow & { listing_business_id: number }) | undefined;

    if (!booking) throw new ApiError(404, "Booking not found.");
    if (booking.listing_business_id !== businessId) throw new ApiError(403, "That's not your booking.");
    if (booking.status !== "Completed" && booking.status !== "NoShow") {
      throw new ApiError(400, "You can only rate a customer after marking them arrived or a no-show.");
    }

    const existing = db.prepare("SELECT id FROM customer_ratings WHERE booking_id = ?").get(booking.id);
    if (existing) throw new ApiError(409, "You've already rated this customer for this booking.");

    db.prepare(
      "INSERT INTO customer_ratings (booking_id, business_id, user_id, rating) VALUES (?, ?, ?, ?)"
    ).run(booking.id, businessId, booking.user_id, rating);

    const row = db.prepare(`${BOOKING_SELECT} WHERE bk.id = ?`).get(booking.id) as BookingJoinRow;
    res.json(serializeBooking(row));
  })
);

export default router;
