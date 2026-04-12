import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting data cleanup for enum migration...");
  
  try {
    // We use a raw SQL query because the TypeScript types for the enum 
    // in @shared/schema no longer include 'grocery_shopping'
    const result = await db.execute(sql`
      UPDATE tasks 
      SET category = 'other' 
      WHERE category::text = 'grocery_shopping'
    `);
    
    console.log("Successfully updated tasks category.");
    console.log("Result:", result);
    
    process.exit(0);
  } catch (error) {
    console.error("Failed to update task categories:", error);
    process.exit(1);
  }
}

main();
