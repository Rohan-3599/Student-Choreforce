import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { users, type User } from "@shared/models/auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";

export async function comparePasswords(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PostgresStore = connectPg(session);
  const sessionStore = new PostgresStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl / 1000,
    tableName: "sessions",
  });

  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "default_secret",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        secure: app.get("env") === "production",
        sameSite: "lax",
        maxAge: sessionTtl,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (username, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.email, username));
        if (!user || !user.password_hash) {
          return done(null, false, { message: "Invalid email or password" });
        }
        const isMatch = await comparePasswords(password, user.password_hash);
        if (!isMatch) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { email, password, first_name, last_name, birth_date, gender, usc_id, languages } = req.body;

      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const [newUser] = await db.insert(users).values({
        email,
        password_hash: hashedPassword,
        firstName: first_name,
        lastName: last_name,
        birth_date,
        gender,
        usc_id,
        languages: languages || [],
      }).returning();

      req.login(newUser, (err) => {
        if (err) return next(err);
        res.status(201).json(newUser);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}
