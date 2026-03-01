// server/cron/payouts.ts
import cron from "node-cron";
import Stripe from "stripe";
import { db } from "../db";
import { eq, gt, isNotNull, and } from "drizzle-orm";
import { users, payouts } from "@shared/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" as any });

cron.schedule("0 2 * * 1", async () => {
  console.log("Running weekly payouts job...");
  const taskers = await db.select().from(users).where(and(gt(users.wallet_balance_cents, 0), isNotNull(users.stripe_account_id)));
  for (const t of taskers) {
    try {
      const amount = t.wallet_balance_cents;
      if (!amount || amount <= 0) continue;
      const transfer = await stripe.transfers.create({
        amount,
        currency: "usd",
        destination: t.stripe_account_id!,
        description: `Weekly payout to tasker ${t.id}`
      });
      await db.insert(payouts).values({ tasker_id: t.id, amount_cents: amount, stripe_payout_id: transfer.id });
      await db.update(users).set({ wallet_balance_cents: 0 }).where(eq(users.id, t.id));
    } catch (err: any) {
      console.error("Payout error for tasker", t.id, err);
    }
  }
});
