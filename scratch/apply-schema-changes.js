const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_oKSW7FLCu6kY@ep-small-poetry-azyep7vx-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected successfully!');
    
    console.log('Applying: ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "couponCode" TEXT;');
    await client.query('ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "couponCode" TEXT;');
    
    console.log('Applying: ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;');
    await client.query('ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;');
    
    console.log('Verification check...');
    const cartCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'Cart' AND column_name = 'couponCode';
    `);
    console.log('Cart couponCode exists:', cartCols.rowCount > 0);
    
    const imgCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'ProductImage' AND column_name = 'sortOrder';
    `);
    console.log('ProductImage sortOrder exists:', imgCols.rowCount > 0);
    
    await client.end();
    console.log('Database schema successfully updated!');
  } catch (err) {
    console.error('Failed to update database schema:', err);
    process.exit(1);
  }
}

main();
