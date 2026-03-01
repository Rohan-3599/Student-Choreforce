// server/payments/webhook.ts
import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { transactions, users, tasks } from "@shared/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" as any });
const router = express.Router();

router.post("/", bodyParser.raw({ type: "application/json" }), async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature error", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const taskId = pi.metadata?.taskId ? pi.metadata.taskId : undefined;
      if (taskId) {
        const t = (await db.select().from(tasks).where(eq(tasks.id, taskId)))[0];
        if (t && t.claimerId) {
          const platformFeePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || 0);
          const total = (pi.amount_received || pi.amount) as number;
          const platformFee = Math.round((platformFeePercent / 100) * total);
          const taskerAmount = total - platformFee;
          const u = (await db.select().from(users).where(eq(users.id, t.claimerId)))[0];
          await db.update(users).set({
            wallet_balance_cents: u.wallet_balance_cents + taskerAmount
          }).where(eq(users.id, t.claimerId));

          await db.insert(transactions).values({
            user_id: t.claimerId,
            amount_cents: taskerAmount,
            type: "credit",
            reference: pi.id
          });

          await db.insert(transactions).values({
            user_id: null,
            amount_cents: platformFee,
            type: "platform_fee",
            reference: pi.id
          });
          await db.update(tasks).set({ paymentStatus: "paid", completedAt: new Date() }).where(eq(tasks.id, taskId));
        }
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error", err);
    res.status(500).send();
  }
});

export default router;
