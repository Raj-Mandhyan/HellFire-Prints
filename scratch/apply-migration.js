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
  console.log('Starting raw DDL migration via pg pool...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add configuration column to CustomPoster if it doesn't exist
    console.log('Adding "configuration" column to "CustomPoster" table...');
    await client.query(`
      ALTER TABLE "CustomPoster" 
      ADD COLUMN IF NOT EXISTS "configuration" JSONB;
    `);

    // 2. Create CustomPosterDesign table if it doesn't exist
    console.log('Creating "CustomPosterDesign" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "CustomPosterDesign" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "configuration" JSONB NOT NULL,
        "previewImage" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CustomPosterDesign_pkey" PRIMARY KEY ("id")
      );
    `);

    // 3. Add foreign key constraint to CustomPosterDesign
    console.log('Adding foreign key constraint for "CustomPosterDesign" to "User"...');
    // We drop constraint if exists to avoid error, then recreate it, or do it conditionally
    try {
      await client.query(`
        ALTER TABLE "CustomPosterDesign" 
        DROP CONSTRAINT IF EXISTS "CustomPosterDesign_userId_fkey";
      `);
      await client.query(`
        ALTER TABLE "CustomPosterDesign" 
        ADD CONSTRAINT "CustomPosterDesign_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (err) {
      console.warn('Skipping FK constraint (might already exist):', err.message);
    }

    // 4. Add index on userId for CustomPosterDesign
    console.log('Adding index on "userId" in "CustomPosterDesign"...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "CustomPosterDesign_userId_idx" 
      ON "CustomPosterDesign"("userId");
    `);

    await client.query('COMMIT');
    console.log('Raw migration successfully applied to database! 🎉');
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
