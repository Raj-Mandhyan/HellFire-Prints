'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatusAction } from '@/app/admin/actions';
import { Check, ShieldAlert, RotateCw } from 'lucide-react';
import { OrderStatus } from '@prisma/client';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, status as OrderStatus);
      if (res.success) {
        setFeedback({ type: 'success', msg: 'Order pipeline stage updated successfully.' });
      } else {
        setFeedback({ type: 'error', msg: res.error || 'Failed to update order status.' });
      }

      setTimeout(() => setFeedback(null), 3000);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-neutral-950 p-4.5 border border-neutral-900 rounded-3xl shadow-inner">
        <div className="flex-1">
          <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest block mb-1.5 pl-1">
            Fulfillment Stage
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-[#0F0F0F] border border-neutral-900 px-3.5 py-2.5 rounded-xl text-xs text-neutral-300 font-extrabold uppercase tracking-wider cursor-pointer focus:outline-none focus:border-[#C1121F] appearance-none"
          >
            <option value="PENDING">PENDING (UNPAID DRAFT)</option>
            <option value="CONFIRMED">CONFIRMED (AWAITING SHIPMENT)</option>
            <option value="SHIPPED">SHIPPED (IN TRANSIT)</option>
            <option value="DELIVERED">DELIVERED (COMPLETED)</option>
            <option value="CANCELLED">CANCELLED (VOIDED)</option>
          </select>
        </div>

        <button
          onClick={handleUpdate}
          disabled={status === currentStatus || isPending}
          className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 self-end shrink-0 cursor-pointer active:scale-95 disabled:scale-100 ${
            status === currentStatus || isPending
              ? 'bg-neutral-900 text-neutral-600 border border-neutral-900 cursor-not-allowed'
              : 'bg-[#C1121F] hover:bg-[#A00F19] text-white shadow-lg shadow-red-950/20'
          }`}
        >
          {isPending ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Advance State</span>
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider ${
            feedback.type === 'success'
              ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
              : 'bg-rose-950/20 border-rose-900/60 text-rose-350'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4.5 h-4.5 text-rose-400 shrink-0" />
          )}
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
