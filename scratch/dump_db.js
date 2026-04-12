import pg from 'pg';

const url = "postgresql://rohansinha@localhost:5432/choreforce";
const client = new pg.Client(url);

async function dump() {
  await client.connect();
  const tables = ['users', 'tasks'];
  for (const table of tables) {
    console.log(`--- Table: ${table} ---`);
    const res = await client.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = '${table}'
      ORDER BY ordinal_position;
    `);
    console.table(res.rows);
  }
  await client.end();
}

dump().catch(console.error);
