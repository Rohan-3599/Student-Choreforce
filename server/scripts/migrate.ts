import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log("Checking for stripe_payment_intent_id column...");
        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;");
        console.log("Column added successfully or already exists.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
