import pg from 'pg';

const url = "postgresql://rohansinha@localhost:5432/choreforce";
const client = new pg.Client(url);

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('tasker_building_name', 'tasker_gender_preference', 'tasker_languages');
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

check().catch(console.error);
