const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log('Starting raw DDL migration for Milestone Review & Notes...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add title and verifiedPurchase to Review table
    console.log('Adding "title" and "verifiedPurchase" columns to "Review" table...');
    await client.query(`
      ALTER TABLE "Review" 
      ADD COLUMN IF NOT EXISTS "title" TEXT,
      ADD COLUMN IF NOT EXISTS "verifiedPurchase" BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // 2. Add additionalNote to Order table
    console.log('Adding "additionalNote" column to "Order" table...');
    await client.query(`
      ALTER TABLE "Order" 
      ADD COLUMN IF NOT EXISTS "additionalNote" TEXT;
    `);

    await client.query('COMMIT');
    console.log('Database migration successfully applied! 🎉');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed and was rolled back:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
