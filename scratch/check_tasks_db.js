import pg from 'pg';

const url = "postgresql://rohansinha@localhost:5432/choreforce";
const client = new pg.Client(url);

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    ORDER BY column_name;
  `);
  console.log("COLUMNS IN 'tasks' TABLE:");
  res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
  
  await client.end();
}

check().catch(console.error);
