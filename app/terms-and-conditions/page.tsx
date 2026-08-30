import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Hellfire Prints',
  description: 'Terms and conditions for buying premium poster prints and custom poster designs from Hellfire Prints.',
};

export default function TermsAndConditions() {
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
            <ShieldCheck className="w-3.5 h-3.5 text-[#C1121F]" />
            Legal Agreement
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] via-[#FF4D4D] to-[#f77f00] fiery-text-glow font-black">Conditions</span>
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
              1. Introduction
            </h2>
            <p>
              Welcome to <strong>Hellfire Prints</strong>. These Terms & Conditions govern your use of our website located at 
              website URLs and the purchase of any products from our catalog or custom creations designed via our online studio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              2. Acceptance of Terms
            </h2>
            <p>
              By accessing our website, creating a user account, or placing an order, you agree to be bound by these Terms & Conditions. 
              If you do not agree with any part of these terms, you must not use this website or make purchases.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              3. Products and Services
            </h2>
            <p>
              Hellfire Prints sells premium physical poster prints. This includes standard catalog posters (gaming, anime, supercars, etc.) 
              and custom poster configurations designed using our online custom builder studio. All posters are manufactured to order 
              using selected premium paper sizes, frames, and high-definition print engines.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              4. Product Information and Pricing
            </h2>
            <p>
              We strive to display our poster prints, dimensions, paper quality, frames, and prices as accurately as possible. 
              However, colors and details shown on screen may differ slightly from the physical printed item due to device display configurations. 
              All prices listed on the website are in Indian Rupees (INR), inclusive of relevant taxes unless stated otherwise, and subject to change without notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              5. Orders and Order Acceptance
            </h2>
            <p>
              When you place an order, it represents an offer to purchase. We reserve the right to accept or decline orders for reasons 
              including product unavailability, errors in pricing or descriptions, issues flagged during payment processing, or regional 
              shipping restrictions. Once accepted, we will generate a system-automated invoice and initiate production.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              6. Custom and Personalized Products
            </h2>
            <p>
              Our Custom Poster Studio allows users to upload custom images, crop designs, adjust scales, and apply custom text configurations. 
              By uploading media, you represent and warrant that you own the rights to the image or possess written authorization. 
              We reserve the right to cancel orders containing images that violate copyright, promote hate speech, or contain illicit material. 
              Custom posters enter automated production immediately and cannot be modified or cancelled once production starts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              7. Payments
            </h2>
            <p>
              Payments are processed securely via our integrated payment gateway partner, <strong>Razorpay</strong>. We accept major credit/debit cards, 
              net banking, UPI, and authorized mobile wallets. Hellfire Prints does not store your card details, CVV, or UPI PINs. 
              Payment authentication and clearance are completed entirely inside the Razorpay platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              8. User Accounts
            </h2>
            <p>
              To track orders, save delivery locations, or save custom studio progress, you may create a user account. You are solely 
              responsible for maintaining the confidentiality of your account credentials (email and password). Any activities taking 
              place under your account are your responsibility. Suspicious account actions should be immediately reported to support.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              9. Intellectual Property
            </h2>
            <p>
              All materials on this website, including designs, product listings, interface copy, branding, logo marks, graphics, and studio 
              software are the intellectual property of Hellfire Prints. You may not copy, reproduce, scrape, or distribute any part of this site 
              without explicit written authorization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              10. Prohibited Use
            </h2>
            <p>
              Users are prohibited from attempting to bypass site security, inject malicious scripts, exploit vulnerabilities in databases, 
              scraping product images for commercial reuse, or uploading unauthorized custom media that infringes on third-party trademarks 
              or copyrights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              11. Shipping and Delivery
            </h2>
            <p>
              Shipments are executed through our authorized shipping provider, <strong>Shiprocket</strong>. Serviceable pin codes, dispatch schedules, 
              and estimated delivery timelines are detailed in our Shipping Policy. Delivery times are estimates and may be affected by logistics 
              delays or weather events.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              12. Cancellation, Returns and Refunds
            </h2>
            <p>
              Because posters are printed and framed dynamically based on user selections, we do not accept change-of-mind cancellations or returns. 
              Orders can only be cancelled before production has commenced. Custom poster orders enter production immediately and cannot be cancelled.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              13. Damaged or Wrong Products
            </h2>
            <p>
              If your poster print arrives damaged, torn, or does not match the product you ordered, please contact us within 48 hours of 
              delivery. Provide your order number along with clear unboxing images or video documentation of the damage. Verified requests 
              will be eligible for a replacement shipment or store refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              14. Limitation of Liability
            </h2>
            <p>
              Hellfire Prints, its founders, and employees will not be held liable for any indirect, incidental, or consequential damages 
              arising out of your use of the website or products purchased. In no event shall our total liability to you exceed the purchase 
              amount of the specific product in dispute.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              15. Changes to Terms
            </h2>
            <p>
              We reserve the right to revise or replace these Terms & Conditions at any time. Significant updates will be highlighted via our 
              updates announcement strips or emailed to registered account holders. Continued use of the website following changes constitutes 
              your agreement to updated terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              16. Governing Law
            </h2>
            <p>
              These terms are governed by and construed in accordance with the laws of India. Any disputes arising out of these terms or purchases 
              made through Hellfire Prints shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              17. Contact Information
            </h2>
            <p>
              For legal inquiries, clarification on these terms, or support questions, please reach out to us at:
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
