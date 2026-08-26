'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Receipt, Eye, Calendar } from 'lucide-react';

interface OrderItemData {
  id: string;
  orderNumber: string;
  createdAt: Date;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  user: {
    name: string | null;
    email: string | null;
  } | null;
}

interface OrderListTableProps {
  orders: OrderItemData[];
}

export default function OrderListTable({ orders }: OrderListTableProps) {
  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.user?.email || '').toLowerCase().includes(search.toLowerCase());

    const matchesOrderStatus =
      orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;

    const matchesPaymentStatus =
      paymentStatusFilter === 'all' || o.paymentStatus === paymentStatusFilter;

    return matchesSearch && matchesOrderStatus && matchesPaymentStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0F0F0F] p-4.5 rounded-3xl border border-neutral-900 justify-between items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search orders by number, customer name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-neutral-900 rounded-xl text-xs font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] transition-all font-medium"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Order Status Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="appearance-none w-full pl-4 pr-10 py-3 bg-[#050505] border border-neutral-900 rounded-xl text-xs text-neutral-450 focus:outline-none focus:border-[#C1121F] transition-all font-black uppercase tracking-widest min-w-[160px] cursor-pointer"
            >
              <option value="all">ALL ORDER STATUS</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Payment Status Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="appearance-none w-full pl-4 pr-10 py-3 bg-[#050505] border border-neutral-900 rounded-xl text-xs text-neutral-450 focus:outline-none focus:border-[#C1121F] transition-all font-black uppercase tracking-widest min-w-[170px] cursor-pointer"
            >
              <option value="all">ALL PAYMENT STATUS</option>
              <option value="CREATED">CREATED</option>
              <option value="PENDING">PENDING</option>
              <option value="AUTHORIZED">AUTHORIZED</option>
              <option value="CAPTURED">CAPTURED</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-[#0F0F0F] border border-neutral-900 rounded-3xl overflow-hidden shadow-sm">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-900 text-neutral-500 uppercase font-black tracking-widest text-[9px] bg-neutral-950/40">
                  <th className="py-4 px-6">Order receipt ID</th>
                  <th className="py-4 px-6">Customer profiles</th>
                  <th className="py-4 px-6 text-right">Invoice value</th>
                  <th className="py-4 px-6 text-center">Payment status</th>
                  <th className="py-4 px-6 text-center">Order status</th>
                  <th className="py-4 px-6">Date placed</th>
                  <th className="py-4 px-6 text-right">Invoice details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/50 text-[11px] font-bold">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-900/20 transition-all duration-200 group">
                    {/* Order Number */}
                    <td className="py-4 px-6 font-mono text-white font-black uppercase flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-[#C1121F]" />
                      <Link href={`/admin/orders/${o.id}`} className="hover:text-[#FF4D4D] transition-colors tracking-wider">
                        {o.orderNumber}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-6 text-neutral-450">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7.5 h-7.5 rounded-lg bg-neutral-955 text-neutral-500 flex items-center justify-center font-black text-xs uppercase border border-neutral-900 shadow-sm">
                          {o.user?.name ? o.user.name.charAt(0) : 'G'}
                        </div>
                        <div>
                          <p className="font-extrabold text-neutral-200 text-xs uppercase tracking-wide">{o.user?.name || 'Guest User'}</p>
                          <p className="text-[10px] text-neutral-500 font-mono tracking-normal font-medium lowercase mt-0.5">{o.user?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 text-right font-mono font-black text-white text-xs">
                      ₹{o.total.toFixed(0)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[8.5px] font-black uppercase rounded-lg tracking-widest ${
                          o.paymentStatus === 'CAPTURED'
                            ? 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-400'
                            : o.paymentStatus === 'FAILED'
                            ? 'bg-rose-950/20 border border-rose-900/40 text-rose-450'
                            : 'bg-amber-950/20 border border-amber-900/40 text-amber-400 animate-pulse'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[8.5px] font-black uppercase rounded-lg tracking-widest ${
                          o.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-400'
                            : o.orderStatus === 'CANCELLED'
                            ? 'bg-neutral-950 border border-neutral-900 text-neutral-500'
                            : o.orderStatus === 'SHIPPED'
                            ? 'bg-blue-950/20 border border-blue-900/40 text-blue-400'
                            : 'bg-amber-950/20 border border-amber-900/40 text-amber-400 animate-pulse'
                        }`}
                      >
                        {o.orderStatus}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-neutral-450">
                      <span className="flex items-center gap-1.5 font-semibold text-xs">
                        <Calendar className="w-3.5 h-3.5 text-[#C1121F]" />
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          dateStyle: 'medium',
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1.5 p-2 bg-[#050505] hover:bg-[#161616] text-neutral-400 hover:text-white rounded-xl border border-neutral-900 transition-colors active:scale-90"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-550 font-bold uppercase tracking-wider text-xs">
            No orders match the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
}
