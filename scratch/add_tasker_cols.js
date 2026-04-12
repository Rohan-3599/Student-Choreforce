import pg from 'pg';

const url = "postgresql://rohansinha@localhost:5432/choreforce";
const client = new pg.Client(url);

async function runFix() {
  await client.connect();
  console.log("Adding tasker preference columns...");
  await client.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS tasker_building_name varchar(128),
    ADD COLUMN IF NOT EXISTS tasker_gender_preference varchar(32),
    ADD COLUMN IF NOT EXISTS tasker_languages jsonb;
  `);
  console.log("Success!");
  await client.end();
}

runFix().catch(console.error);
