import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertTaskSchema } from "@shared/schema";
import { seedTasks } from "./seed";

const CATEGORY_PRICES: Record<string, number | undefined> = {
  grocery_shopping: undefined,
  dorm_cleaning: 35,
  laundry: undefined,
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

  await seedTasks();

  return httpServer;
}
