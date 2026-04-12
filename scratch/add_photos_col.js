import pg from 'pg';

const url = "postgresql://rohansinha@localhost:5432/choreforce";
const client = new pg.Client(url);

async function runFix() {
  await client.connect();
  console.log("Adding photos column to tasks table...");
  await client.query(`
    ALTER TABLE tasks 
    ADD COLUMN IF NOT EXISTS photos jsonb;
  `);
  console.log("Success!");
  await client.end();
}

runFix().catch(console.error);
