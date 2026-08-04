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

    const listing = db
      .prepare(
        `SELECT l.*, b.name AS business_name, b.address AS business_address FROM listings l
         JOIN businesses b ON b.id = l.business_id
         WHERE l.id = ? AND l.is_active = 1`
      )
      .get(listingId) as ListingJoinRow | undefined;
    if (!listing) throw new ApiError(404, "That slot isn't available.");

    const result = db
      .prepare("INSERT INTO bookings (user_id, listing_id) VALUES (?, ?)")
      .run(req.user!.sub, listingId);

    const row = db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.lastInsertRowid) as BookingRow;
    res.status(201).json(serialize({ ...row, listing: listingSummary(listing) }));
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

export default router;
