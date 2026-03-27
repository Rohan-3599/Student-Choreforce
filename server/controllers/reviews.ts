// server/controllers/reviews.ts
import express from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { reviews } from "@shared/schema";
import jwt from "jsonwebtoken";

const router = express.Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

router.post("/", requireAuth, async (req: any, res: any) => {
  try {
    const { tasker_id, rating, body } = req.body;
    const reviewer_id = req.user.userId;
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
