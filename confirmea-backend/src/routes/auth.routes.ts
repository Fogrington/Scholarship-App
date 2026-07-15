import { Router } from "express";
import { z } from "zod";
import db from "../db/index.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import type { UserRow } from "../types.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  name: z.string().min(1),
  role: z.enum(["customer", "admin"]).optional().default("customer"),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, name, role } = registerSchema.parse(req.body);

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      throw new ApiError(409, "An account with that email already exists.");
    }

    const password_hash = hashPassword(password);
    const result = db
      .prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)")
      .run(email, password_hash, name, role);

    const token = signToken({ sub: Number(result.lastInsertRowid), role, email });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, email, name, role } });
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

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = db.prepare("SELECT id, email, name, role FROM users WHERE id = ?").get(req.user!.sub);
    if (!user) throw new ApiError(404, "User not found.");
    res.json({ user });
  })
);

export default router;
