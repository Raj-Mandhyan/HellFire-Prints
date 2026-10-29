import prisma from '../lib/prisma';

async function main() {
  const result: any[] = await prisma.$queryRaw`
    SELECT column_name::text, data_type::text 
    FROM information_schema.columns 
    WHERE table_name = 'Order'
    ORDER BY ordinal_position;
  `;
  console.log('Columns of "Order" table:');
  for (const row of result) {
    console.log(`  - ${row.column_name}: ${row.data_type}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
