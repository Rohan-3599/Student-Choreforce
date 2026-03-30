import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import sgMail from "@sendgrid/mail";
import { users, type User } from "@shared/models/auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function comparePasswords(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export function setupAuth(app: Express) {
  const TTL_DEFAULT = 24 * 60 * 60 * 1000;       // 24 hours
  const TTL_REMEMBER = 7 * 24 * 60 * 60 * 1000;  // 7 days
  const PostgresStore = connectPg(session);
  const sessionStore = new PostgresStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: TTL_REMEMBER / 1000, // store can hold up to 7d; actual cookie controls real expiry
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
        maxAge: TTL_DEFAULT, // default: 24h
      },
    })
  );

  // Expose TTLs so the login route can reference them
  const SESSION_TTLS = { default: TTL_DEFAULT, remember: TTL_REMEMBER };

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

      // Enforce USC domain
      if (!email || !email.toLowerCase().endsWith("@usc.edu")) {
        return res.status(400).json({ message: "Only @usc.edu email addresses are allowed." });
      }

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

      // Send verification email
      const verifyToken = Buffer.from(JSON.stringify({ id: newUser.id, email: newUser.email })).toString("base64url");
      const verifyUrl = `${req.protocol}://${req.get("host")}/api/auth/verify-email?token=${verifyToken}`;
      const sgKey = process.env.SENDGRID_API_KEY;
      if (sgKey && sgKey.startsWith("SG.")) {
        try {
          await sgMail.send({
            to: email,
            from: process.env.EMAIL_FROM || "noreply@choreforce.com",
            subject: "Verify your Student Choreforce email",
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
                <h2 style="color:#4f46e5;">Welcome to Student Choreforce!</h2>
                <p>Click the button below to verify your USC email address and activate your account.</p>
                <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Verify Email</a>
                <p style="color:#888;font-size:12px;">If you didn't sign up, you can safely ignore this email.</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.warn("SendGrid email failed:", emailErr);
        }
      } else {
        console.log(`[DEV] Verification link for ${email}: ${verifyUrl}`);
      }

      // Do NOT auto-login — user must verify email first
      res.status(201).json({ message: "Account created. Please check your USC email to verify your account before logging in." });
    } catch (err) {
      next(err);
    }
  });

  // Email verification route
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).send("Missing or invalid token.");
      }
      const payload = JSON.parse(Buffer.from(token, "base64url").toString());
      if (!payload?.id) return res.status(400).send("Invalid token.");

      await db.update(users).set({ email_verified: true }).where(eq(users.id, payload.id));
      // Redirect to login with success flag
      return res.redirect("/?verified=1");
    } catch {
      return res.status(400).send("Invalid or expired verification link.");
    }
  });

  app.post("/api/auth/resend-verification", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const verifyToken = Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString("base64url");
    const verifyUrl = `${req.protocol}://${req.get("host")}/api/auth/verify-email?token=${verifyToken}`;
    const sgKey = process.env.SENDGRID_API_KEY;

    if (sgKey && sgKey.startsWith("SG.")) {
      try {
        await sgMail.send({
          to: user.email as string,
          from: process.env.EMAIL_FROM || "noreply@choreforce.com",
          subject: "Verify your Student Choreforce email",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
              <h2 style="color:#4f46e5;">Welcome to Student Choreforce!</h2>
              <p>Click the button below to verify your USC email address and activate your account.</p>
              <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Verify Email</a>
              <p style="color:#888;font-size:12px;">If you didn't sign up, you can safely ignore this email.</p>
            </div>
          `,
        });
        return res.status(200).json({ message: "Verification email sent" });
      } catch (emailErr) {
        console.warn("SendGrid email failed:", emailErr);
        return res.status(500).json({ message: "Failed to send email" });
      }
    } else {
      console.log(`[DEV] Resend Verification link for ${user.email}: ${verifyUrl}`);
      return res.status(200).json({ message: "Verification email sent (dev)" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      
      // Block unverified accounts
      if (!user.email_verified) {
        return res.status(403).json({
          message: "Please verify your email before logging in. Check your @usc.edu inbox for the verification link.",
          email: user.email
        });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        // Dynamically set cookie lifetime based on "Stay logged in"
        const rememberMe = req.body.rememberMe === true || req.body.rememberMe === "true";
        req.session.cookie.maxAge = rememberMe ? SESSION_TTLS.remember : SESSION_TTLS.default;
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

  app.post("/api/auth/verify-tasker", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      // In a real app we'd trigger a Stripe Identity flow or manual review here.
      // For MVP, we approve the verification process immediately.
      const currentUser = req.user as User;
      
      const [updatedUser] = await db
        .update(users)
        .set({ isTaskerVerified: true })
        .where(eq(users.id, currentUser.id))
        .returning();

      return res.status(200).json(updatedUser);
    } catch (err) {
      console.error("Tasker verification error:", err);
      return res.status(500).json({ message: "Tasker verification failed." });
    }
  });
}
