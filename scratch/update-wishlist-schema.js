const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_oKSW7FLCu6kY@ep-small-poetry-azyep7vx-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected successfully!');
    
    console.log('Applying: ALTER TABLE "WishlistItem" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT \'WANT_TO_BUY_NEXT\';');
    await client.query('ALTER TABLE "WishlistItem" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT \'WANT_TO_BUY_NEXT\';');
    
    console.log('Verification check...');
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'WishlistItem' AND column_name = 'category';
    `);
    console.log('WishlistItem category exists:', result.rowCount > 0);
    
    await client.end();
    console.log('Database schema successfully updated!');
  } catch (err) {
    console.error('Failed to update database schema:', err);
    process.exit(1);
  }
}

main();
