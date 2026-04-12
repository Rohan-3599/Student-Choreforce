import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean, text, integer, json } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  email_verified: boolean("email_verified").notNull().default(false),
  isTaskerVerified: boolean("is_tasker_verified").notNull().default(false),
  password_hash: text("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  birth_date: varchar("birth_date", { length: 50 }),
  gender: varchar("gender", { length: 32 }),
  usc_id: varchar("usc_id", { length: 64 }),
  languages: json("languages").$type<string[]>(),
  roles: json("roles").$type<string[]>().notNull().default(["user"]),
  profileImageUrl: text("profile_image_url"),
  is_us_citizen: boolean("is_us_citizen").notNull().default(false),
  building_name: varchar("building_name", { length: 128 }),
  gender_preference: varchar("gender_preference", { length: 32 }),
  language_preference: varchar("language_preference", { length: 64 }),
  taskerBuildingName: varchar("tasker_building_name", { length: 128 }),
  taskerGenderPreference: varchar("tasker_gender_preference", { length: 32 }),
  taskerLanguages: jsonb("tasker_languages").$type<string[]>(),
  reset_password_token: varchar("reset_password_token", { length: 128 }),
  reset_password_expires: timestamp("reset_password_expires"),
  stripe_customer_id: varchar("stripe_customer_id", { length: 128 }),
  stripe_account_id: varchar("stripe_account_id", { length: 128 }),
  wallet_balance_cents: integer("wallet_balance_cents").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
