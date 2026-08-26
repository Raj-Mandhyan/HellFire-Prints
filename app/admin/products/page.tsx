import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import ProductListTable from '@/components/ProductListTable';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  // Protect route
  await requireAdmin();

  // Load all products and categories from PostgreSQL
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        inventory: true,
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          PRODUCT <span className="text-[#C1121F]">CATALOG</span>
        </h1>
        <p className="text-neutral-400 mt-1 text-xs font-medium">
          Create, edit, safe-delete, or filter posters and digital artwork files.
        </p>
      </div>

      <ProductListTable products={products} categories={categories} />
    </div>
  );
}
