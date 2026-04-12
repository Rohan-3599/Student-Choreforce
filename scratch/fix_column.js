import pg from 'pg';

const url = "postgresql://rohansinha@localhost:5432/choreforce";
const client = new pg.Client(url);

async function runFix() {
  await client.connect();
  console.log("Upgrading profile_image_url to text...");
  await client.query(`ALTER TABLE users ALTER COLUMN profile_image_url TYPE text;`);
  console.log("Success!");
  await client.end();
}

runFix().catch(console.error);
