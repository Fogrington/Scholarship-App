import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import type { UserRow, BusinessRow } from "../types.js";

const router = Router();

// Public self-registration is customer-only, on purpose — admin and business
// accounts are created deliberately (seeded, or via the admin-only endpoint on
// /businesses/:id/account), not something anyone can grant themselves over the API.
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  name: z.string().min(1),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      throw new ApiError(409, "An account with that email already exists.");
    }

    const password_hash = hashPassword(password);
    const result = db
      .prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'customer')")
      .run(email, password_hash, name);

    const token = signToken({ sub: Number(result.lastInsertRowid), role: "customer", email });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, email, name, role: "customer" } });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new ApiError(401, "Incorrect email or password.");
    }

    const tokenPayload: { sub: number; role: UserRow["role"]; email: string; businessId?: number } = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };

    let businessName: string | undefined;
    if (user.role === "business" && user.business_id) {
      tokenPayload.businessId = user.business_id;
      const business = db.prepare("SELECT * FROM businesses WHERE id = ?").get(user.business_id) as
        | BusinessRow
        | undefined;
      businessName = business?.name;
    }

    const token = signToken(tokenPayload);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ...(user.business_id ? { businessId: user.business_id } : {}),
        ...(businessName ? { businessName } : {}),
      },
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = db
      .prepare("SELECT id, email, name, role, business_id FROM users WHERE id = ?")
      .get(req.user!.sub);
    if (!user) throw new ApiError(404, "User not found.");
    res.json({ user });
  })
);

export default router;
