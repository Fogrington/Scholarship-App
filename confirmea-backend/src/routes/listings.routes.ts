import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { ListingRow } from "../types.js";

const router = Router();

type ListingJoinRow = ListingRow & {
  business_name: string;
  business_address: string;
  booked_count: number;
};

function serialize(row: ListingJoinRow) {
  const remainingSpots = row.capacity - row.booked_count;
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
    capacity: row.capacity,
    remainingSpots,
    isFull: remainingSpots <= 0,
    rating: row.rating,
    reviews: row.reviews,
    distanceKm: row.distance_km,
    isActive: Boolean(row.is_active),
  };
}

const BOOKED_COUNT_SUBQUERY = `
  (SELECT COUNT(*) FROM bookings bk WHERE bk.listing_id = l.id AND bk.status = 'Upcoming') AS booked_count
`;

// Public — browse listings, optionally filtered by category or a text search.
// Only shows slots that are both open (is_active) and not yet full.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, search } = req.query as { category?: string; search?: string };

    let innerQuery = `
      SELECT l.*, b.name AS business_name, b.address AS business_address, ${BOOKED_COUNT_SUBQUERY}
      FROM listings l
      JOIN businesses b ON b.id = l.business_id
      WHERE l.is_active = 1
    `;
    const params: unknown[] = [];

    if (category && category !== "All") {
      innerQuery += " AND l.category = ?";
      params.push(category);
    }
    if (search) {
      innerQuery += " AND (b.name LIKE ? OR l.service LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Wrapped so we can filter on the computed booked_count/capacity difference —
    // SQLite won't let a WHERE clause reference a sibling SELECT alias directly.
    const query = `
      SELECT * FROM (${innerQuery}) sub
      WHERE sub.capacity - sub.booked_count > 0
      ORDER BY sub.created_at DESC
    `;

    const rows = db.prepare(query).all(...params) as ListingJoinRow[];
    res.json(rows.map(serialize));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = db
      .prepare(
        `SELECT l.*, b.name AS business_name, b.address AS business_address, ${BOOKED_COUNT_SUBQUERY}
         FROM listings l
         JOIN businesses b ON b.id = l.business_id
         WHERE l.id = ?`
      )
      .get(req.params.id) as ListingJoinRow | undefined;
    if (!row) throw new ApiError(404, "Listing not found.");
    res.json(serialize(row));
  })
);

// Admin only, for now — create a listing under a business. (Business self-service comes later.)
const createSchema = z.object({
  businessId: z.number().int(),
  service: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  slotTime: z.string().min(1),
  capacity: z.number().int().min(1).max(100).optional().default(1),
  distanceKm: z.number().optional(),
});

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const result = db
      .prepare(
        `INSERT INTO listings (business_id, service, category, price, discount_percent, slot_time, capacity, distance_km)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.businessId,
        data.service,
        data.category,
        data.price,
        data.discountPercent ?? null,
        data.slotTime,
        data.capacity,
        data.distanceKm ?? null
      );

    const row = db
      .prepare(
        `SELECT l.*, b.name AS business_name, b.address AS business_address, ${BOOKED_COUNT_SUBQUERY}
         FROM listings l
         JOIN businesses b ON b.id = l.business_id
         WHERE l.id = ?`
      )
      .get(result.lastInsertRowid) as ListingJoinRow;
    res.status(201).json(serialize(row));
  })
);

export default router;
