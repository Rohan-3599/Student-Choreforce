import pg from 'pg';

const url = "postgresql://rohansinha@localhost:5432/choreforce";
const client = new pg.Client(url);

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY column_name;
  `);
  console.log("COLUMNS IN 'users' TABLE:");
  res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
  
  const userRes = await client.query("SELECT * FROM users LIMIT 1");
  console.log("\nSAMPLE USER DATA (Keys):");
  if (userRes.rows[0]) {
    console.log(Object.keys(userRes.rows[0]));
  } else {
    console.log("No users found.");
  }
  
  await client.end();
}

check().catch(console.error);
