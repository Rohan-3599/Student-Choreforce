// server/payments/stripe.ts
import Stripe from "stripe";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users, payment_methods, transactions, tasks } from "@shared/schema";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" as any });

export async function createOrRetrieveCustomer(userId: string, email?: string) {
  const u = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (u.stripe_customer_id) return u.stripe_customer_id;
  const customer = await stripe.customers.create({ email: email || u.email || undefined, metadata: { userId: String(userId) } });
  await db.update(users).set({ stripe_customer_id: customer.id }).where(eq(users.id, userId));
  return customer.id;
}

export async function createSetupIntent(userId: string) {
  const customerId = await createOrRetrieveCustomer(userId);
  const intent = await stripe.setupIntents.create({ customer: customerId });
  return intent;
}

export async function createPaymentIntentForTask({ taskId, payment_method }: { taskId: string, payment_method?: string }) {
  const t = (await db.select().from(tasks).where(eq(tasks.id, taskId)))[0];
  if (!t) throw new Error("Task not found");
  const amount = t.budget;
  const pi = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    payment_method: payment_method,
    confirm: true,
    metadata: { taskId: String(taskId) }
  });
  return pi;
}
