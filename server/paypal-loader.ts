import type { Request, Response } from "express";

const PAYPAL_AVAILABLE = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

let paypalModule: any = null;

async function getPaypal() {
  if (!paypalModule) {
    paypalModule = await import("./paypal");
  }
  return paypalModule;
}

export function isPaypalConfigured() {
  return PAYPAL_AVAILABLE;
}

export async function createPaypalOrder(req: Request, res: Response) {
  if (!PAYPAL_AVAILABLE) {
    return res.status(503).json({ error: "PayPal is not configured. Please add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET." });
  }
  const pp = await getPaypal();
  return pp.createPaypalOrder(req, res);
}

export async function capturePaypalOrder(req: Request, res: Response) {
  if (!PAYPAL_AVAILABLE) {
    return res.status(503).json({ error: "PayPal is not configured." });
  }
  const pp = await getPaypal();
  return pp.capturePaypalOrder(req, res);
}

export async function loadPaypalDefault(req: Request, res: Response) {
  if (!PAYPAL_AVAILABLE) {
    return res.status(503).json({ error: "PayPal is not configured." });
  }
  const pp = await getPaypal();
  return pp.loadPaypalDefault(req, res);
}
