import prisma from '../lib/prisma';

async function main() {
  console.log('Adding admin email notification columns to "Order" table...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "adminEmailStatus" TEXT DEFAULT 'PENDING';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "adminEmailSentAt" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "adminEmailId" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "adminEmailError" TEXT;
  `);

  console.log('Columns added successfully. Verifying...');

  const result: any[] = await prisma.$queryRaw`
    SELECT column_name::text, data_type::text 
    FROM information_schema.columns 
    WHERE table_name = 'Order' AND column_name LIKE 'adminEmail%'
    ORDER BY ordinal_position;
  `;

  console.log('Verified columns in "Order" table:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
