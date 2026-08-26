const { Client } = require('pg');

async function testNeon() {
  console.log('Testing connection to Neon...');
  const connectionString = "postgresql://neondb_owner:npg_oKSW7FLCu6kY@ep-small-poetry-azyep7vx-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Neon connection SUCCESS!');
    const res = await client.query('SELECT NOW()');
    console.log('Result:', res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.error('Neon connection FAILED:', err.message);
    return false;
  }
}

async function testLocal() {
  console.log('Testing connection to Local Postgres...');
  const connectionString = "postgresql://postgres:local_dev_password_123@localhost:5432/hellfire_db?schema=public";
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Local Postgres connection SUCCESS!');
    const res = await client.query('SELECT NOW()');
    console.log('Result:', res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.error('Local Postgres connection FAILED:', err.message);
    return false;
  }
}

async function run() {
  const neon = await testNeon();
  const local = await testLocal();
  process.exit((neon || local) ? 0 : 1);
}

run();
