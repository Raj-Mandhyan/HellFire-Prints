import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import CustomerListTable from '@/components/CustomerListTable';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  // Protect route
  await requireAdmin();

  // Load all customer profiles
  const customers = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
    },
    include: {
      orders: {
        where: {
          OR: [
            { paymentStatus: 'CAPTURED' },
            { orderStatus: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } }
          ]
        },
        select: {
          total: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Aggregate user records
  const aggregatedCustomers = customers.map((c) => {
    const totalSpent = c.orders.reduce((sum, o) => sum + o.total, 0);
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      createdAt: c.createdAt.toISOString(),
      ordersCount: c.orders.length,
      totalSpent,
    };
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          CUSTOMER <span className="text-[#C1121F]">REGISTRY</span>
        </h1>
        <p className="text-neutral-400 mt-1 text-xs font-medium">
          View customer metrics, total spending history, and profile creation timestamps.
        </p>
      </div>

      <CustomerListTable customers={aggregatedCustomers} />
    </div>
  );
}
