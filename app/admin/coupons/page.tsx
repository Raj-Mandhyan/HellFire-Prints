import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { createCouponAction, toggleCouponAction, deleteCouponAction } from './actions';
import { Calendar, Trash2, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  await requireAdmin();

  // Load all coupons from Neon PostgreSQL
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            COUPONS & <span className="text-[#C1121F]">DISCOUNTS</span>
          </h1>
          <p className="text-neutral-450 text-xs font-medium">
            Manage promotional campaigns, create fixed or percentage coupons, and set purchase limits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Create Coupon Form */}
        <div className="lg:col-span-4 bg-[#161616] border border-neutral-900 rounded-3xl p-6 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#C1121F]/5 blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
            <Plus className="w-4 h-4 text-[#C1121F]" />
            <h3 className="text-xs text-neutral-200 font-extrabold uppercase tracking-widest">
              Create New Coupon
            </h3>
          </div>

          <form action={async (formData) => {
            'use server';
            const res = await createCouponAction(null, formData);
            if (res && res.error) {
              // Note: in Server Actions we can return error or handle redirects
              // Since this is a server action form, we redirect or revalidate automatically.
            }
          }} className="space-y-4">
            {/* Code */}
            <div className="space-y-1">
              <label htmlFor="code" className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Coupon Code
              </label>
              <input
                type="text"
                name="code"
                id="code"
                required
                placeholder="e.g. EXTRA20"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] font-mono uppercase"
              />
            </div>

            {/* Discount Type */}
            <div className="space-y-1">
              <label htmlFor="discountType" className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Discount Type
              </label>
              <select
                name="discountType"
                id="discountType"
                required
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-neutral-400 focus:outline-none focus:border-[#C1121F] font-bold uppercase cursor-pointer"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div className="space-y-1">
              <label htmlFor="discountValue" className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Discount Value
              </label>
              <input
                type="number"
                name="discountValue"
                id="discountValue"
                required
                min="0"
                step="0.01"
                placeholder="e.g. 10"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] font-mono"
              />
            </div>

            {/* Min Purchase */}
            <div className="space-y-1">
              <label htmlFor="minPurchase" className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Minimum Purchase Amount (₹)
              </label>
              <input
                type="number"
                name="minPurchase"
                id="minPurchase"
                defaultValue="0"
                min="0"
                placeholder="e.g. 1499"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] font-mono"
              />
            </div>

            {/* Max Discount */}
            <div className="space-y-1">
              <label htmlFor="maxDiscount" className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Max Discount Cap (₹, Optional)
              </label>
              <input
                type="number"
                name="maxDiscount"
                id="maxDiscount"
                min="0"
                placeholder="e.g. 300"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] font-mono"
              />
            </div>

            {/* Usage Limit */}
            <div className="space-y-1">
              <label htmlFor="usageLimit" className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Total Usage Limit (Optional)
              </label>
              <input
                type="number"
                name="usageLimit"
                id="usageLimit"
                min="0"
                placeholder="e.g. 100"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] font-mono"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label htmlFor="startDate" className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                name="startDate"
                id="startDate"
                required
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-neutral-400 focus:outline-none focus:border-[#C1121F]"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label htmlFor="endDate" className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Expiry Date & Time
              </label>
              <input
                type="datetime-local"
                name="endDate"
                id="endDate"
                required
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-neutral-400 focus:outline-none focus:border-[#C1121F]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#C1121F] hover:bg-[#A00F19] text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-950/20 cursor-pointer pt-4"
            >
              <Plus className="w-4 h-4" />
              Create Campaign Coupon
            </button>
          </form>
        </div>

        {/* Right Side: Coupons List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#161616]/40 border border-neutral-900/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="p-5 border-b border-neutral-900 bg-[#161616]/20">
              <h2 className="text-lg font-bold tracking-tight text-white uppercase">Active Campaigns</h2>
              <p className="text-xs text-neutral-500 mt-1">List of all promotional codes currently saved in PostgreSQL.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-xs text-neutral-400 uppercase tracking-widest font-semibold bg-neutral-950/40">
                    <th className="py-4 px-6">Coupon details</th>
                    <th className="py-4 px-6">Discount details</th>
                    <th className="py-4 px-6">Usage</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/60 text-xs">
                  {coupons.length > 0 ? (
                    coupons.map((coupon) => {
                      const isExpired = new Date(coupon.endDate) < new Date();
                      return (
                        <tr key={coupon.id} className="hover:bg-neutral-900/20 transition-colors group">
                          {/* Code & Dates */}
                          <td className="py-5 px-6 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white font-mono bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded uppercase tracking-wider text-[#FF4D4D]">
                                {coupon.code}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-500 font-medium space-y-0.5">
                              <p className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#C1121F]" />
                                Start: {new Date(coupon.startDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                              </p>
                              <p className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#C1121F]" />
                                Expire: {new Date(coupon.endDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                              </p>
                            </div>
                          </td>

                          {/* Discount Values */}
                          <td className="py-5 px-6 space-y-1">
                            <p className="font-bold text-white uppercase">
                              {coupon.discountType === 'PERCENTAGE' 
                                ? `${coupon.discountValue}% OFF` 
                                : `₹${coupon.discountValue} OFF`}
                            </p>
                            <p className="text-[10px] text-neutral-500">
                              Min Purchase: <span className="font-bold text-neutral-400">₹{coupon.minPurchase}</span>
                            </p>
                            {coupon.maxDiscount && (
                              <p className="text-[10px] text-neutral-500">
                                Max Cap: <span className="font-bold text-neutral-400">₹{coupon.maxDiscount}</span>
                              </p>
                            )}
                          </td>

                          {/* Usages count */}
                          <td className="py-5 px-6 space-y-1">
                            <p className="font-mono text-white font-bold">
                              {coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'usages'}
                            </p>
                            {coupon.usageLimit && (
                              <div className="w-24 bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-[#C1121F] h-1.5 rounded-full"
                                  style={{ width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%` }}
                                ></div>
                              </div>
                            )}
                          </td>

                          {/* Active / Expired status */}
                          <td className="py-5 px-6 text-center">
                            {isExpired ? (
                              <span className="inline-block px-2.5 py-1 text-[9px] font-bold rounded-md bg-neutral-900 border border-neutral-850 text-neutral-550 uppercase tracking-wider">
                                EXPIRED
                              </span>
                            ) : coupon.active ? (
                              <span className="inline-block px-2.5 py-1 text-[9px] font-bold rounded-md bg-emerald-950/60 border border-emerald-900/80 text-emerald-400 uppercase tracking-wider">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 text-[9px] font-bold rounded-md bg-red-950/60 border border-red-900/80 text-red-400 uppercase tracking-wider">
                                DISABLED
                              </span>
                            )}
                          </td>

                          {/* Action triggers */}
                          <td className="py-5 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Toggle active button */}
                              <form action={async () => {
                                'use server';
                                await toggleCouponAction(coupon.id, !coupon.active);
                              }}>
                                <button
                                  type="submit"
                                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                    coupon.active 
                                      ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-750' 
                                      : 'bg-[#C1121F]/10 border-[#C1121F]/20 text-[#FF4D4D] hover:bg-[#C1121F]/20'
                                  }`}
                                >
                                  {coupon.active ? 'Disable' : 'Enable'}
                                </button>
                              </form>

                              {/* Delete button */}
                              <form action={async () => {
                                'use server';
                                await deleteCouponAction(coupon.id);
                              }}>
                                <button
                                  type="submit"
                                  className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-500 hover:text-[#FF4D4D] hover:border-red-950/40 transition-colors cursor-pointer"
                                  title="Delete coupon"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-500 uppercase tracking-wider font-semibold">
                        No coupons found. Create your first campaign.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
