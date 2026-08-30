import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BadgeHelp, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | Hellfire Prints',
  description: 'Cancellation and Refund Policy for purchases at Hellfire Prints. Details on eligibility, custom prints, and return conditions.',
};

export default function CancellationAndRefundPolicy() {
  return (
    <div className="min-h-screen bg-transparent text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C1121F] selection:text-white overflow-x-hidden">
      {/* Brand Navigation Header */}
      <Navbar />

      {/* Atmospheric Glow Elements */}
      <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] rounded-full bg-[#C1121F]/5 blur-[130px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[5%] w-[350px] h-[350px] rounded-full bg-[#f77f00]/3 blur-[120px] -z-10 pointer-events-none" />

      {/* Main Container */}
      <main className="flex-grow max-w-4xl mx-auto px-6 py-16 w-full relative z-10">
        
        {/* Header Block */}
        <div className="mb-10 text-center sm:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-950/60 border border-neutral-900 rounded-full text-[10px] font-black text-[#FF4D4D] tracking-widest uppercase">
            <BadgeHelp className="w-3.5 h-3.5 text-[#C1121F]" />
            Return Guidelines
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Cancellation & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] via-[#FF4D4D] to-[#f77f00] fiery-text-glow font-black">Refunds</span>
          </h1>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Last Updated: August 30, 2026
          </p>
        </div>

        {/* Content Panel */}
        <div className="premium-glass p-8 sm:p-12 rounded-3xl space-y-8 text-neutral-300 leading-relaxed text-sm sm:text-base border border-neutral-900 shadow-2xl">
          
          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              1. Order Cancellation
            </h2>
            <p>
              Because our posters are printed and custom-framed to order, our capacity for cancellations depends on the status of your order:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Standard Catalog Prints:</strong> You can request a cancellation within <strong>2 hours</strong> of placing your order or before production has started (whichever is earlier). Once a poster is printed or framed, the order enters packaging and cannot be cancelled.
              </li>
              <li>
                <strong>Custom Studio Prints:</strong> Since custom uploads enter our automated prepress and print queues almost immediately after checkout, <strong>no cancellations, updates, or modifications are permitted</strong> once the payment is completed.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              2. Return Eligibility
            </h2>
            <p>
              In order to keep custom printing viable, Hellfire Prints does not support &quot;change-of-mind&quot; returns or exchanges. 
              Returns are <strong>only</strong> accepted in cases where the product delivered satisfies one of the following exceptions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>The package arrives visibly damaged, crushed, or torn.</li>
              <li>The print displays severe manufacturing defects (e.g. alignment issues, extreme ink smudges, incorrect sizing).</li>
              <li>The wrong items (wrong poster design, incorrect frame choice, or wrong size) were delivered.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              3. Damaged or Incorrect Products
            </h2>
            <p>
              To file a damage or incorrect-product claim:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                Contact our support team within <strong>48 hours</strong> of package delivery.
              </li>
              <li>
                Provide your order number, invoice, and clear photographs or an unboxing video demonstrating the damage, printing error, or packaging mismatch.
              </li>
              <li>
                Our quality check team will evaluate your claim within 24–48 hours.
              </li>
            </ol>
            <p className="text-xs text-neutral-400">
              *Claims filed after 48 hours of delivery cannot be evaluated due to logistics constraints.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              4. Refund and Replacement Options
            </h2>
            <p>
              If your claim is approved, you can select one of the following solutions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Free Replacement (Recommended):</strong> We will reprint and frame a brand-new copy of the poster and dispatch it to your original address at no additional shipping fee.
              </li>
              <li>
                <strong>Full Refund:</strong> We will initiate a refund for the full amount paid (including proportional tax and shipping fees) back to your original payment method.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              5. Refund Method and Processing Time
            </h2>
            <p>
              All refunds are processed directly through our secure transaction gateway, <strong>Razorpay</strong>, and credited back to the source account (UPI, credit/debit card, net banking, or wallet used during purchase).
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Initiation Time:</strong> Refund commands are sent to Razorpay within 24 hours of claim approval.
              </li>
              <li>
                <strong>Settlement Timeline:</strong> The funds typically reflect in your bank account or card balance within <strong>5–7 business days</strong>, subject to your banking partner&apos;s clearance schedules.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              6. Non-Returnable Items
            </h2>
            <p>
              The following are strictly exempt from returns, refunds, or replacements:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Posters containing user-uploaded images that have low resolution, pixelation, or framing flaws designed by the user in the Custom Studio.</li>
              <li>Minor color tone differences resulting from screen calibration variations.</li>
              <li>Damage caused by improper handling, water exposure, or self-inflicted tears after delivery.</li>
              <li>Orders with incorrect delivery addresses provided by the customer at checkout (returned to hub).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              7. Cancellation & Refund Support
            </h2>
            <p>
              To request an order cancellation or file a product damage claim, please reach out to our team:
            </p>
            <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-900/60 space-y-2 font-semibold text-xs sm:text-sm">
              <p className="flex justify-between border-b border-neutral-900/40 pb-2">
                <span className="text-neutral-500">Brand Name:</span>
                <span className="text-white">Hellfire Prints</span>
              </p>
              <p className="flex justify-between border-b border-neutral-900/40 pb-2">
                <span className="text-neutral-500">Refund Claims Email:</span>
                <span className="text-[#FF4D4D] font-mono">biswasbp10@gmail.com</span>
              </p>
              <p className="flex justify-between">
                <span className="text-neutral-500">Support Phone:</span>
                <span className="text-white font-mono">+91 93823 65039</span>
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
