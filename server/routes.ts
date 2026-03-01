import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import jwt from "jsonwebtoken";
import { insertTaskSchema, insertMessageSchema } from "@shared/schema";
import { seedTasks } from "./seed";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault, isPaypalConfigured } from "./paypal-loader";
import paymentsRouter from "./controllers/payments";

const CATEGORY_PRICES: Record<string, number | undefined> = {
  grocery_shopping: undefined,
  dorm_cleaning: undefined,
  laundry: undefined,
  other: undefined,
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Only setup Replit/OpenID auth if credentials are present.
  // This prevents the entire route registration from failing when credentials are missing.
  if (process.env.REPLIT_CLIENT_ID && process.env.REPLIT_CLIENT_SECRET) {
    try {
      await setupAuth(app);
      console.log("Replit/OpenID auth configured");
    } catch (err) {
      console.error("Replit/OpenID setup failed (continuing without it):", err);
    }
  } else {
    console.log("Skipping Replit/OpenID auth: REPLIT_CLIENT_ID/REPLIT_CLIENT_SECRET not set.");
  }
  // Register auth routes only when Replit creds are provided; otherwise skip.
  // Also provide a fallback auth middleware so routes using auth still work in dev.
  let authMiddleware = (_req: any, _res: any, next: any) => next();

  try {
    if (process.env.REPLIT_CLIENT_ID && process.env.REPLIT_CLIENT_SECRET) {
      // register real auth routes (may be async)
      await registerAuthRoutes(app);
      console.log("Replit auth routes registered.");
      // if isAuthenticated is a function provided by the auth module, use it
      if (typeof isAuthenticated === "function") {
        authMiddleware = isAuthenticated;
      }
    } else {
      console.log("Skipping Replit/OpenID auth: REPLIT_CLIENT_ID/REPLIT_CLIENT_SECRET not set. Using local mock auth.");

      // Mock user data for local development
      const mockUser = {
        id: "seed-user-1",
        email: "tommy.trojan@usc.edu",
        firstName: "Tommy",
        lastName: "Trojan",
        profileImageUrl: null
      };

      authMiddleware = (req: any, _res: any, next: any) => {
        req.user = req.user || { claims: { sub: mockUser.id } };
        next();
      };

      const mockToken = jwt.sign({ userId: mockUser.id, roles: ["user"] }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });

      app.get("/api/auth/user", (_req, res) => res.json(mockUser));
      app.get("/api/logout", (_req, res) => res.redirect("/"));
      app.get("/api/login", (_req, res) => res.redirect("/"));
      app.get("/api/auth/mock-token", (_req, res) => res.json({ token: mockToken }));
    }
  } catch (err) {
    console.error("registerAuthRoutes failed (continuing without auth routes):", err);

    const mockUser = {
      id: "seed-user-1",
      email: "tommy.trojan@usc.edu",
      firstName: "Tommy",
      lastName: "Trojan",
      profileImageUrl: null
    };

    authMiddleware = (req: any, _res: any, next: any) => {
      req.user = req.user || { claims: { sub: mockUser.id } };
      next();
    };

    const mockToken = jwt.sign({ userId: mockUser.id, roles: ["user"] }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });

    app.get("/api/auth/user", (_req, res) => res.json(mockUser));
    app.get("/api/logout", (_req, res) => res.redirect("/"));
    app.get("/api/login", (_req, res) => res.redirect("/"));
    app.get("/api/auth/mock-token", (_req, res) => res.json({ token: mockToken }));
  }

  app.get("/api/tasks", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const tasks = await storage.getTasks(category);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/my/posted", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasksByPoster(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching posted tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/my/claimed", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasksByClaimer(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching claimed tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", authMiddleware, async (req: any, res) => {
    try {
      const parsed = insertTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid task data", errors: parsed.error.flatten() });
      }
      const userId = req.user.claims.sub;
      const categoryPrice = CATEGORY_PRICES[parsed.data.category];
      const task = await storage.createTask({ ...parsed.data, budget: categoryPrice ?? parsed.data.budget, posterId: userId });
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.post("/api/tasks/:id/claim", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.claimTask(req.params.id, userId);
      if (!task) return res.status(400).json({ message: "Cannot claim this task" });
      res.json(task);
    } catch (error) {
      console.error("Error claiming task:", error);
      res.status(500).json({ message: "Failed to claim task" });
    }
  });

  app.post("/api/tasks/:id/complete", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.completeTask(req.params.id, userId);
      if (!task) return res.status(400).json({ message: "Cannot complete this task" });
      res.json(task);
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  app.post("/api/tasks/:id/cancel", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.cancelTask(req.params.id, userId);
      if (!task) return res.status(400).json({ message: "Cannot cancel this task" });
      res.json(task);
    } catch (error) {
      console.error("Error cancelling task:", error);
      res.status(500).json({ message: "Failed to cancel task" });
    }
  });

  app.get("/api/tasks/:id/messages", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      if (task.posterId !== userId && task.claimerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view messages" });
      }
      const msgs = await storage.getMessages(req.params.id);
      res.json(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/tasks/:id/messages", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      if (task.posterId !== userId && task.claimerId !== userId) {
        return res.status(403).json({ message: "Not authorized to send messages" });
      }
      if (task.status === "open" || task.status === "cancelled") {
        return res.status(400).json({ message: "Messages only available for claimed/active tasks" });
      }
      const parsed = insertMessageSchema.safeParse({ ...req.body, taskId: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid message", errors: parsed.error.flatten() });
      }
      const message = await storage.createMessage({ ...parsed.data, senderId: userId });
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/payment/config", (_req, res) => {
    res.json({ paypalAvailable: isPaypalConfigured() });
  });

  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  app.post("/api/tasks/:id/payment", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      if (task.posterId !== userId) return res.status(403).json({ message: "Only the poster can update payment" });
      const { paymentStatus, paypalOrderId } = req.body;
      const validStatuses = ["pending", "paid", "failed"];
      if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status. Must be: pending, paid, or failed" });
      }
      const updated = await storage.updatePaymentStatus(req.params.id, paymentStatus, paypalOrderId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  app.get("/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  app.use("/api/payments", paymentsRouter);

  try {
    await seedTasks();
    console.log("Seed completed.");
  } catch (err) {
    console.warn("Seed failed (continuing). If you want seeded data, initialize DB schema first. Error:", err);
  }

  return httpServer;
}
