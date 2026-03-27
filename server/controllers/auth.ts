// server/controllers/auth.ts
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const router = express.Router();

const USC_DOMAIN = process.env.USC_EMAIL_DOMAIN || "usc.edu";

function signToken(payload: any) {
  const secret = process.env.JWT_SECRET || "supersecret";
  const expiresIn = (process.env.JWT_EXPIRES_IN || "30d") as any;
  return jwt.sign(payload, secret, { expiresIn });
}

router.post("/signup", async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      birth_date,
      gender,
      usc_id,
      languages,
    } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // Enforce USC domain restriction
    if (!email.toLowerCase().endsWith(`@${USC_DOMAIN}`)) {
      return res.status(400).json({
        error: "Only USC students with a @usc.edu email can sign up.",
      });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const insert = await db
      .insert(users)
      .values({
        id: uuidv4(),
        email,
        password_hash,
        firstName: first_name,
        lastName: last_name,
        birth_date,
        gender,
        usc_id,
        languages: languages || ["English"],
        roles: ["user"],
      })
      .returning();
    const created = insert[0];
    const verifyToken = jwt.sign(
      { userId: created.id },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "30d" },
    );
    const verifyUrl = `${req.protocol}://${req.get("host")}/auth/verify-email?token=${verifyToken}`;
    const sgKey = process.env.SENDGRID_API_KEY;
    const hasValidSgKey = sgKey && sgKey !== "sk_test_SENDGRID_OR_EMPTY";

    if (hasValidSgKey) {
      try {
        await sgMail.send({
          to: email,
          from: process.env.EMAIL_FROM!,
          subject: "Verify your email",
          text: `Click to verify: ${verifyUrl}`,
          html: `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
        });
      } catch (err) {
        console.warn(
          "Skipping email verification send due to SendGrid error",
          err,
        );
      }
    } else {
      console.log(
        "Skipping email verification: No valid SENDGRID_API_KEY provided.",
      );
    }
    const tokenForClient = signToken({ userId: created.id, roles: ["user"] });
    res.json({
      user: { id: created.id, email: created.email },
      token: tokenForClient,
    });
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }
    res.status(500).json({ error: err.message || "Server error" });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("Missing token");
    const payload: any = jwt.verify(
      token as string,
      process.env.JWT_SECRET || "supersecret",
    );
    const userId = payload.userId;
    await db
      .update(users)
      .set({ email_verified: true })
      .where(eq(users.id, userId as string));
    return res.send("Email verified. You can close this window.");
  } catch (err) {
    return res.status(400).send("Invalid or expired token");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const q = await db.select().from(users).where(eq(users.email, email));
    if (!q.length)
      return res.status(400).json({ error: "Invalid credentials" });
    const user = q[0];
    if (!user.password_hash)
      return res.status(400).json({ error: "No local password set" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    const token = signToken({ userId: user.id, roles: user.roles || ["user"] });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
