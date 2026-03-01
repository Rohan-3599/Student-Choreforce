// index.integrated.ts - mounts new routes without modifying your existing index.ts
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRouter from "./controllers/auth";
import usersRouter from "./controllers/users";
import reviewsRouter from "./controllers/reviews";
import paymentsRouter from "./controllers/payments";
import stripeWebhook from "./payments/webhook";
import taskerOnboard from "./tasker/onboard";
import "./cron/payouts";

export function mountIntegratedRoutes(app: express.Express) {
    app.use(bodyParser.json());
    app.use(cors());
    app.use("/auth", authRouter);
    app.use("/api/users", usersRouter);
    app.use("/api/reviews", reviewsRouter);
    app.use("/payments", paymentsRouter);
    app.use("/stripe/webhook", stripeWebhook);
    app.use("/tasker", taskerOnboard);
}
