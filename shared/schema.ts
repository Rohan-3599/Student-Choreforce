import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const taskCategoryEnum = pgEnum("task_category", [
  "grocery_shopping",
  "dorm_cleaning",
  "laundry",
  "other",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "claimed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "paypal",
  "venmo",
  "zelle",
  "cashapp",
  "credit_card",
  "apple_pay",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
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
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paypalOrderId: text("paypal_order_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
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

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  task: one(tasks, { fields: [messages.taskId], references: [tasks.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  senderId: true,
  createdAt: true,
}).extend({
  content: z.string().min(1, "Message cannot be empty").max(1000),
  taskId: z.string().min(1),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

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
  paymentMethod: z.enum(["paypal", "venmo", "zelle", "cashapp", "credit_card", "apple_pay"]).optional(),
  stripePaymentIntentId: z.string().optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type TaskCategory = "grocery_shopping" | "dorm_cleaning" | "laundry" | "other";
export type TaskStatus = "open" | "claimed" | "in_progress" | "completed" | "cancelled";
export type PaymentMethod = "paypal" | "venmo" | "zelle" | "cashapp" | "credit_card" | "apple_pay";
export type PaymentStatus = "pending" | "paid" | "failed";

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tasker_id: varchar("tasker_id").references(() => users.id),
  reviewer_id: varchar("reviewer_id").references(() => users.id),
  rating: integer("rating"),
  body: text("body"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const payment_methods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id),
  stripe_payment_method_id: varchar("stripe_payment_method_id", { length: 128 }),
  brand: varchar("brand", { length: 64 }),
  last4: varchar("last4", { length: 8 }),
  exp_month: integer("exp_month"),
  exp_year: integer("exp_year"),
  is_default: boolean("is_default").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id),
  amount_cents: integer("amount_cents"),
  type: varchar("type", { length: 64 }),
  reference: varchar("reference", { length: 255 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tasker_id: varchar("tasker_id").references(() => users.id),
  amount_cents: integer("amount_cents"),
  stripe_payout_id: varchar("stripe_payout_id", { length: 128 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
