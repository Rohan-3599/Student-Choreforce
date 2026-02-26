import { tasks, type Task, type InsertTask, messages, type Message, type InsertMessage } from "@shared/schema";
import { users, type User } from "@shared/models/auth";
import { db } from "./db";
import { eq, desc, and, asc } from "drizzle-orm";

export interface IStorage {
  getTasks(category?: string): Promise<(Task & { poster?: User | null })[]>;
  getTask(id: string): Promise<(Task & { poster?: User | null; claimer?: User | null }) | undefined>;
  createTask(task: InsertTask & { posterId: string }): Promise<Task>;
  claimTask(taskId: string, claimerId: string): Promise<Task | undefined>;
  completeTask(taskId: string, userId: string): Promise<Task | undefined>;
  cancelTask(taskId: string, userId: string): Promise<Task | undefined>;
  getTasksByPoster(posterId: string): Promise<(Task & { poster?: User | null })[]>;
  getTasksByClaimer(claimerId: string): Promise<(Task & { poster?: User | null })[]>;
  getMessages(taskId: string): Promise<(Message & { sender?: User | null })[]>;
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message & { sender?: User | null }>;
  updatePaymentStatus(taskId: string, paymentStatus: string, paypalOrderId?: string): Promise<Task | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getTasks(category?: string): Promise<(Task & { poster?: User | null })[]> {
    const conditions = category ? and(eq(tasks.category, category as any)) : undefined;
    const taskRows = await db
      .select()
      .from(tasks)
      .where(conditions)
      .orderBy(desc(tasks.createdAt));

    return this.attachPosters(taskRows);
  }

  async getTask(id: string): Promise<(Task & { poster?: User | null; claimer?: User | null }) | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return undefined;

    const [poster] = task.posterId
      ? await db.select().from(users).where(eq(users.id, task.posterId))
      : [null];
    const [claimer] = task.claimerId
      ? await db.select().from(users).where(eq(users.id, task.claimerId))
      : [null];

    return { ...task, poster: poster ?? null, claimer: claimer ?? null };
  }

  async createTask(task: InsertTask & { posterId: string }): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async claimTask(taskId: string, claimerId: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task || task.status !== "open") return undefined;
    if (task.posterId === claimerId) return undefined;

    const [updated] = await db
      .update(tasks)
      .set({ claimerId, status: "claimed" })
      .where(eq(tasks.id, taskId))
      .returning();
    return updated;
  }

  async completeTask(taskId: string, userId: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) return undefined;
    if (task.status !== "claimed" && task.status !== "in_progress") return undefined;
    if (task.posterId !== userId && task.claimerId !== userId) return undefined;

    const [updated] = await db
      .update(tasks)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();
    return updated;
  }

  async cancelTask(taskId: string, userId: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task || task.status !== "open" || task.posterId !== userId) return undefined;

    const [updated] = await db
      .update(tasks)
      .set({ status: "cancelled" })
      .where(eq(tasks.id, taskId))
      .returning();
    return updated;
  }

  async getTasksByPoster(posterId: string): Promise<(Task & { poster?: User | null })[]> {
    const taskRows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.posterId, posterId))
      .orderBy(desc(tasks.createdAt));
    return this.attachPosters(taskRows);
  }

  async getTasksByClaimer(claimerId: string): Promise<(Task & { poster?: User | null })[]> {
    const taskRows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.claimerId, claimerId))
      .orderBy(desc(tasks.createdAt));
    return this.attachPosters(taskRows);
  }

  async getMessages(taskId: string): Promise<(Message & { sender?: User | null })[]> {
    const messageRows = await db
      .select()
      .from(messages)
      .where(eq(messages.taskId, taskId))
      .orderBy(asc(messages.createdAt));

    const senderIds = [...new Set(messageRows.map((m) => m.senderId).filter(Boolean))];
    const senderMap = new Map<string, User>();
    for (const id of senderIds) {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (user) senderMap.set(id, user);
    }

    return messageRows.map((msg) => ({
      ...msg,
      sender: senderMap.get(msg.senderId) ?? null,
    }));
  }

  async createMessage(message: InsertMessage & { senderId: string }): Promise<Message & { sender?: User | null }> {
    const [created] = await db.insert(messages).values(message).returning();
    const [sender] = await db.select().from(users).where(eq(users.id, message.senderId));
    return { ...created, sender: sender ?? null };
  }

  async updatePaymentStatus(taskId: string, paymentStatus: string, paypalOrderId?: string): Promise<Task | undefined> {
    const updateData: any = { paymentStatus };
    if (paypalOrderId) updateData.paypalOrderId = paypalOrderId;
    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();
    return updated;
  }

  private async attachPosters(taskRows: Task[]): Promise<(Task & { poster?: User | null })[]> {
    const posterIds = [...new Set(taskRows.map((t) => t.posterId).filter(Boolean))];
    const posterMap = new Map<string, User>();

    if (posterIds.length > 0) {
      for (const id of posterIds) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        if (user) posterMap.set(id, user);
      }
    }

    return taskRows.map((task) => ({
      ...task,
      poster: posterMap.get(task.posterId) ?? null,
    }));
  }
}

export const storage = new DatabaseStorage();
