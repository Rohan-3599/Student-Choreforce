// server/payments/stripe.ts
import Stripe from "stripe";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users, payment_methods, transactions, tasks } from "@shared/schema";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  }
});

export async function createOrRetrieveCustomer(userId: string, email?: string) {
  const s = getStripe();
  const u = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (u.stripe_customer_id) return u.stripe_customer_id;
  const customer = await s.customers.create({ email: email || u.email || undefined, metadata: { userId: String(userId) } });
  await db.update(users).set({ stripe_customer_id: customer.id }).where(eq(users.id, userId));
  return customer.id;
}

export async function createSetupIntent(userId: string) {
  const s = getStripe();
  const customerId = await createOrRetrieveCustomer(userId);
  const intent = await s.setupIntents.create({ customer: customerId });
  return intent;
}

export async function createPaymentIntentForTask({ taskId, payment_method }: { taskId: string, payment_method?: string }) {
  const s = getStripe();
  const t = (await db.select().from(tasks).where(eq(tasks.id, taskId)))[0];
  if (!t) throw new Error("Task not found");
  const amount = t.budget;
  const pi = await s.paymentIntents.create({
    amount,
    currency: "usd",
    payment_method: payment_method,
    confirm: true,
    metadata: { taskId: String(taskId) }
  });
  return pi;
}
