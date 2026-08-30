import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Flame, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | Hellfire Prints',
  description: 'Learn about Hellfire Prints, the premium Indian poster print brand selling cinematic, gaming, automotive, and customized wall art.',
};

export default function AboutUs() {
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
        <div className="mb-12 text-center sm:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-950/60 border border-neutral-900 rounded-full text-[10px] font-black text-[#FF4D4D] tracking-widest uppercase">
            <Flame className="w-3.5 h-3.5 text-[#C1121F]" />
            Our Brand Story
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
            Fueling <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] via-[#FF4D4D] to-[#f77f00] fiery-text-glow font-black">Your Walls</span>
          </h1>
          <p className="max-w-xl text-neutral-400 text-xs sm:text-sm font-semibold leading-relaxed">
            Hellfire Prints is a premium art collective and e-commerce platform crafting high-contrast cinematic poster prints inside India.
          </p>
        </div>

        {/* Content Panel */}
        <div className="premium-glass p-8 sm:p-12 rounded-3xl space-y-10 text-neutral-300 leading-relaxed text-sm sm:text-base border border-neutral-900 shadow-2xl">
          
          {/* Section: Who We Are */}
          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              Who We Are
            </h2>
            <p>
              We are a team of curators, designers, and printing experts dedicated to transforming blank spaces. 
              Hellfire Prints caters to gamers, automotive enthusiasts, anime collectors, and cinema lovers who seek high-impact, 
              visually striking aesthetics for their environments.
            </p>
          </section>

          {/* Section: What We Sell */}
          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              What We Sell
            </h2>
            <p>
              Our catalog is split into two core disciplines:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Premium Curated Collections:</strong> Limited-run, high-definition designs encompassing cyberpunk styles, 
                high-contrast supercars, gaming zones, and minimalist typography.
              </li>
              <li>
                <strong>Hellfire Custom Poster Studio:</strong> A digital custom-building studio where users can upload personal images, 
                adjust positioning, select sizing layouts, configure paper weights, and add high-end museum-grade framing options.
              </li>
            </ul>
          </section>

          {/* Section: Production Quality */}
          <section className="space-y-4">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              Engineered for Quality
            </h2>
            <p>
              We believe that quality is non-negotiable. Every print is managed locally using premium components:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-900/60 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">Heavy-Duty Paper</h4>
                  <p className="text-xs text-neutral-450">We print exclusively on selected heavy-gsm matte or high-gloss art papers for maximum ink absorption and durability.</p>
                </div>
              </div>

              <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-900/60 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">Museum-Grade Framing</h4>
                  <p className="text-xs text-neutral-450">Select from lightweight and sturdy fiber wood borders fitted with clear acrylic layers to protect your poster art from damage.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Customer Focus */}
          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
              The Customer Experience
            </h2>
            <p>
              From browsing to unboxing, the platform is designed to provide an immersive experience. 
              We use secure payment processing via **Razorpay**, delivery tracking updates via **Shiprocket**, and 
              safe dispatch logistics to guarantee that your artwork arrives in perfect condition.
            </p>
          </section>

          {/* Call to Actions (CTA) */}
          <div className="border-t border-neutral-900/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="w-4 h-4 text-[#C1121F]" />
                Ready to Upgrade Your Space?
              </h3>
              <p className="text-xs text-neutral-500">Explore the collections or upload your custom design.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/custom-poster"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] text-white px-6 py-3.5 rounded-xl font-black tracking-wider uppercase text-[10px] transition-all duration-300 hover:scale-105 active:scale-98 fiery-button-glow cursor-pointer"
              >
                Custom Poster Studio
              </Link>
              <Link
                href="/#catalog"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white px-6 py-3.5 rounded-xl font-black tracking-wider uppercase text-[10px] transition-all duration-300 hover:scale-105 active:scale-98"
              >
                Browse Catalog
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
