# TaskForce - USC Student Chore Marketplace

## Overview
TaskForce is a web application for USC students to post and claim chore tasks. Students can pay fellow Trojans to help with grocery shopping, dorm cleaning, and laundry. Fixed pricing per category. Includes an Instacart-style grocery shopping experience for Trader Joe's and Target at USC Village.

## Recent Changes
- 2026-02-23: Built Instacart-style grocery shop (/shop) with store selection, product browsing, search, cart, and checkout
- 2026-02-23: Added grocery item selection from Trader Joe's and Target at USC Village with real prices
- 2026-02-23: Added fixed prices per category, split into Requester and Tasker pages
- 2026-02-23: Initial MVP build with auth, task CRUD, seed data, USC-themed design

## Architecture
- **Frontend**: React + Vite + Tailwind + shadcn/ui with wouter routing
- **Backend**: Express.js with Drizzle ORM + PostgreSQL
- **Auth**: Replit Auth (OpenID Connect) via `server/replit_integrations/auth/`

## Key Files
- `shared/schema.ts` - Data models (tasks, users, messages, enums, groceryItemSchema)
- `client/src/components/task-chat.tsx` - In-app messaging component
- `shared/models/auth.ts` - Auth-related models (users, sessions)
- `server/routes.ts` - API endpoints (enforces fixed pricing on create)
- `server/storage.ts` - Database operations (DatabaseStorage)
- `server/seed.ts` - Seed data for demo tasks
- `client/src/App.tsx` - Root component with auth-based routing
- `client/src/pages/landing.tsx` - Landing page for logged-out users
- `client/src/pages/requester.tsx` - Requester dashboard (post/manage tasks)
- `client/src/pages/tasker.tsx` - Tasker dashboard (browse/claim tasks)
- `client/src/pages/shop.tsx` - Instacart-style grocery shop (store selection, browse, cart, checkout)
- `client/src/lib/constants.ts` - Category config with fixed prices
- `client/src/lib/grocery-catalog.ts` - Grocery catalog (100+ items from TJ's and Target with prices)

## Fixed Prices
- Grocery Shopping: 10% service charge + 15% delivery fee (percentage of grocery bill)
- Dorm Cleaning: Basic Organizing $20 base / Deep Room Clean $45 base + $15/hr after 1st hour
- Laundry: $20/load + $5/load optional folding

## Pages
- `/` (logged out) - Landing page with pricing info
- `/` (logged in) - Requester page: post tasks, manage Open/Active/Past tabs
- `/tasker` - Tasker page: browse open tasks, view My Jobs/Completed tabs
- `/shop` - Grocery shop: pick store, browse items, add to cart, checkout
- `/laundry` - Laundry service: configure loads, wash/dry options, washer/dryer settings
- `/cleaning` - Dorm cleaning: Basic Organizing ($20) or Deep Room Clean ($45) + $15/hr after first hour
- `/custom` - Custom tasks: user-defined title, description, price ($5-$500), and location

## In-App Messaging
- Chat available between requester and tasker once a task is claimed
- Messages table stores all messages with sender info
- Chat component embedded in task detail dialog
- Auto-refreshes every 5 seconds for near-real-time updates
- Only accessible to the poster and claimer of a task

## API Routes
- `GET /api/tasks?category=` - List tasks (optional category filter)
- `GET /api/tasks/:id` - Get single task with poster/claimer info
- `POST /api/tasks` - Create task (auth required, budget auto-set from category, accepts groceryItems)
- `POST /api/tasks/:id/claim` - Claim a task (auth required)
- `POST /api/tasks/:id/complete` - Mark task complete (auth required, poster or claimer)
- `POST /api/tasks/:id/cancel` - Cancel a task (auth required)
- `GET /api/tasks/my/posted` - User's posted tasks (auth required)
- `GET /api/tasks/my/claimed` - User's claimed tasks (auth required)
- `GET /api/tasks/:id/messages` - Get messages for a task (auth required, poster or claimer only)
- `POST /api/tasks/:id/messages` - Send message on a task (auth required, poster or claimer only)

## Task Categories
- grocery_shopping, dorm_cleaning, laundry, other

## Task Statuses
- open, claimed, in_progress, completed, cancelled

## Grocery Shop Features
- Store selection: Trader Joe's and Target at USC Village
- Category sidebar: Produce, Dairy, Snacks, Frozen, Pantry, Bakery, Beverages, Meat, Prepared Foods, Household
- Product search with live filtering
- Cart with quantity controls, subtotal, service fee, and total
- Checkout dialog with delivery location and optional notes
- Creates grocery_shopping task with groceryItems JSON data

## Design
- USC Cardinal (#990000) as primary color
- USC Gold (#FFCC00) as secondary color
- Plus Jakarta Sans font family
