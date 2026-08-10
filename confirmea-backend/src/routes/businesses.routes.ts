import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { hashPassword } from "../utils/password.js";
import type { BusinessRow } from "../types.js";

const router = Router();

function serialize(
  row: BusinessRow & {
    open_complaints?: number;
    account_email?: string | null;
    avg_rating?: number | null;
    review_count?: number;
  }
) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.address,
    approvedAt: row.approved_at,
    ...(row.open_complaints !== undefined ? { openComplaints: row.open_complaints } : {}),
    ...(row.account_email !== undefined ? { accountEmail: row.account_email } : {}),
    ...(row.avg_rating !== undefined
      ? { rating: row.avg_rating !== null ? Math.round(row.avg_rating * 10) / 10 : null }
      : {}),
    ...(row.review_count !== undefined ? { reviewCount: row.review_count } : {}),
  };
}

const RATING_SUBQUERIES = `
  (SELECT AVG(r.rating) FROM reviews r WHERE r.business_id = b.id) AS avg_rating,
  (SELECT COUNT(*) FROM reviews r WHERE r.business_id = b.id) AS review_count
`;

// Public — the consumer app's directory of live businesses.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = db
      .prepare(`SELECT b.*, ${RATING_SUBQUERIES} FROM businesses b ORDER BY b.approved_at DESC`)
      .all() as (BusinessRow & { avg_rating: number | null; review_count: number })[];
    res.json(rows.map(serialize));
  })
);

// Admin only — same list, plus an open-complaints count, a rating, and whether a
// business login already exists (and its email) so the admin panel can offer to
// create one.
router.get(
  "/admin",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const rows = db
      .prepare(
        `SELECT b.*,
                (SELECT COUNT(*) FROM complaints c WHERE c.business_id = b.id AND c.status = 'open') AS open_complaints,
                (SELECT u.email FROM users u WHERE u.business_id = b.id AND u.role = 'business' LIMIT 1) AS account_email,
                ${RATING_SUBQUERIES}
         FROM businesses b
         ORDER BY b.approved_at DESC`
      )
      .all() as (BusinessRow & {
      open_complaints: number;
      account_email: string | null;
      avg_rating: number | null;
      review_count: number;
    })[];
    res.json(rows.map(serialize));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = db.prepare("SELECT * FROM businesses WHERE id = ?").get(req.params.id) as BusinessRow | undefined;
    if (!row) throw new ApiError(404, "Business not found.");
    res.json(serialize(row));
  })
);

// Admin only — create a login for a business owner. Deliberately not public: letting
// anyone self-register as a business would let them claim someone else's listing.
const createAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  name: z.string().min(1),
});

router.post(
  "/:id/account",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = createAccountSchema.parse(req.body);

    const business = db.prepare("SELECT * FROM businesses WHERE id = ?").get(req.params.id) as
      | BusinessRow
      | undefined;
    if (!business) throw new ApiError(404, "Business not found.");

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(data.email);
    if (existing) throw new ApiError(409, "An account with that email already exists.");

    const password_hash = hashPassword(data.password);
    const result = db
      .prepare("INSERT INTO users (email, password_hash, name, role, business_id) VALUES (?, ?, ?, 'business', ?)")
      .run(data.email, password_hash, data.name, business.id);

    res.status(201).json({
      id: result.lastInsertRowid,
      email: data.email,
      name: data.name,
      role: "business",
      businessId: business.id,
      businessName: business.name,
    });
  })
);

export default router;
