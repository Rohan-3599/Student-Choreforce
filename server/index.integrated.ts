// server/index.integrated.ts - mounts new routes without modifying your existing index.ts
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import usersRouter from "./controllers/users";
import reviewsRouter from "./controllers/reviews";
import paymentsRouter from "./controllers/payments";
import stripeWebhook from "./payments/webhook";
import taskerOnboard from "./tasker/onboard";
import "./cron/payouts";

export function mountIntegratedRoutes(app: express.Express) {
    app.use(bodyParser.json());
    app.use(cors());
    // Removed redundant JWT-based /auth mount
    app.use("/api/users", usersRouter);
    app.use("/api/reviews", reviewsRouter);
    app.use("/api/payments", paymentsRouter);
    app.use("/stripe/webhook", stripeWebhook);
    app.use("/tasker", taskerOnboard);
}
