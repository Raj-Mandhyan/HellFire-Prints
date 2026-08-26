import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import ProductForm from '@/components/ProductForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminNewProductPage() {
  // Protect route
  await requireAdmin();

  // Load all categories for selection
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-xs text-neutral-450 hover:text-white transition-colors group mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to products
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            NEW <span className="text-[#C1121F]">PRODUCT</span>
          </h1>
          <p className="text-neutral-400 text-xs font-medium">
            Draft poster configurations and auto-generate frame/size variants.
          </p>
        </div>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
