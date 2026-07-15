import { Router } from "express";
import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { BusinessRow } from "../types.js";

const router = Router();

function serialize(row: BusinessRow & { open_complaints?: number }) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.address,
    approvedAt: row.approved_at,
    ...(row.open_complaints !== undefined ? { openComplaints: row.open_complaints } : {}),
  };
}

// Public — the consumer app's directory of live businesses.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = db.prepare("SELECT * FROM businesses ORDER BY approved_at DESC").all() as BusinessRow[];
    res.json(rows.map(serialize));
  })
);

// Admin only — same list, but with an open-complaints count for the Businesses page.
router.get(
  "/admin",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const rows = db
      .prepare(
        `SELECT b.*,
                (SELECT COUNT(*) FROM complaints c WHERE c.business_id = b.id AND c.status = 'open') AS open_complaints
         FROM businesses b
         ORDER BY b.approved_at DESC`
      )
      .all() as (BusinessRow & { open_complaints: number })[];
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

export default router;
