import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { BusinessRow, RequestRow } from "../types.js";

const router = Router();

function serialize(row: RequestRow) {
  return {
    id: row.id,
    category: row.category,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Customer only — post an open request. Only one active (open or offered) request
// per user at a time — post a new one and you'll get a 409 until the current one
// is matched or withdrawn.
const createSchema = z.object({
  category: z.string().min(1),
  note: z.string().max(280).optional().default(""),
});

router.post(
  "/",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);

    const existing = db
      .prepare("SELECT id FROM requests WHERE user_id = ? AND status IN ('open', 'offered')")
      .get(req.user!.sub);
    if (existing) {
      throw new ApiError(409, "You already have an active request — withdraw it before posting a new one.");
    }

    const result = db
      .prepare("INSERT INTO requests (user_id, category, note) VALUES (?, ?, ?)")
      .run(req.user!.sub, data.category, data.note);

    const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(result.lastInsertRowid) as RequestRow;
    res.status(201).json(serialize(row));
  })
);

// Customer only — their current active request, if any (the Requests tab uses this
// to decide whether to show the "post a request" button or the active-request card).
router.get(
  "/mine",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const row = db
      .prepare(
        "SELECT * FROM requests WHERE user_id = ? AND status IN ('open', 'offered') ORDER BY created_at DESC LIMIT 1"
      )
      .get(req.user!.sub) as RequestRow | undefined;
    res.json(row ? serialize(row) : null);
  })
);

// Customer only — take down an open request. Only while it's still open — once a
// business has offered a slot, the customer resolves that through
// POST /bookings/:id/respond instead.
router.patch(
  "/:id/withdraw",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id) as RequestRow | undefined;
    if (!row) throw new ApiError(404, "Request not found.");
    if (row.user_id !== req.user!.sub) throw new ApiError(403, "That's not your request.");
    if (row.status !== "open") throw new ApiError(400, "This request can't be withdrawn right now.");

    db.prepare("UPDATE requests SET status = 'withdrawn' WHERE id = ?").run(row.id);
    const updated = db.prepare("SELECT * FROM requests WHERE id = ?").get(row.id) as RequestRow;
    res.json(serialize(updated));
  })
);

// Business only — open requests matching this business's own specialty category.
// Oldest first — first in, best dressed.
router.get(
  "/open",
  requireAuth,
  requireRole("business"),
  asyncHandler(async (req, res) => {
    const businessId = req.user?.businessId;
    if (!businessId) throw new ApiError(403, "This account isn't linked to a business.");

    const business = db.prepare("SELECT * FROM businesses WHERE id = ?").get(businessId) as
      | BusinessRow
      | undefined;
    if (!business) throw new ApiError(404, "Business not found.");

    const rows = db
      .prepare(
        `SELECT r.*, u.name AS customer_name
         FROM requests r
         JOIN users u ON u.id = r.user_id
         WHERE r.status = 'open' AND r.category = ?
         ORDER BY r.created_at ASC`
      )
      .all(business.category) as (RequestRow & { customer_name: string })[];

    res.json(
      rows.map((row) => ({
        ...serialize(row),
        customerName: row.customer_name,
      }))
    );
  })
);

// Business only — make an offer against an open request. Creates a private,
// single-capacity listing plus a booking in 'Offered' status, and hides the
// request from other businesses immediately (status flips to 'offered').
const offerSchema = z.object({
  service: z.string().min(1),
  price: z.number().positive(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  slotTime: z.string().min(1),
});

router.post(
  "/:id/offer",
  requireAuth,
  requireRole("business"),
  asyncHandler(async (req, res) => {
    const businessId = req.user?.businessId;
    if (!businessId) throw new ApiError(403, "This account isn't linked to a business.");
    const data = offerSchema.parse(req.body);

    const makeOffer = db.transaction(() => {
      const business = db.prepare("SELECT * FROM businesses WHERE id = ?").get(businessId) as
        | BusinessRow
        | undefined;
      if (!business) throw new ApiError(404, "Business not found.");

      const request = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id) as
        | RequestRow
        | undefined;
      if (!request) throw new ApiError(404, "Request not found.");
      if (request.status !== "open") throw new ApiError(409, "This request isn't open anymore.");
      if (request.category !== business.category) {
        throw new ApiError(403, "This request isn't for your category.");
      }

      db.prepare("UPDATE requests SET status = 'offered' WHERE id = ?").run(request.id);

      const listingResult = db
        .prepare(
          `INSERT INTO listings (business_id, service, category, price, discount_percent, slot_time, capacity)
           VALUES (?, ?, ?, ?, ?, ?, 1)`
        )
        .run(businessId, data.service, business.category, data.price, data.discountPercent ?? null, data.slotTime);

      const bookingResult = db
        .prepare("INSERT INTO bookings (user_id, listing_id, status, request_id) VALUES (?, ?, 'Offered', ?)")
        .run(request.user_id, Number(listingResult.lastInsertRowid), request.id);

      const customer = db.prepare("SELECT name FROM users WHERE id = ?").get(request.user_id) as {
        name: string;
      };

      return {
        bookingId: Number(bookingResult.lastInsertRowid),
        requestId: request.id,
        customerName: customer.name,
        service: data.service,
        price: data.price,
        discountPercent: data.discountPercent ?? null,
        slotTime: data.slotTime,
      };
    });

    const result = makeOffer();
    res.status(201).json(result);
  })
);

export default router;
