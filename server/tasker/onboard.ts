// server/tasker/onboard.ts
import express from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" as any });

const router = express.Router();

router.post("/register", async (req: any, res: any) => {
  try {
    const { userId } = req.body;
    const u = (await db.select().from(users).where(eq(users.id, userId)))[0];
    if (!u) return res.status(404).json({ error: "User not found" });
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: u.email!,
      business_type: "individual",
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } }
    });
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/tasker/onboard/refresh`,
      return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/tasker/onboard/complete`,
      type: "account_onboarding",
    });
    await db.update(users).set({ stripe_account_id: account.id, roles: ["user", "tasker"] }).where(eq(users.id, userId));
    res.json({ url: accountLink.url, accountId: account.id });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
