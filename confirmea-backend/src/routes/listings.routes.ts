import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { haversineKm } from "../utils/geo.js";
import type { ListingRow } from "../types.js";

const router = Router();

type ListingJoinRow = ListingRow & {
  business_name: string;
  business_address: string;
  business_lat: number | null;
  business_lng: number | null;
  booked_count: number;
  avg_rating: number | null;
  review_count: number;
};

function serialize(row: ListingJoinRow, originLat?: number, originLng?: number) {
  const remainingSpots = row.capacity - row.booked_count;

  let distanceKm: number | null = null;
  if (originLat !== undefined && originLng !== undefined && row.business_lat !== null && row.business_lng !== null) {
    distanceKm = haversineKm(originLat, originLng, row.business_lat, row.business_lng);
  }

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
    // Rating is aggregated from real reviews of this business, shared across all of
    // its listings — not the old static per-listing seed values.
    rating: row.avg_rating !== null ? Math.round(row.avg_rating * 10) / 10 : null,
    reviews: row.review_count,
    distanceKm,
    isActive: Boolean(row.is_active),
  };
}

const BOOKED_COUNT_SUBQUERY = `
  (SELECT COUNT(*) FROM bookings bk WHERE bk.listing_id = l.id AND bk.status = 'Upcoming') AS booked_count
`;

const RATING_SUBQUERIES = `
  (SELECT AVG(r.rating) FROM reviews r WHERE r.business_id = l.business_id) AS avg_rating,
  (SELECT COUNT(*) FROM reviews r WHERE r.business_id = l.business_id) AS review_count
`;

const SELECT_FIELDS = `
  l.*, b.name AS business_name, b.address AS business_address,
  b.latitude AS business_lat, b.longitude AS business_lng,
  ${BOOKED_COUNT_SUBQUERY}, ${RATING_SUBQUERIES}
`;

function parseOrigin(query: Record<string, unknown>): { lat?: number; lng?: number } {
  const lat = query.lat !== undefined ? Number(query.lat) : undefined;
  const lng = query.lng !== undefined ? Number(query.lng) : undefined;
  if (lat !== undefined && !Number.isNaN(lat) && lng !== undefined && !Number.isNaN(lng)) {
    return { lat, lng };
  }
  return {};
}

// Public — browse listings, optionally filtered by category or a text search, and
// optionally sorted by distance from a customer-selected suburb (?lat=&lng=).
// Only shows slots that are both open (is_active) and not yet full.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, search } = req.query as { category?: string; search?: string };
    const { lat, lng } = parseOrigin(req.query as Record<string, unknown>);

    let innerQuery = `
      SELECT ${SELECT_FIELDS}
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
    const serialized = rows.map((row) => serialize(row, lat, lng));

    // Distance is computed in JS (not SQL — SQLite doesn't reliably have trig
    // functions available), so the closest-first sort happens here too.
    if (lat !== undefined && lng !== undefined) {
      serialized.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    res.json(serialized);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { lat, lng } = parseOrigin(req.query as Record<string, unknown>);
    const row = db
      .prepare(`SELECT ${SELECT_FIELDS} FROM listings l JOIN businesses b ON b.id = l.business_id WHERE l.id = ?`)
      .get(req.params.id) as ListingJoinRow | undefined;
    if (!row) throw new ApiError(404, "Listing not found.");
    res.json(serialize(row, lat, lng));
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
});

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const result = db
      .prepare(
        `INSERT INTO listings (business_id, service, category, price, discount_percent, slot_time, capacity)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.businessId,
        data.service,
        data.category,
        data.price,
        data.discountPercent ?? null,
        data.slotTime,
        data.capacity
      );

    const row = db
      .prepare(`SELECT ${SELECT_FIELDS} FROM listings l JOIN businesses b ON b.id = l.business_id WHERE l.id = ?`)
      .get(result.lastInsertRowid) as ListingJoinRow;
    res.status(201).json(serialize(row));
  })
);

export default router;
