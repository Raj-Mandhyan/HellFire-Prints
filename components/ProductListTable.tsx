'use client';

import { useState, useTransition } from 'react';
import Image from './SafeImage';
import Link from 'next/link';
import { deleteProductAction } from '@/app/admin/actions';
import { Edit2, Trash2, Search, Filter, Plus, Calendar, AlertCircle } from 'lucide-react';

interface ProductData {
  id: string;
  title: string;
  slug: string;
  price: number;
  SKU: string;
  active: boolean;
  createdAt: Date;
  category: {
    name: string;
  } | null;
  inventory: {
    quantity: number;
  } | null;
  images: {
    url: string;
  }[];
}

interface ProductListTableProps {
  products: ProductData[];
  categories: { id: string; name: string }[];
}

export default function ProductListTable({ products: initialProducts, categories }: ProductListTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter products based on search query, category, and active status
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.SKU.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category?.name === selectedCategory;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && p.active) ||
      (selectedStatus === 'inactive' && !p.active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? If it is linked to past orders, it will be deactivated instead of removed.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        const result = await deleteProductAction(id);
        if (result.success) {
          setFeedback({
            type: 'success',
            message: result.message || 'Product processed successfully.',
          });
          // Update local state: if deactivated, toggle active to false; if deleted, filter it out
          if (result.deactivated) {
            setProducts((prev) =>
              prev.map((p) => (p.id === id ? { ...p, active: false, inventory: p.inventory ? { ...p.inventory, quantity: 0 } : null } : p))
            );
          } else {
            setProducts((prev) => prev.filter((p) => p.id !== id));
          }
        } else {
          setFeedback({ type: 'error', message: result.error || 'Failed to delete product.' });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setFeedback({ type: 'error', message: message || 'An error occurred.' });
      }

      // Clear toast after 4s
      setTimeout(() => setFeedback(null), 4000);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action / Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0F0F] p-4.5 rounded-3xl border border-neutral-900 shadow-sm">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-neutral-900 rounded-xl text-xs font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] transition-all font-medium"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 bg-[#050505] border border-neutral-900 rounded-xl text-xs text-neutral-450 focus:outline-none focus:border-[#C1121F] transition-all font-black uppercase tracking-widest min-w-[160px] cursor-pointer"
            >
              <option value="all">ALL CATEGORIES</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name.toUpperCase()}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 bg-[#050505] border border-neutral-900 rounded-xl text-xs text-neutral-450 focus:outline-none focus:border-[#C1121F] transition-all font-black uppercase tracking-widest min-w-[140px] cursor-pointer"
            >
              <option value="all">ALL STATUS</option>
              <option value="active">ACTIVE ONLY</option>
              <option value="inactive">INACTIVE ONLY</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Add Product Button */}
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-[#C1121F] hover:bg-[#A00F19] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          New Product
        </Link>
      </div>

      {/* Toast Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
              : 'bg-rose-950/20 border-rose-900/60 text-rose-350'
          }`}
        >
          <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-[#C1121F]" />
          <p className="text-xs font-bold uppercase tracking-wider">{feedback.message}</p>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-[#0F0F0F] border border-neutral-900 rounded-3xl overflow-hidden shadow-sm">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-900 text-neutral-500 uppercase font-black tracking-widest text-[9px] bg-neutral-950/40">
                  <th className="py-4 px-6">Product details</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">SKU</th>
                  <th className="py-4 px-6 text-right">Price</th>
                  <th className="py-4 px-6 text-center">Stock</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/50 text-[11px] font-bold">
                {filteredProducts.map((p) => {
                  const primaryImage =
                    p.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=80&q=80';
                  const stock = p.inventory?.quantity ?? 0;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-900/20 transition-all duration-200 group">
                      {/* Product Info */}
                      <td className="py-4 px-6 flex items-center gap-4">
                        <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-900 flex-shrink-0 shadow">
                          <Image
                            src={primaryImage}
                            alt={p.title}
                            fill
                            sizes="40px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-xs hover:text-[#FF4D4D] transition-colors duration-300 uppercase tracking-wide">
                            {p.title}
                          </h4>
                          <span className="text-[9px] text-neutral-500 flex items-center gap-1.5 mt-1 font-bold uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5 text-[#C1121F]" />
                            {new Date(p.createdAt).toLocaleDateString('en-IN', {
                              dateStyle: 'medium',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="text-[9.5px] bg-neutral-950 border border-neutral-900 text-neutral-450 px-2.5 py-1 rounded-lg font-black uppercase tracking-widest">
                          {p.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="py-4 px-6 font-mono text-[9.5px] text-neutral-500 font-bold uppercase tracking-wider">
                        {p.SKU}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 text-right font-mono font-black text-white text-xs">
                        ₹{p.price.toFixed(0)}
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[8.5px] font-black uppercase rounded-lg tracking-widest ${
                            stock > 10
                              ? 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-400'
                              : stock > 0
                              ? 'bg-amber-950/20 border border-amber-900/40 text-amber-450 animate-pulse'
                              : 'bg-rose-950/20 border border-rose-900/40 text-rose-455'
                          }`}
                        >
                          {stock > 0 ? `${stock} units` : 'OUT OF STOCK'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[8.5px] font-black uppercase rounded-lg tracking-widest ${
                            p.active
                              ? 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-400'
                              : 'bg-neutral-950 border border-neutral-900 text-neutral-550'
                          }`}
                        >
                          {p.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="p-2 bg-[#050505] hover:bg-[#161616] text-neutral-450 hover:text-white rounded-xl border border-neutral-900 transition-colors active:scale-90"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.title)}
                            disabled={isPending}
                            className="p-2 bg-[#050505] hover:bg-red-950/20 text-neutral-455 hover:text-red-400 rounded-xl border border-neutral-900 hover:border-red-900/40 transition-colors cursor-pointer active:scale-90"
                            title="Delete / Deactivate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-550 font-bold uppercase tracking-wider text-xs">
            No products match the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
}
