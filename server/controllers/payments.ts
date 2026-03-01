// server/controllers/payments.ts
import express from "express";
import { createSetupIntent, createOrRetrieveCustomer, stripe } from "../payments/stripe";
import { db } from "../db";
import { payment_methods } from "@shared/schema";
import jwt from "jsonwebtoken";

const router = express.Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    next();
  } catch (e) { return res.status(401).json({ error: "Invalid token" }); }
}

router.post("/create-setup-intent", requireAuth, async (req: any, res: any) => {
  const si = await createSetupIntent(req.user.userId);
  res.json({ client_secret: si.client_secret });
});

router.post("/save-payment-method", requireAuth, async (req: any, res: any) => {
  const { payment_method } = req.body;
  const userId = req.user.userId;
  const custId = await createOrRetrieveCustomer(userId);
  await stripe.paymentMethods.attach(payment_method, { customer: custId });
  const pm = await stripe.paymentMethods.retrieve(payment_method);
  if (!pm.card) {
    return res.status(400).json({ error: "Invalid card details provided." });
  }
  await db.insert(payment_methods).values({
    user_id: userId,
    stripe_payment_method_id: pm.id,
    brand: pm.card.brand,
    last4: pm.card.last4,
    exp_month: pm.card.exp_month,
    exp_year: pm.card.exp_year,
    is_default: false
  });
  res.json({ saved: true });
});

router.post("/create-payment-intent", requireAuth, async (req: any, res: any) => {
  try {
    const { amount } = req.body; // in cents
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const intent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (e: any) {
    console.error("Stripe error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
