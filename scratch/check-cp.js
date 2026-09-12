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
  const prods = await prisma.product.findMany({
    select: { id: true, title: true, slug: true, price: true }
  });
  console.log('Total products:', prods.length);
  console.log(prods);

  const sizes = await prisma.size.findMany();
  console.log('Sizes:', sizes);
}
run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
