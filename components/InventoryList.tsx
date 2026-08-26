'use client';

import { useState, useTransition } from 'react';
import { updateInventoryAction } from '@/app/admin/actions';
import { Search, Save, AlertTriangle, CheckCircle, Filter } from 'lucide-react';

interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  alertThreshold: number;
  updatedAt: Date;
  product: {
    title: string;
    SKU: string;
    active: boolean;
  };
}

interface InventoryListProps {
  inventories: InventoryItem[];
}

export default function InventoryList({ inventories: initialInventories }: InventoryListProps) {
  const [items, setItems] = useState(initialInventories);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, low, out
  const [isPending, startTransition] = useTransition();

  // Stores unsaved changes in client state per item: { [productId]: { quantity, alertThreshold } }
  const [changes, setChanges] = useState<{ [id: string]: { qty: number; threshold: number } }>({});

  const handleQtyChange = (productId: string, val: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;

    const currentChange = changes[productId] || { qty: item.quantity, threshold: item.alertThreshold };
    const newQty = Math.max(0, val); // Prevent negative stock client-side

    setChanges((prev) => ({
      ...prev,
      [productId]: {
        ...currentChange,
        qty: newQty,
      },
    }));
  };

  const handleThresholdChange = (productId: string, val: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;

    const currentChange = changes[productId] || { qty: item.quantity, threshold: item.alertThreshold };
    const newThreshold = Math.max(0, val);

    setChanges((prev) => ({
      ...prev,
      [productId]: {
        ...currentChange,
        threshold: newThreshold,
      },
    }));
  };

  const handleSave = async (productId: string) => {
    const itemChange = changes[productId];
    if (!itemChange) return;

    if (itemChange.qty < 0) {
      alert('Stock quantity cannot be negative.');
      return;
    }

    startTransition(async () => {
      const result = await updateInventoryAction(productId, itemChange.qty, itemChange.threshold);
      if (result.success) {
        // Update local items array with saved values
        setItems((prev) =>
          prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity: itemChange.qty, alertThreshold: itemChange.threshold, updatedAt: new Date() }
              : item
          )
        );
        // Clear unsaved change state for this item
        setChanges((prev) => {
          const updated = { ...prev };
          delete updated[productId];
          return updated;
        });
      } else {
        alert(result.error || 'Failed to save inventory adjustments.');
      }
    });
  };

  // Filter and search computation
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.product.title.toLowerCase().includes(search.toLowerCase()) ||
      item.product.SKU.toLowerCase().includes(search.toLowerCase());

    const isOutOfStock = item.quantity === 0;
    const isLowStock = item.quantity <= item.alertThreshold && item.quantity > 0;

    const matchesFilter =
      filter === 'all' ||
      (filter === 'low' && isLowStock) ||
      (filter === 'out' && isOutOfStock);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#0F0F0F] p-4.5 rounded-3xl border border-neutral-900 justify-between items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inventory by title or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-neutral-900 rounded-xl text-xs font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] transition-all font-medium"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none w-full sm:w-auto pl-4 pr-10 py-3 bg-[#050505] border border-neutral-900 rounded-xl text-xs text-neutral-450 focus:outline-none focus:border-[#C1121F] transition-all font-black uppercase tracking-widest min-w-[170px] cursor-pointer"
          >
            <option value="all">ALL STOCKS</option>
            <option value="low">LOW STOCK ONLY</option>
            <option value="out">OUT OF STOCK ONLY</option>
          </select>
          <Filter className="w-3.5 h-3.5 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-[#0F0F0F] border border-neutral-900 rounded-3xl overflow-hidden shadow-sm">
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-900 text-neutral-500 uppercase font-black tracking-widest text-[9px] bg-neutral-950/40">
                  <th className="py-4 px-6">Product details</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Threshold limit</th>
                  <th className="py-4 px-6 text-center">Stock adjuster</th>
                  <th className="py-4 px-6">Last sync</th>
                  <th className="py-4 px-6 text-right">Commit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/50 text-[11px] font-bold">
                {filteredItems.map((item) => {
                  const currentChange = changes[item.productId];
                  const displayQty = currentChange ? currentChange.qty : item.quantity;
                  const displayThreshold = currentChange ? currentChange.threshold : item.alertThreshold;
                  const isModified = currentChange !== undefined;

                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = item.quantity <= item.alertThreshold && item.quantity > 0;

                  return (
                    <tr key={item.id} className="hover:bg-neutral-900/20 transition-all duration-200 group">
                      {/* Name/SKU */}
                      <td className="py-5 px-6">
                        <div>
                          <h4 className="font-extrabold text-white text-xs uppercase tracking-wide">{item.product.title}</h4>
                          <p className="font-mono text-[9px] text-neutral-550 uppercase tracking-widest mt-1 font-bold">
                            {item.product.SKU}
                          </p>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-5 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[8.5px] font-black rounded-lg tracking-widest ${
                            isOutOfStock
                              ? 'bg-rose-950/20 border border-rose-900/40 text-rose-450'
                              : isLowStock
                              ? 'bg-amber-950/20 border border-amber-900/40 text-amber-450 animate-pulse'
                              : 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-400'
                          }`}
                        >
                          {isOutOfStock ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-rose-500 animate-bounce" />
                              OUT OF STOCK
                            </>
                          ) : isLowStock ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-amber-550" />
                              LOW STOCK
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              STABLE
                            </>
                          )}
                        </span>
                      </td>

                      {/* Threshold limit */}
                      <td className="py-5 px-6 text-center">
                        <input
                          type="number"
                          value={displayThreshold}
                          onChange={(e) => handleThresholdChange(item.productId, parseInt(e.target.value, 10) || 0)}
                          className="w-16 px-2.5 py-1.5 bg-[#050505] border border-neutral-900 hover:border-neutral-850 rounded-xl text-center font-mono font-black text-white focus:outline-none focus:border-[#C1121F]"
                        />
                      </td>

                      {/* Stock adjuster */}
                      <td className="py-5 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleQtyChange(item.productId, displayQty - 1)}
                            className="w-7 h-7 bg-[#050505] hover:bg-[#161616] border border-neutral-900 text-neutral-400 hover:text-white rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer active:scale-90 transition-transform"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={displayQty}
                            onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value, 10) || 0)}
                            className="w-20 px-3 py-1.5 bg-[#050505] border border-neutral-900 text-center font-mono font-black text-white focus:outline-none focus:border-[#C1121F] rounded-xl"
                          />
                          <button
                            onClick={() => handleQtyChange(item.productId, displayQty + 1)}
                            className="w-7 h-7 bg-[#050505] hover:bg-[#161616] border border-[#222] text-neutral-400 hover:text-white rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer active:scale-90 transition-transform"
                          >
                            +
                          </button>

                          {/* Quick adds */}
                          <div className="hidden sm:flex items-center gap-1.5 ml-2.5">
                            <button
                              onClick={() => handleQtyChange(item.productId, displayQty + 10)}
                              className="px-2 py-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 rounded-lg text-[9px] font-mono font-black text-[#FF4D4D] hover:text-white cursor-pointer transition-colors"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleQtyChange(item.productId, displayQty + 50)}
                              className="px-2 py-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 rounded-lg text-[9px] font-mono font-black text-[#FF4D4D] hover:text-white cursor-pointer transition-colors"
                            >
                              +50
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Last updated */}
                      <td className="py-5 px-6 text-neutral-500 font-mono text-[9.5px]">
                        {new Date(item.updatedAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* Save commit */}
                      <td className="py-5 px-6 text-right">
                        <button
                          onClick={() => handleSave(item.productId)}
                          disabled={!isModified || isPending}
                          className={`p-2.5 rounded-xl border transition-all active:scale-95 disabled:scale-100 ${
                            isModified
                              ? 'bg-[#C1121F] hover:bg-[#A00F19] text-white border-transparent cursor-pointer shadow-md shadow-red-950/20'
                              : 'bg-[#050505] text-neutral-700 border-neutral-900 cursor-not-allowed'
                          }`}
                          title="Save Changes to Database"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-550 font-bold uppercase tracking-wider text-xs">
            No product inventories found.
          </div>
        )}
      </div>
    </div>
  );
}
