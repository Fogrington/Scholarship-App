import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { ListingRow } from "../types.js";

const router = Router();

function serialize(row: ListingRow & { business_name?: string }) {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.business_name,
    service: row.service,
    category: row.category,
    price: row.price,
    discountPercent: row.discount_percent,
    slotTime: row.slot_time,
    rating: row.rating,
    reviews: row.reviews,
    distanceKm: row.distance_km,
    isActive: Boolean(row.is_active),
  };
}

// Public — browse listings, optionally filtered by category or a text search.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, search } = req.query as { category?: string; search?: string };

    let query = `
      SELECT l.*, b.name AS business_name
      FROM listings l
      JOIN businesses b ON b.id = l.business_id
      WHERE l.is_active = 1
    `;
    const params: unknown[] = [];

    if (category && category !== "All") {
      query += " AND l.category = ?";
      params.push(category);
    }
    if (search) {
      query += " AND (b.name LIKE ? OR l.service LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    query += " ORDER BY l.created_at DESC";

    const rows = db.prepare(query).all(...params) as (ListingRow & { business_name: string })[];
    res.json(rows.map(serialize));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = db
      .prepare(
        `SELECT l.*, b.name AS business_name FROM listings l
         JOIN businesses b ON b.id = l.business_id
         WHERE l.id = ?`
      )
      .get(req.params.id) as (ListingRow & { business_name: string }) | undefined;
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
        `INSERT INTO listings (business_id, service, category, price, discount_percent, slot_time, distance_km)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.businessId,
        data.service,
        data.category,
        data.price,
        data.discountPercent ?? null,
        data.slotTime,
        data.distanceKm ?? null
      );

    const row = db
      .prepare(
        `SELECT l.*, b.name AS business_name FROM listings l
         JOIN businesses b ON b.id = l.business_id
         WHERE l.id = ?`
      )
      .get(result.lastInsertRowid) as ListingRow & { business_name: string };
    res.status(201).json(serialize(row));
  })
);

export default router;
