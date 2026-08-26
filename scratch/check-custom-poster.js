const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing in environment.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected successfully!');

    // Check Categories
    console.log('Checking categories...');
    const catRes = await client.query('SELECT * FROM "Category"');
    console.log('Categories:', catRes.rows);

    let categoryId = '';
    if (catRes.rows.length === 0) {
      console.log('Creating default Category...');
      const insertCat = await client.query(
        'INSERT INTO "Category" (id, name, slug, description, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
        ['cust-cat-id', 'Custom Posters', 'custom-posters', 'Create your own masterpiece']
      );
      categoryId = insertCat.rows[0].id;
    } else {
      // Use the first category
      categoryId = catRes.rows[0].id;
    }

    // Check custom-poster product
    console.log('Checking for custom-poster product...');
    const prodRes = await client.query('SELECT * FROM "Product" WHERE slug = $1', ['custom-poster']);
    
    if (prodRes.rows.length === 0) {
      console.log('custom-poster product is missing! Seeding it now...');
      const insertProd = await client.query(
        `INSERT INTO "Product" 
          (id, title, slug, description, price, "MRP", discount, "SKU", featured, trending, active, "categoryId", "createdAt", "updatedAt") 
         VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) 
         RETURNING id`,
        [
          'custom-poster-prod-id',
          'Custom Poster Print',
          'custom-poster',
          'Custom artwork canvas design print',
          499.0, // base price
          999.0,
          0.0,
          'HELLFIRE-CUST-POSTER',
          false,
          false,
          true,
          categoryId
        ]
      );
      console.log('custom-poster product created successfully with ID:', insertProd.rows[0].id);
    } else {
      console.log('custom-poster product already exists:', prodRes.rows[0]);
    }

    await client.end();
  } catch (err) {
    console.error('Failed to run check script:', err);
    process.exit(1);
  }
}

main();
