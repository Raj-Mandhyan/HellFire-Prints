import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Lock, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Hellfire Prints',
  description: 'Privacy Policy explaining how Hellfire Prints collects, uses, and protects customer personal and transaction data.',
};

export default function PrivacyPolicy() {
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
            <Lock className="w-3.5 h-3.5 text-[#C1121F]" />
            Privacy & Trust
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] via-[#FF4D4D] to-[#f77f00] fiery-text-glow font-black">Policy</span>
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
              1. Information We Collect
            </h2>
            <p>
              At Hellfire Prints, we respect your privacy and are committed to safeguarding the personal details you share with us. 
              We collect information in the following categories:
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              1.1 Account Information
            </h3>
            <p>
              When you sign up or log in, we collect your name, email address, and account credentials. Passwords are encrypted 
              using cryptographic hashing (bcryptjs) immediately upon input and are never stored or visible in plain text.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              1.2 Order and Transaction Information
            </h3>
            <p>
              To process your purchases, we collect details related to items in your cart, selected configurations (size, frame finish, paper type), 
              saved shipping/delivery addresses (including name, telephone number, street, city, state, postal code, and country), 
              and discount coupons applied.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              1.3 Payment Information
            </h3>
            <p className="border-l-2 border-[#C1121F] pl-4 py-1 bg-red-950/5 rounded-r-xl">
              <strong>CRITICAL NOTICE:</strong> Hellfire Prints does <strong>not</strong> collect, process, or store credit/debit card numbers, CVVs, expiry dates, 
              UPI PINs, or net banking credentials. All payments are completed securely inside the environment of our payment gateway 
              partner, <strong>Razorpay</strong>. Razorpay operates under PCI-DSS standards. We only receive a transaction success/failure status 
              and a unique payment transaction ID to associate with your order.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              1.4 Website Usage and Technical Information
            </h3>
            <p>
              We collect standard metadata when you visit our site, including IP addresses, browser types, operating systems, pages viewed, 
              referring URLs, and basic interaction data to diagnose website health and prevent malicious bot activity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              2. How We Use Information
            </h2>
            <p>
              We use the collected details to fulfill our business obligations to you:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Configuring and manufacturing custom prints in our studio.</li>
              <li>Processing secure transactions via Razorpay.</li>
              <li>Fulfilling deliveries and sending live tracking details via Shiprocket.</li>
              <li>Sending transactional email updates (order confirmation, dispatch alerts) via Resend.</li>
              <li>Providing active user dashboard tracking for saved addresses and past orders.</li>
              <li>Administering database statuses, site security checks, and inventory logs.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              3. Cookies and Similar Technologies
            </h2>
            <p>
              We use cookies to maintain active login sessions, save items in your shopping cart, and preserve customized poster configurations 
              in your browser cache during navigation. You can disable cookies in browser settings, but doing so will prevent you from signing in 
              or using the checkout features.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              4. Third-Party Integrations
            </h2>
            <p>
              We share relevant details with third-party processors only to complete essential e-commerce tasks:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Razorpay (Payment Gateway):</strong> Customer contact details and billing amount are relayed to verify checkout authorization.
              </li>
              <li>
                <strong>Shiprocket (Logistics):</strong> Delivery address, name, and telephone number are synchronized to generate waybills and execute parcel deliveries.
              </li>
              <li>
                <strong>Resend (Transactional Emails):</strong> Email addresses are used to forward order receipts and delivery updates.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              5. Data Security
            </h2>
            <p>
              Your data is housed in secure cloud databases. We utilize standard SSL encryption for all data transmissions, role-based 
              administrator clearance restrictions, database firewalls, and token-based account session verification. While we take every 
              precaution, no method of digital storage or web transmission is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              6. Data Retention
            </h2>
            <p>
              We retain account profiles, order histories, and delivery presets indefinitely to ensure access to your customer panel. 
              Billing information is retained as required by financial regulations and tax compliance in India.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              7. User Rights
            </h2>
            <p>
              You have the right to log in and update your account profiles or saved delivery locations at any time. You can request 
              account deletion by contacting support. Note that details tied to completed transactions must be kept for legal audit purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              8. Children&apos;s Privacy
            </h2>
            <p>
              Our posters and custom printing services are intended for individuals who are at least 18 years of age or accessing under the supervision 
              of a parent/guardian. We do not intentionally collect data from children under 13.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              9. Changes to Privacy Policy
            </h2>
            <p>
              We may update this policy to reflect platform updates or shifts in legal frameworks. Updated policies are uploaded here immediately 
              with revised timestamps.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              10. Contact Information
            </h2>
            <p>
              For privacy audits, data deletion requests, or questions regarding our privacy rules, please contact:
            </p>
            <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-900/60 space-y-2 font-semibold text-xs sm:text-sm">
              <p className="flex justify-between border-b border-neutral-900/40 pb-2">
                <span className="text-neutral-500">Brand Name:</span>
                <span className="text-white">Hellfire Prints</span>
              </p>
              <p className="flex justify-between border-b border-neutral-900/40 pb-2">
                <span className="text-neutral-500">Legal/Support Email:</span>
                <span className="text-[#FF4D4D] font-mono">biswasbp10@gmail.com</span>
              </p>
              <p className="flex justify-between border-b border-neutral-900/40 pb-2">
                <span className="text-neutral-500">Support Phone:</span>
                <span className="text-white font-mono">+91 93823 65039</span>
              </p>
              <p className="flex justify-between">
                <span className="text-neutral-500">Registered Office Address:</span>
                <span className="text-white text-right max-w-xs">H-16, Room:409, IIEST Shibpur, Howrah, West Bengal, India.</span>
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
