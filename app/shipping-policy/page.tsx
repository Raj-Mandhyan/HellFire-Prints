import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Truck, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping Policy | Hellfire Prints',
  description: 'Shipping Policy for Hellfire Prints, outlining order processing, custom print production times, shipping rates, and delivery estimates across India.',
};

export default function ShippingPolicy() {
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
            <Truck className="w-3.5 h-3.5 text-[#C1121F]" />
            Logistics & Delivery
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Shipping <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] via-[#FF4D4D] to-[#f77f00] fiery-text-glow font-black">Policy</span>
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
              1. Order Processing and Production Time
            </h2>
            <p>
              Every poster from Hellfire Prints is built to order. This means we print, finish, and frame your chosen poster configurations 
              after your order is confirmed.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Standard Catalog Prints:</strong> Processed and printed within 1–2 business days.
              </li>
              <li>
                <strong>Custom Poster Studio Prints:</strong> Due to image quality inspections and custom layouts, production takes 2–3 business days.
              </li>
            </ul>
            <p className="text-xs text-neutral-400">
              *Business days exclude Sundays and national holidays in India.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              2. Dispatch and Delivery Partner
            </h2>
            <p>
              Once printing, quality checks, and framing (if ordered) are completed, orders are safely packed in heavy-duty cardboard tubes 
              or reinforced flat boxes. Shipments are dispatched via our authorized logistics manager, <strong>Shiprocket</strong>, who coordinates 
              with premium courier networks (including Bluedart, Delhivery, and Xpressbees) to ensure safe handling.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              3. Estimated Delivery Time
            </h2>
            <p>
              Delivery time varies based on the destination address. Typical delivery windows from dispatch are:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Metro Cities (Delhi NCR, Mumbai, Bengaluru, Chennai, Kolkata, etc.):</strong> 2–4 business days.</li>
              <li><strong>Tier 2 & Tier 3 Cities:</strong> 3–6 business days.</li>
              <li><strong>Northeast India and Special Regions:</strong> 5–8 business days.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              4. Shipping Charges
            </h2>
            <p>
              Shipping rates are calculated dynamically based on your order subtotal at checkout:
            </p>
            <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-900/60 space-y-2 font-semibold text-xs sm:text-sm max-w-md">
              <p className="flex justify-between border-b border-neutral-900/40 pb-2">
                <span>Orders below ₹1,999:</span>
                <span className="text-white">₹150 Flat Shipping Fee</span>
              </p>
              <p className="flex justify-between text-[#FF4D4D]">
                <span>Orders of ₹1,999 or above:</span>
                <span>FREE Shipping</span>
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              5. Delivery Locations
            </h2>
            <p>
              We ship to serviceable pincodes throughout India. If our delivery partners are unable to service a specific remote region, 
              we will contact you within 24 hours of checkout to arrange alternative shipping routes or issue a full refund. 
              We do not support international shipping at this time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              6. Order Tracking
            </h2>
            <p>
              As soon as your shipment is dispatched, you will receive a tracking link forwarded to your registered email address via 
              our transactional email mailer. You can track the live transit status of your package on the courier partner&apos;s tracking page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              7. Delayed Delivery
            </h2>
            <p>
              While we work to ensure prompt dispatches, delivery delays may occasionally occur due to extreme weather, festivals, high logistics 
              network congestion, or local public disruptions. We will notify you of any known delays and work with courier support to expedite shipping.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              8. Failed Delivery / Incorrect Address
            </h2>
            <p>
              Our shipping partners make up to three delivery attempts before returning the package to our hub. If a delivery fails due to an 
              incorrect address, invalid contact number, or customer unavailability, we will coordinate with you to arrange a reshipment. 
              A secondary shipping fee of ₹150 may be charged for re-dispatching returned packages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              9. Damaged Packaging
            </h2>
            <p>
              Our prints are dispatched in high-strength packaging. If you notice severe damage, crumpling, or tearing on the outer packaging 
              upon delivery, please take photographs of the box before accepting the package, or reject the delivery and contact us immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              10. Lost Shipments
            </h2>
            <p>
              In rare instances where a package is marked lost in transit by the logistics provider, we will print and ship a replacement order 
              at no additional cost, or issue a full refund if requested.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              11. Shipping Support
            </h2>
            <p>
              For updates on delayed packages, modifications to shipping details prior to dispatch, or delivery support, please contact:
            </p>
            <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-900/60 space-y-2 font-semibold text-xs sm:text-sm">
              <p className="flex justify-between border-b border-neutral-900/40 pb-2">
                <span className="text-neutral-500">Brand Name:</span>
                <span className="text-white">Hellfire Prints</span>
              </p>
              <p className="flex justify-between border-b border-neutral-900/40 pb-2">
                <span className="text-neutral-500">Logistics Support Email:</span>
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
