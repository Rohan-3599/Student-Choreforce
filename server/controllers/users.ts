// server/controllers/users.ts
import express from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users, reviews, payment_methods } from "@shared/schema";

const router = express.Router();

function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

router.get("/tasker/:id", async (req, res) => {
  const id = req.params.id;
  const q = await db.select().from(users).where(eq(users.id, id));
  if (!q.length) return res.status(404).json({ error: "Not found" });
  const u = q[0];
  const r = await db.select().from(reviews).where(eq(reviews.tasker_id, id));
  const avg = r.length
    ? r.reduce((s: any, row: any) => s + row.rating, 0) / r.length
    : null;
  res.json({ user: u, reviews: r, average_rating: avg });
});

router.put("/me", requireAuth, async (req: any, res: any) => {
  const uid = req.user.id;
  const { first_name, last_name, birth_date, gender, languages, usc_id } =
    req.body;
  await db
    .update(users)
    .set({
      firstName: first_name,
      lastName: last_name,
      birth_date,
      gender,
      languages,
      usc_id,
    })
    .where(eq(users.id, uid));
  const updated = await db.select().from(users).where(eq(users.id, uid));
  res.json({ user: updated[0] });
});

router.get("/me", requireAuth, async (req: any, res: any) => {
  const uid = req.user.id;
  const u = await db.select().from(users).where(eq(users.id, uid));
  res.json({ user: u[0] });
});

router.get("/me/payment-methods", requireAuth, async (req: any, res: any) => {
  const uid = req.user.id;
  const pm = await db
    .select()
    .from(payment_methods)
    .where(eq(payment_methods.user_id, uid));
  res.json({ methods: pm });
});

export default router;
