import prisma from '../lib/prisma';

async function applyMigration() {
  console.log('Applying COD PaymentMethod migration to database...');

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
            CREATE TYPE "PaymentMethod" AS ENUM ('RAZORPAY', 'COD');
        END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'RAZORPAY';
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'RAZORPAY';
  `);

  const sampleOrder = await prisma.order.findFirst({
    select: { id: true, orderNumber: true, paymentMethod: true, paymentStatus: true },
  });
  console.log('Migration applied successfully! Sample existing order:', sampleOrder);
}

applyMigration()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

