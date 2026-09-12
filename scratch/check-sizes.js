require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL.replace(
  /([?&]sslmode=)(?:require|prefer|verify-ca)(?=&|$)/g,
  '$1verify-full'
);
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const sizes = await prisma.productSize.findMany();
  console.log('ProductSizes:', sizes);

  const categories = await prisma.category.findMany();
  console.log('Categories:', categories);
}
run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
