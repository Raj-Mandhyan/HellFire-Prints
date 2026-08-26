import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { logoutAction } from '@/app/actions/auth';
import { Flame, LogOut, Package, MapPin, User, Mail, Phone, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentUser();

  // Protect the route - redirect to login if unauthenticated
  if (!user) {
    redirect('/login');
  }

  // Fetch past orders from database
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch saved shipping addresses
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const avatarChar = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans selection:bg-[#C1121F] selection:text-white overflow-x-hidden">
      {/* Global Navbar */}
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Banner Title */}
        <div className="border-b border-neutral-900 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              HELLFIRE <span className="text-[#C1121F]">ACCOUNT</span>
            </h1>
            <p className="text-neutral-400 mt-1.5 text-xs">
              Manage your personal credentials, order receipts, and delivery presets.
            </p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-[#161616] hover:bg-red-950/20 border border-neutral-850 hover:border-red-900/60 text-neutral-400 hover:text-red-400 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: User Summary Details */}
          <ScrollReveal fiery={false} className="lg:col-span-4 w-full h-full">
            <div className="bg-[#161616] border border-neutral-900 p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#C1121F]/5 blur-2xl pointer-events-none"></div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#C1121F] text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-red-950/40">
                  {avatarChar}
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    {user.name}
                  </h3>
                  <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#C1121F]/10 border border-[#C1121F]/20 text-[#FF4D4D]">
                    {user.role} Account
                  </span>
                </div>
              </div>

              <div className="space-y-4 border-t border-neutral-900 pt-6 text-xs text-neutral-400 font-medium">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-[#C1121F] flex-shrink-0" />
                  <span className="truncate">{user.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#C1121F] flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              <div className="bg-neutral-950/40 border border-neutral-900 p-4 rounded-2xl text-[10px] text-neutral-500 uppercase tracking-wider space-y-1">
                <p>Joined: {new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                <p>Last Sync: {new Date(user.updatedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</p>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Column: Order History & Presets */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. My Orders Section */}
            <ScrollReveal fiery={false}>
              <div className="bg-[#161616] border border-neutral-900 p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-2.5 border-b border-neutral-900 pb-3">
                  <Package className="w-5 h-5 text-[#C1121F]" />
                  <h3 className="text-sm text-neutral-200 font-extrabold uppercase tracking-widest">
                    Purchase Order History
                  </h3>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((ord) => {
                      const totalQty = ord.items.reduce((sum, item) => sum + item.quantity, 0);
                      return (
                        <div
                          key={ord.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#0A0A0A]/40 border border-neutral-850 rounded-2xl gap-4 hover:border-neutral-700 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-sm text-white uppercase font-mono">{ord.orderNumber}</span>
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                ord.orderStatus === 'CONFIRMED'
                                  ? 'bg-emerald-950/40 border border-emerald-900 text-emerald-400'
                                  : 'bg-amber-950/40 border border-amber-900 text-amber-400'
                              }`}>
                                {ord.orderStatus}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-500 flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#C1121F]" />
                                {new Date(ord.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                              </span>
                              <span>{totalQty} Prints Ordered</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-neutral-900 pt-3 sm:pt-0 shrink-0">
                            <span className="font-black text-white text-base font-mono">₹{ord.total.toFixed(0)}</span>
                            <Link
                              href={`/account/orders/${ord.id}`}
                              className="bg-[#C1121F] hover:bg-[#A00F19] text-white px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                            >
                              Receipt
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-3">
                    <p className="text-xs text-neutral-500">
                      No orders placed yet. Fuel your walls with your first print configurations.
                    </p>
                    <Link
                      href="/"
                      className="inline-flex bg-[#C1121F] hover:bg-[#A00F19] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-950/20"
                    >
                      Browse Storefront
                    </Link>
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* 2. Saved Addresses Section */}
            <ScrollReveal fiery={false}>
              <div className="bg-[#161616] border border-neutral-900 p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-2.5 border-b border-neutral-900 pb-3">
                  <MapPin className="w-5 h-5 text-[#C1121F]" />
                  <h3 className="text-sm text-neutral-200 font-extrabold uppercase tracking-widest">
                    Delivery Addresses
                  </h3>
                </div>

                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-5 rounded-2xl border border-neutral-850 bg-[#0A0A0A]/40 text-neutral-400 flex flex-col justify-between min-h-[120px] space-y-3"
                      >
                        <div className="space-y-1">
                          <span className="font-extrabold text-sm uppercase text-white block">{addr.name}</span>
                          <p className="text-[10px] leading-relaxed line-clamp-2">{addr.street}</p>
                          <p className="text-[10px]">{addr.city}, {addr.state} - {addr.postalCode}</p>
                        </div>
                        <div className="text-[10px] font-mono tracking-wider pt-2 border-t border-neutral-900 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#C1121F]" />
                          {addr.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-xs text-neutral-500">
                      No delivery presets configured yet. Saved locations will sync here during checkout.
                    </p>
                  </div>
                )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  </main>

      {/* Footer */}
      <ScrollReveal fiery={false}>
        <footer className="bg-neutral-950 border-t border-neutral-900 py-12 text-center text-xs text-neutral-500 space-y-4">
          <div className="flex justify-center items-center gap-2">
            <Flame className="w-4 h-4 text-[#C1121F]" />
            <span className="font-extrabold tracking-widest text-white text-[10px]">
              HELLFIRE PRINTS
            </span>
          </div>
          <p>© 2026 Hellfire Prints. All rights reserved. Premium Cinematic Poster Art.</p>
        </footer>
      </ScrollReveal>
    </div>
  );
}
