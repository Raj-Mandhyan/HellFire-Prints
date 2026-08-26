'use client';

import { useState } from 'react';
import { Search, Calendar, Wallet, ShoppingBag } from 'lucide-react';

interface CustomerAggregated {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
}

interface CustomerListTableProps {
  customers: CustomerAggregated[];
}

export default function CustomerListTable({ customers }: CustomerListTableProps) {
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#0F0F0F] p-4.5 rounded-3xl border border-neutral-900 justify-between items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-neutral-900 rounded-xl text-xs font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] transition-all font-medium"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#0F0F0F] border border-neutral-900 rounded-3xl overflow-hidden shadow-sm">
        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-900 text-neutral-500 uppercase font-black tracking-widest text-[9px] bg-neutral-950/40">
                  <th className="py-4 px-6">Customer details</th>
                  <th className="py-4 px-6 text-center">Orders count</th>
                  <th className="py-4 px-6 text-right">Total spending</th>
                  <th className="py-4 px-6">Registration date</th>
                  <th className="py-4 px-6 text-center">Account status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/50 text-[11px] font-bold">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-900/20 transition-all duration-200 group">
                    {/* User profile details */}
                    <td className="py-4 px-6 text-neutral-450">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C1121F] to-[#FF4D4D] text-white flex items-center justify-center font-black text-xs uppercase shadow-sm border border-red-950/20">
                          {c.name ? c.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <p className="font-extrabold text-white text-xs uppercase tracking-wide">{c.name || 'User Profile'}</p>
                          <p className="text-[10px] text-neutral-500 font-mono tracking-normal mt-0.5 font-medium lowercase">{c.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Orders count */}
                    <td className="py-4 px-6 text-center font-mono font-black text-white text-xs">
                      <div className="flex items-center justify-center gap-1.5 bg-neutral-950/40 py-1 px-2.5 rounded-lg border border-neutral-900 inline-flex">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#C1121F]" />
                        {c.ordersCount}
                      </div>
                    </td>

                    {/* Total spent */}
                    <td className="py-4 px-6 text-right font-mono font-black text-[#FF4D4D] text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-neutral-500" />
                        ₹{c.totalSpent.toFixed(0)}
                      </div>
                    </td>

                    {/* Joined date */}
                    <td className="py-4 px-6 text-neutral-450">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-550" />
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          dateStyle: 'medium',
                        })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-block px-2.5 py-0.5 text-[8.5px] font-black uppercase rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 tracking-wider">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-550 font-bold uppercase tracking-wider text-xs">
            No customer profiles match search query.
          </div>
        )}
      </div>
    </div>
  );
}
