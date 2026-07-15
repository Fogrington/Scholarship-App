import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { ApplicationRow, ApplicationStatus } from "../types.js";

const router = Router();

function serialize(row: ApplicationRow) {
  return {
    id: row.id,
    businessName: row.business_name,
    category: row.category,
    abn: row.abn,
    address: row.address,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    status: row.status,
    checklist: {
      abn: Boolean(row.checklist_abn),
      address: Boolean(row.checklist_address),
      contact: Boolean(row.checklist_contact),
    },
    notes: row.notes,
    decisionReason: row.decision_reason,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
  };
}

// Public — a business submits a new application. No auth required to apply.
const submitSchema = z.object({
  businessName: z.string().min(1),
  category: z.string().min(1),
  abn: z.string().min(1),
  address: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = submitSchema.parse(req.body);
    const result = db
      .prepare(
        `INSERT INTO applications
          (business_name, category, abn, address, contact_name, contact_email, contact_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(data.businessName, data.category, data.abn, data.address, data.contactName, data.contactEmail, data.contactPhone);

    const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(result.lastInsertRowid) as ApplicationRow;
    res.status(201).json(serialize(row));
  })
);

// Admin only — list applications, optionally filtered by status.
router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const status = req.query.status as ApplicationStatus | undefined;
    const rows = status
      ? (db.prepare("SELECT * FROM applications WHERE status = ? ORDER BY submitted_at DESC").all(status) as ApplicationRow[])
      : (db.prepare("SELECT * FROM applications ORDER BY submitted_at DESC").all() as ApplicationRow[]);
    res.json(rows.map(serialize));
  })
);

router.get(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id) as ApplicationRow | undefined;
    if (!row) throw new ApiError(404, "Application not found.");
    res.json(serialize(row));
  })
);

// Admin only — update the review checklist.
const checklistSchema = z.object({
  key: z.enum(["abn", "address", "contact"]),
  value: z.boolean(),
});

router.patch(
  "/:id/checklist",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { key, value } = checklistSchema.parse(req.body);
    const column = `checklist_${key}`;
    const existing = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id) as
      | ApplicationRow
      | undefined;
    if (!existing) throw new ApiError(404, "Application not found.");
    if (existing.status !== "pending") throw new ApiError(400, "Only pending applications can be edited.");

    db.prepare(`UPDATE applications SET ${column} = ? WHERE id = ?`).run(value ? 1 : 0, req.params.id);
    const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id) as ApplicationRow;
    res.json(serialize(row));
  })
);

// Admin only — approve. Requires all three checklist items to be true, and creates the live business.
const approveSchema = z.object({ notes: z.string().optional().default("") });

router.patch(
  "/:id/approve",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { notes } = approveSchema.parse(req.body);
    const app = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id) as ApplicationRow | undefined;
    if (!app) throw new ApiError(404, "Application not found.");
    if (app.status !== "pending") throw new ApiError(400, "This application has already been decided.");
    if (!app.checklist_abn || !app.checklist_address || !app.checklist_contact) {
      throw new ApiError(400, "All three checklist items must be verified before approving.");
    }

    const txn = db.transaction(() => {
      db.prepare(
        "UPDATE applications SET status = 'approved', notes = ?, decided_at = datetime('now') WHERE id = ?"
      ).run(notes, app.id);

      db.prepare("INSERT INTO businesses (application_id, name, category, address) VALUES (?, ?, ?, ?)").run(
        app.id,
        app.business_name,
        app.category,
        app.address
      );
    });
    txn();

    const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id) as ApplicationRow;
    res.json(serialize(row));
  })
);

// Admin only — reject, with a required reason.
const rejectSchema = z.object({
  notes: z.string().optional().default(""),
  reason: z.string().min(1, "A rejection reason is required."),
});

router.patch(
  "/:id/reject",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { notes, reason } = rejectSchema.parse(req.body);
    const app = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id) as ApplicationRow | undefined;
    if (!app) throw new ApiError(404, "Application not found.");
    if (app.status !== "pending") throw new ApiError(400, "This application has already been decided.");

    db.prepare(
      "UPDATE applications SET status = 'rejected', notes = ?, decision_reason = ?, decided_at = datetime('now') WHERE id = ?"
    ).run(notes, reason, app.id);

    const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id) as ApplicationRow;
    res.json(serialize(row));
  })
);

export default router;
