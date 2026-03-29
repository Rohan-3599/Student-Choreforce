// server/controllers/reviews.ts
import express from "express";
import { db } from "../db";
import { reviews } from "@shared/schema";

const router = express.Router();

function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

router.post("/", requireAuth, async (req: any, res: any) => {
  try {
    const { tasker_id, rating, body } = req.body;
    const reviewer_id = req.user.id;
    const insert = await db
      .insert(reviews)
      .values({ tasker_id, reviewer_id, rating, body })
      .returning();
    res.json({ review: insert[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
