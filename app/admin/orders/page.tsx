import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import OrderListTable from '@/components/OrderListTable';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  // Protect route
  await requireAdmin();

  // Load all orders with user relation from Neon Postgres
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          CUSTOMER <span className="text-[#C1121F]">ORDERS</span>
        </h1>
        <p className="text-neutral-400 mt-1 text-xs font-medium">
          View invoices, monitor checkout transaction states, and advance fulfillment statuses.
        </p>
      </div>

      <OrderListTable orders={orders} />
    </div>
  );
}
