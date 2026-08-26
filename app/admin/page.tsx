import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import DashboardChart from '@/components/DashboardChart';
import Link from 'next/link';
import { Package, Users, Receipt, TrendingUp, AlertTriangle, CheckCircle2, Clock, Hourglass } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Protect route
  await requireAdmin();

  // 1. Fetch KPI Metrics
  const [
    totalProducts,
    totalCustomers,
    totalOrders,
    revenueAgg,
    pendingOrders,
    processingOrders,
    completedOrders,
    inventories,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        OR: [
          { paymentStatus: 'CAPTURED' },
          { orderStatus: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } }
        ]
      },
    }),
    prisma.order.count({ where: { orderStatus: 'PENDING' } }),
    prisma.order.count({ where: { orderStatus: 'CONFIRMED' } }),
    prisma.order.count({ where: { orderStatus: 'DELIVERED' } }),
    prisma.inventory.findMany({
      include: {
        product: true,
      },
    }),
  ]);

  const totalRevenue = revenueAgg._sum.total || 0;

  // Calculate low and out of stock levels based on each inventory's threshold
  const lowStockProductsCount = inventories.filter(
    (i) => i.quantity <= i.alertThreshold && i.quantity > 0
  ).length;
  const outOfStockProductsCount = inventories.filter((i) => i.quantity === 0).length;

  // 2. Fetch Recent Orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
    },
  });

  // 3. Fetch Top Low-Stock Items
  const lowStockItems = inventories
    .filter((i) => i.quantity <= i.alertThreshold)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  // 4. Generate Last 7 Days Date Array
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    // Sum captured orders for this day
    const dayOrders = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: {
          gte: d,
          lt: nextD,
        },
        OR: [
          { paymentStatus: 'CAPTURED' },
          { orderStatus: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } }
        ]
      },
    });

    const dayRevenue = dayOrders._sum.total || 0;
    
    chartData.push({
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      revenue: parseFloat(dayRevenue.toFixed(0)),
    });
  }

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const statCards = [
    {
      title: 'Gross Revenue',
      value: formatCurrency(totalRevenue),
      subtitle: 'Total settled funds',
      icon: TrendingUp,
      color: 'text-emerald-400 border-emerald-950 bg-emerald-950/10 hover:border-emerald-800',
    },
    {
      title: 'Total Products',
      value: totalProducts.toString(),
      subtitle: 'Catalog items registered',
      icon: Package,
      color: 'text-[#FF4D4D] border-red-950/60 bg-red-950/10 hover:border-red-900/40',
    },
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      subtitle: 'Active user profiles',
      icon: Users,
      color: 'text-blue-400 border-blue-950 bg-blue-950/10 hover:border-blue-800/40',
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      subtitle: 'Gross invoice volume',
      icon: Receipt,
      color: 'text-amber-400 border-amber-955 bg-amber-955/10 hover:border-amber-800/40',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title block */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
          SYSTEM <span className="text-[#C1121F] fiery-text-glow font-black">DASHBOARD</span>
        </h1>
        <p className="text-neutral-450 mt-2 text-xs font-semibold tracking-wide">
          Real-time metrics feed from Neon Postgres. Monitoring sales velocity, stock levels, and transaction states.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <ScrollReveal key={idx} staggerDelay={idx * 50} fiery={false}>
              <div
                className={`p-6 rounded-3xl border bg-[#0F0F0F] flex items-center justify-between gap-4 relative overflow-hidden transition-all duration-350 active:scale-98 shadow-sm ${c.color}`}
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-neutral-450 tracking-widest block">
                    {c.title}
                  </span>
                  <span className="text-2xl font-black tracking-tight block text-white font-mono leading-none">
                    {c.value}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-wide block pt-0.5">{c.subtitle}</span>
                </div>
                <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-2xl shrink-0">
                  <Icon className="w-5 h-5 text-[#C1121F]" />
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Row: Chart & Order Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8">
          <ScrollReveal fiery={false}>
            <DashboardChart data={chartData} />
          </ScrollReveal>
        </div>

        {/* Order Status Tracking Card */}
        <div className="lg:col-span-4">
          <ScrollReveal fiery={false}>
            <div className="bg-[#0F0F0F] border border-neutral-900 p-6 rounded-3xl flex flex-col justify-between space-y-6 shadow-sm relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#C1121F]/5 blur-2xl pointer-events-none"></div>
              <div>
            <h4 className="text-[10px] text-neutral-450 font-black uppercase tracking-widest border-b border-neutral-900 pb-3">
              Order Pipeline States
            </h4>
            <div className="divide-y divide-neutral-900/60 mt-4 space-y-4">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2.5">
                  <Hourglass className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-neutral-350 uppercase tracking-wide">Pending Drafts</span>
                </div>
                <span className="text-xs font-black text-white font-mono bg-amber-950/20 px-2.5 py-1 border border-amber-900/60 rounded-xl shadow-inner">
                  {pendingOrders}
                </span>
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-neutral-355 uppercase tracking-wide">Processing</span>
                </div>
                <span className="text-xs font-black text-white font-mono bg-blue-950/20 px-2.5 py-1 border border-blue-900/60 rounded-xl shadow-inner">
                  {processingOrders}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-neutral-355 uppercase tracking-wide">Completed</span>
                </div>
                <span className="text-xs font-black text-white font-mono bg-emerald-950/20 px-2.5 py-1 border border-emerald-900/60 rounded-xl shadow-inner">
                  {completedOrders}
                </span>
              </div>
            </div>
          </div>

              {/* Stock Warners */}
              <div className="bg-neutral-950 border border-neutral-900 p-4.5 rounded-2xl space-y-3.5 shadow-inner">
                <h5 className="text-[9px] text-neutral-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#C1121F] animate-pulse" />
                  Fulfillment Alerts
                </h5>
                <div className="grid grid-cols-2 gap-3 text-center text-[10px] font-black uppercase tracking-wider">
                  <div className="p-2.5 bg-[#050505] rounded-xl border border-neutral-900">
                    <p className="text-[9px] text-neutral-550">Low Stock</p>
                    <p className="text-lg font-black text-[#FF4D4D] font-mono mt-1">{lowStockProductsCount}</p>
                  </div>
                  <div className="p-2.5 bg-[#050505] rounded-xl border border-neutral-900">
                    <p className="text-[9px] text-neutral-550">Out of Stock</p>
                    <p className="text-lg font-black text-red-500 font-mono mt-1">{outOfStockProductsCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Row: Recent Orders Table & Low-Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders List */}
        <div className="lg:col-span-8">
          <ScrollReveal fiery={false}>
            <div className="bg-[#0F0F0F] border border-neutral-900 p-6 rounded-3xl space-y-6 shadow-sm h-full">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3.5">
                <h4 className="text-[10px] text-neutral-450 font-black uppercase tracking-widest">
                  Recent Transactions
                </h4>
                <Link
                  href="/admin/orders"
                  className="text-[9px] font-black text-[#FF4D4D] hover:text-white hover:underline uppercase tracking-widest transition-colors duration-200"
                >
                  View All Orders
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-900 text-neutral-500 uppercase font-black tracking-widest text-[9px]">
                        <th className="pb-3.5 px-2">Order ID</th>
                        <th className="pb-3.5 px-2">Customer</th>
                        <th className="pb-3.5 px-2 text-right">Amount</th>
                        <th className="pb-3.5 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/40 text-[11px] font-bold">
                      {recentOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-neutral-900/20 transition-all duration-200">
                          <td className="py-3.5 px-2 font-mono text-white font-black uppercase">
                            <Link href={`/admin/orders/${ord.id}`} className="hover:text-[#FF4D4D] tracking-wider">
                              {ord.orderNumber}
                            </Link>
                          </td>
                          <td className="py-3.5 px-2 text-neutral-400">
                            <p className="font-extrabold text-neutral-250 uppercase tracking-wide text-[10px]">{ord.user?.name || 'Guest'}</p>
                            <p className="text-[9px] text-neutral-550 font-mono tracking-normal lowercase">{ord.user?.email || 'N/A'}</p>
                          </td>
                          <td className="py-3.5 px-2 text-right font-mono font-black text-white">
                            ₹{ord.total.toFixed(0)}
                          </td>
                          <td className="py-3.5 px-2 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[8.5px] font-black uppercase rounded-lg tracking-widest shadow-sm ${
                                ord.orderStatus === 'DELIVERED'
                                  ? 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-400'
                                  : ord.orderStatus === 'CANCELLED'
                                  ? 'bg-neutral-950 border border-neutral-900 text-neutral-500'
                                  : 'bg-amber-950/20 border border-amber-900/40 text-amber-400 animate-pulse'
                              }`}
                            >
                              {ord.orderStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-neutral-550 text-xs text-center py-6 font-bold uppercase tracking-wider">No order logs in database.</p>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* Low-Stock Monitor Panel */}
        <div className="lg:col-span-4">
          <ScrollReveal fiery={false}>
            <div className="bg-[#0F0F0F] border border-neutral-900 p-6 rounded-3xl space-y-6 shadow-sm h-full">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3.5">
            <h4 className="text-[10px] text-neutral-450 font-black uppercase tracking-widest">
              Stock Warnings
            </h4>
            <Link
              href="/admin/inventory"
              className="text-[9px] font-black text-[#FF4D4D] hover:text-white hover:underline uppercase tracking-widest transition-colors duration-200"
            >
              Go to Inventory
            </Link>
          </div>

          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950/40 border border-neutral-900 hover:border-neutral-800 transition-colors shadow-sm"
                >
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-extrabold text-white line-clamp-1 uppercase tracking-wide">
                      {inv.product.title}
                    </span>
                    <span className="text-[8.5px] text-neutral-500 font-mono font-bold block uppercase tracking-wider">
                      {inv.product.SKU}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-[8.5px] font-mono font-black rounded-lg tracking-widest shrink-0 ${
                      inv.quantity === 0
                        ? 'bg-rose-950/20 border border-rose-900/40 text-rose-450'
                        : 'bg-amber-950/20 border border-amber-900/40 text-amber-450 animate-pulse'
                    }`}
                  >
                    {inv.quantity} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-550 text-xs text-center py-6 font-bold uppercase tracking-wider">All stock levels stable.</p>
          )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
