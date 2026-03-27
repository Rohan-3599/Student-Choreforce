// server/controllers/payments.ts
import express from "express";
import Stripe from "stripe";
import { db } from "../db";
import { payment_methods } from "@shared/schema";
import jwt from "jsonwebtoken";

const router = express.Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
}

function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  console.log("Auth header:", auth);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.replace("Bearer ", "");
  console.log("Token:", token);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireStripe(req: any, res: any, next: any) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: "Stripe is not configured" });
  }
  next();
}

router.post(
  "/create-setup-intent",
  requireAuth,
  requireStripe,
  async (req: any, res: any) => {
    try {
      const stripe = getStripe();
      const userId = req.user.userId;
      const { createOrRetrieveCustomer } = await import("../payments/stripe");
      const customerId = await createOrRetrieveCustomer(userId);
      const si = await stripe.setupIntents.create({ customer: customerId });
      res.json({ client_secret: si.client_secret });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.post(
  "/save-payment-method",
  requireAuth,
  requireStripe,
  async (req: any, res: any) => {
    try {
      const stripe = getStripe();
      const { payment_method } = req.body;
      const userId = req.user.userId;
      const { createOrRetrieveCustomer } = await import("../payments/stripe");
      const custId = await createOrRetrieveCustomer(userId);
      await stripe.paymentMethods.attach(payment_method, { customer: custId });
      const pm = await stripe.paymentMethods.retrieve(payment_method);
      if (!pm.card) {
        return res
          .status(400)
          .json({ error: "Invalid card details provided." });
      }
      await db.insert(payment_methods).values({
        user_id: userId,
        stripe_payment_method_id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
        is_default: false,
      });
      res.json({ saved: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.post(
  "/create-payment-intent",
  requireAuth,
  requireStripe,
  async (req: any, res: any) => {
    try {
      const stripe = getStripe();
      const { amount } = req.body;
      const userId = req.user.userId;

      if (!amount || amount <= 0)
        return res.status(400).json({ error: "Invalid amount" });

      const { createOrRetrieveCustomer } = await import("../payments/stripe");
      const customerId = await createOrRetrieveCustomer(userId);

      const customerSession = await stripe.customerSessions.create({
        customer: customerId,
        components: {
          payment_element: {
            enabled: true,
            features: {
              payment_method_redisplay: 'enabled',
              payment_method_save: 'enabled',
              payment_method_remove: 'enabled',
              payment_method_save_usage: 'on_session',
            },
          },
        },
      } as any);

      const intent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        customer: customerId,
        setup_future_usage: "on_session",
        automatic_payment_methods: {
          enabled: true,
        },
      } as any);

      res.json({ 
        clientSecret: intent.client_secret,
        customerSessionClientSecret: customerSession.client_secret
      });
    } catch (e: any) {
      console.error("Stripe error:", e);
      res.status(500).json({ error: e.message });
    }
  },
);

export default router;
