import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const taskCategoryEnum = pgEnum("task_category", [
  "grocery_shopping",
  "dorm_cleaning",
  "laundry",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "claimed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const groceryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  store: z.string(),
  quantity: z.number().min(1).default(1),
});

export type GroceryItemSelection = z.infer<typeof groceryItemSchema>;

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: taskCategoryEnum("category").notNull(),
  status: taskStatusEnum("status").notNull().default("open"),
  budget: integer("budget").notNull(),
  location: text("location").notNull(),
  posterId: varchar("poster_id").notNull().references(() => users.id),
  claimerId: varchar("claimer_id").references(() => users.id),
  groceryItems: jsonb("grocery_items"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  poster: one(users, { fields: [tasks.posterId], references: [users.id], relationName: "postedTasks" }),
  claimer: one(users, { fields: [tasks.claimerId], references: [users.id], relationName: "claimedTasks" }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  postedTasks: many(tasks, { relationName: "postedTasks" }),
  claimedTasks: many(tasks, { relationName: "claimedTasks" }),
}));

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  status: true,
  posterId: true,
  claimerId: true,
  createdAt: true,
  completedAt: true,
}).extend({
  budget: z.number().min(1, "Budget must be at least $1"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  groceryItems: z.array(groceryItemSchema).optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type TaskCategory = "grocery_shopping" | "dorm_cleaning" | "laundry";
export type TaskStatus = "open" | "claimed" | "in_progress" | "completed" | "cancelled";
