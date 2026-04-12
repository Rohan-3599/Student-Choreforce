import bcrypt from "bcrypt";
import pg from "pg";

const { Client } = pg;
const connectionString = "postgresql://rohansinha@localhost:5432/choreforce";

async function resetPasswords() {
  const client = new Client({ connectionString });
  await client.connect();

  const password = "Test@1234";
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  const emails = ['testuser@usc.edu', 'testuser1@usc.edu', 'testuser2@usc.edu'];

  for (const email of emails) {
    const res = await client.query(
      "UPDATE users SET password_hash = $1 WHERE email = $2",
      [hash, email]
    );
    console.log(`Updated password for ${email}: ${res.rowCount} row(s)`);
  }

  await client.end();
}

resetPasswords().catch(console.error);
