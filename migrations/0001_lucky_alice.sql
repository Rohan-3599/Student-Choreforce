ALTER TABLE "tasks" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."task_category";--> statement-breakpoint
CREATE TYPE "public"."task_category" AS ENUM('dorm_cleaning', 'laundry', 'other');--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "category" SET DATA TYPE "public"."task_category" USING "category"::"public"."task_category";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "profile_image_url" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "photos" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_tasker_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_us_citizen" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "building_name" varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender_preference" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language_preference" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tasker_building_name" varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tasker_gender_preference" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tasker_languages" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_token" varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_expires" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "grocery_items";