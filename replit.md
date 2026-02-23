# TaskForce - USC Student Chore Marketplace

## Overview
TaskForce is a web application for USC students to post and claim chore tasks. Students can pay fellow Trojans to help with grocery shopping, dorm cleaning, and laundry.

## Recent Changes
- 2026-02-23: Initial MVP build with auth, task CRUD, seed data, USC-themed design

## Architecture
- **Frontend**: React + Vite + Tailwind + shadcn/ui with wouter routing
- **Backend**: Express.js with Drizzle ORM + PostgreSQL
- **Auth**: Replit Auth (OpenID Connect) via `server/replit_integrations/auth/`

## Key Files
- `shared/schema.ts` - Data models (tasks, users, enums)
- `shared/models/auth.ts` - Auth-related models (users, sessions)
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations (DatabaseStorage)
- `server/seed.ts` - Seed data for demo tasks
- `client/src/App.tsx` - Root component with auth-based routing
- `client/src/pages/landing.tsx` - Landing page for logged-out users
- `client/src/pages/home.tsx` - Task board for logged-in users
- `client/src/pages/my-tasks.tsx` - User's posted/claimed tasks

## API Routes
- `GET /api/tasks?category=` - List tasks (optional category filter)
- `GET /api/tasks/:id` - Get single task with poster/claimer info
- `POST /api/tasks` - Create task (auth required)
- `POST /api/tasks/:id/claim` - Claim a task (auth required)
- `POST /api/tasks/:id/complete` - Mark task complete (auth required)
- `POST /api/tasks/:id/cancel` - Cancel a task (auth required)
- `GET /api/tasks/my/posted` - User's posted tasks (auth required)
- `GET /api/tasks/my/claimed` - User's claimed tasks (auth required)

## Task Categories
- grocery_shopping, dorm_cleaning, laundry

## Task Statuses
- open, claimed, in_progress, completed, cancelled

## Design
- USC Cardinal (#990000) as primary color
- USC Gold (#FFCC00) as secondary color
- Plus Jakarta Sans font family
