import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { BusinessRow, ComplaintRow, ComplaintStatus, UserRow } from "../types.js";

const router = Router();

function serialize(row: ComplaintRow & { business_name?: string | null }) {
  return {
    id: row.id,
    type: row.type,
    businessId: row.business_id,
    businessName: row.business_name ?? null,
    category: row.category,
    complainant: row.complainant_name,
    details: row.details,
    status: row.status,
    notes: row.notes,
    resolution: row.resolution,
    submittedAt: row.submitted_at,
    resolvedAt: row.resolved_at,
  };
}

// Any authenticated user can file a complaint against a business, or send feedback
// about Confirmea itself. The complainant's name always comes from their own
// account — never from client input, so no one can file on behalf of someone else.
const submitSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("business"),
    businessId: z.number().int(),
    category: z.string().min(1),
    details: z.string().min(1),
  }),
  z.object({
    type: z.literal("app"),
    category: z.string().min(1),
    details: z.string().min(1),
  }),
]);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = submitSchema.parse(req.body);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.sub) as UserRow | undefined;
    if (!user) throw new ApiError(404, "User not found.");

    let businessName: string | null = null;
    let businessId: number | null = null;

    if (data.type === "business") {
      const business = db.prepare("SELECT * FROM businesses WHERE id = ?").get(data.businessId) as
        | BusinessRow
        | undefined;
      if (!business) throw new ApiError(404, "Business not found.");
      businessId = business.id;
      businessName = business.name;
    }

    const result = db
      .prepare(
        "INSERT INTO complaints (type, business_id, user_id, category, complainant_name, details) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(data.type, businessId, user.id, data.category, user.name, data.details);

    const row = db.prepare("SELECT * FROM complaints WHERE id = ?").get(result.lastInsertRowid) as ComplaintRow;
    res.status(201).json(serialize({ ...row, business_name: businessName }));
  })
);

// Admin only — list complaints and app feedback together, optionally filtered by
// status and/or type.
router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const status = req.query.status as ComplaintStatus | undefined;
    const type = req.query.type as string | undefined;

    let query = `
      SELECT c.*, b.name AS business_name
      FROM complaints c
      LEFT JOIN businesses b ON b.id = c.business_id
      WHERE 1 = 1
    `;
    const params: unknown[] = [];
    if (status) {
      query += " AND c.status = ?";
      params.push(status);
    }
    if (type) {
      query += " AND c.type = ?";
      params.push(type);
    }
    query += " ORDER BY c.submitted_at DESC";

    const rows = db.prepare(query).all(...params) as (ComplaintRow & { business_name: string | null })[];
    res.json(rows.map(serialize));
  })
);

const resolveSchema = z.object({
  notes: z.string().optional().default(""),
  resolution: z.string().min(1, "A resolution note is required."),
});

function decide(status: "resolved" | "dismissed") {
  return asyncHandler(async (req, res) => {
    const { notes, resolution } = resolveSchema.parse(req.body);
    const complaint = db.prepare("SELECT * FROM complaints WHERE id = ?").get(req.params.id) as
      | ComplaintRow
      | undefined;
    if (!complaint) throw new ApiError(404, "Complaint not found.");
    if (complaint.status !== "open") throw new ApiError(400, "This complaint has already been closed.");

    db.prepare(
      `UPDATE complaints SET status = ?, notes = ?, resolution = ?, resolved_at = datetime('now') WHERE id = ?`
    ).run(status, notes, resolution, complaint.id);

    const row = db
      .prepare(
        `SELECT c.*, b.name AS business_name FROM complaints c
         LEFT JOIN businesses b ON b.id = c.business_id
         WHERE c.id = ?`
      )
      .get(complaint.id) as ComplaintRow & { business_name: string | null };
    res.json(serialize(row));
  });
}

router.patch("/:id/resolve", requireAuth, requireRole("admin"), decide("resolved"));
router.patch("/:id/dismiss", requireAuth, requireRole("admin"), decide("dismissed"));

export default router;
