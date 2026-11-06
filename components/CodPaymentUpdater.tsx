'use client';

import { useState, useTransition } from 'react';
import { markCodPaymentCollectedAction } from '@/app/admin/actions';
import { Banknote, CheckCircle2, RotateCw, ShieldAlert } from 'lucide-react';

interface CodPaymentUpdaterProps {
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
  amount: number;
}

export default function CodPaymentUpdater({
  orderId,
  paymentStatus,
  orderStatus,
  amount,
}: CodPaymentUpdaterProps) {
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(paymentStatus);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const isCollected = currentPaymentStatus === 'CAPTURED';
  const isCancelled = orderStatus === 'CANCELLED';

  const handleMarkCollected = () => {
    if (isCollected || isCancelled || isPending) return;

    startTransition(async () => {
      const res = await markCodPaymentCollectedAction(orderId);
      if (res.success) {
        setCurrentPaymentStatus('CAPTURED');
        setFeedback({
          type: 'success',
          msg: res.message || 'COD payment marked as collected successfully.',
        });
      } else {
        setFeedback({
          type: 'error',
          msg: res.error || 'Failed to mark COD payment as collected.',
        });
      }

      setTimeout(() => setFeedback(null), 4000);
    });
  };

  return (
    <div className="space-y-3 pt-4 border-t border-neutral-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 p-4.5 border border-neutral-900 rounded-2xl">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-[#C1121F]" />
            COD Payment Collection Action
          </p>
          <p className="text-xs text-neutral-300 font-medium">
            {isCollected ? (
              <>Cash on Delivery payment of <span className="text-emerald-400 font-bold font-mono">₹{amount.toFixed(0)}</span> has been collected and verified.</>
            ) : isCancelled ? (
              <>This order is cancelled. Payment collection is disabled.</>
            ) : (
              <>Confirm once <span className="text-white font-bold font-mono">₹{amount.toFixed(0)}</span> has been collected from the customer upon delivery.</>
            )}
          </p>
        </div>

        {isCollected ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/60 text-emerald-400 text-[10px] font-black uppercase tracking-widest shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            Payment Collected
          </div>
        ) : (
          <button
            type="button"
            onClick={handleMarkCollected}
            disabled={isPending || isCancelled}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 disabled:scale-100 ${
              isPending || isCancelled
                ? 'bg-neutral-900 text-neutral-600 border border-neutral-900 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30'
            }`}
          >
            {isPending ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark COD Payment Collected</span>
              </>
            )}
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider ${
            feedback.type === 'success'
              ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
              : 'bg-rose-950/20 border-rose-900/60 text-rose-350'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

