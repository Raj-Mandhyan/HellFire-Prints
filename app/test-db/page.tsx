import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import Image from '@/components/SafeImage';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    inventory: true;
    images: true;
  };
}>;

export default async function TestDbPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/');
  }

  let products: ProductWithRelations[] = [];
  let errorMsg: string | null = null;
  let connectionSuccess = false;

  try {
    // Perform a real query against Neon using Prisma
    products = await prisma.product.findMany({
      include: {
        category: true,
        inventory: true,
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    connectionSuccess = true;
  } catch (error: unknown) {
    console.error('Error fetching database products:', error);
    errorMsg = error instanceof Error ? error.message : String(error);
  }

  return (
    <div className="min-h-screen bg-transparent text-white py-12 px-6 sm:px-12 font-sans selection:bg-[#C1121F] selection:text-white">
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#C1121F] to-transparent"></div>

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              HELLFIRE PRINTS
              <span className="text-xs bg-[#C1121F] text-white px-2.5 py-1 rounded-full uppercase font-bold tracking-widest animate-pulse">
                Live DB Test
              </span>
            </h1>
            <p className="text-neutral-400 mt-2 text-sm">
              Verifying Next.js → Prisma 7 → Neon PostgreSQL cloud database integration.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
            <span className={`w-3.5 h-3.5 rounded-full ${connectionSuccess ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></span>
            <span className={`w-3.5 h-3.5 rounded-full absolute ${connectionSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <span className="text-sm font-semibold tracking-wide pl-2">
              {connectionSuccess ? 'NEON DATABASE CONNECTED' : 'DATABASE DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-950/40 border border-red-900 text-red-200 p-6 rounded-xl space-y-2">
            <h3 className="font-bold text-lg text-red-400">Database Connection Failure</h3>
            <p className="text-sm font-mono whitespace-pre-wrap">{errorMsg}</p>
          </div>
        )}

        {/* Database Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Total Products</h3>
            <p className="text-4xl font-extrabold mt-2 text-white">{products.length}</p>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Active Categories</h3>
            <p className="text-4xl font-extrabold mt-2 text-white">
              {new Set(products.map((p) => p.category?.name).filter(Boolean)).size}
            </p>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Fulfillment Stock</h3>
            <p className="text-4xl font-extrabold mt-2 text-[#C1121F]">
              {products.reduce((acc, p) => acc + (p.inventory?.quantity || 0), 0)} units
            </p>
          </div>
        </div>

        {/* Products Table */}
        {connectionSuccess && (
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="p-6 border-b border-neutral-800 bg-neutral-900/20">
              <h2 className="text-xl font-bold tracking-tight text-white">Product Catalog (Seed Data)</h2>
              <p className="text-xs text-neutral-400 mt-1">Authorized data fetched directly from Neon cloud.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-xs text-neutral-400 uppercase tracking-widest font-semibold bg-neutral-950/40">
                    <th className="py-4 px-6">Product details</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">SKU</th>
                    <th className="py-4 px-6 text-right">Price (INR)</th>
                    <th className="py-4 px-6 text-center">Stock status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {products.map((product) => {
                    const primaryImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=80&q=80';
                    const stock = product.inventory?.quantity ?? 0;
                    return (
                      <tr key={product.id} className="hover:bg-neutral-900/30 transition-colors group">
                        <td className="py-5 px-6 flex items-center gap-4">
                          <div className="relative w-12 h-16 rounded overflow-hidden bg-neutral-800 border border-neutral-700/50 flex-shrink-0">
                            <Image 
                              src={primaryImage} 
                              alt={product.title} 
                              fill 
                              sizes="48px"
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-white group-hover:text-[#FF4D4D] transition-colors">{product.title}</h4>
                            <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1 max-w-sm">{product.description}</p>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-sm bg-neutral-800 border border-neutral-700 text-neutral-300 px-3 py-1 rounded-full font-medium">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="py-5 px-6 font-mono text-xs text-neutral-400">
                          {product.SKU}
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div>
                            <span className="font-bold text-white">₹{product.price.toFixed(2)}</span>
                            {product.discount > 0 && (
                              <div className="text-xs text-neutral-500 line-through">
                                ₹{product.MRP.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-lg ${stock > 0 ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/80' : 'bg-red-950/60 text-red-400 border border-red-900/80'}`}>
                            {stock > 0 ? `${stock} IN STOCK` : 'OUT OF STOCK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
