import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertTaskSchema, insertMessageSchema } from "@shared/schema";
import { seedTasks } from "./seed";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault, isPaypalConfigured } from "./paypal-loader";

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
  await setupAuth(app);
  registerAuthRoutes(app);

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

  app.get("/api/tasks/my/posted", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasksByPoster(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching posted tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/my/claimed", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/tasks/:id/claim", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/tasks/:id/complete", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/tasks/:id/cancel", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/tasks/:id/messages", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/tasks/:id/messages", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/tasks/:id/payment", isAuthenticated, async (req: any, res) => {
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

  await seedTasks();

  return httpServer;
}
