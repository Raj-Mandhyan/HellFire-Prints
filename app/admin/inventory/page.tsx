import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import InventoryList from '@/components/InventoryList';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  // Protect route
  await requireAdmin();

  // Load all inventory records sorted by updatedAt desc
  const inventories = await prisma.inventory.findMany({
    include: {
      product: {
        select: {
          title: true,
          SKU: true,
          active: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          INVENTORY <span className="text-[#C1121F]">STOCKS</span>
        </h1>
        <p className="text-neutral-400 mt-1 text-xs font-medium">
          Monitor product reserve counts, establish warning thresholds, and apply changes server-side.
        </p>
      </div>

      <InventoryList inventories={inventories} />
    </div>
  );
}
