import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Flame, ShieldAlert, ArrowLeft } from 'lucide-react';
import AdminSidebarNav, { AdminMobileNav } from '@/components/AdminSidebarNav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Render Access Denied if not an admin (using clean pre-Diwali header, no Diwali Navbar)
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#080304] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C1121F] selection:text-white relative z-10">
        <header className="sticky top-0 z-40 w-full border-b border-neutral-900/80 bg-neutral-950/90 backdrop-blur-md shadow-lg shadow-black/45">
          <div className="px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-[#C1121F] p-1.5 rounded-xl group-hover:scale-105 transition-transform duration-300">
                <Flame className="w-5 h-5 text-white animate-pulse" />
              </div>
              <span className="font-extrabold tracking-widest text-lg text-white">
                HELLFIRE <span className="text-[#C1121F] font-black">ADMIN</span>
              </span>
            </Link>
            <Link
              href="/"
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl transition-all font-bold uppercase tracking-widest text-[10px]"
            >
              Return to Storefront
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center py-16 px-6 relative z-10">
          <div className="text-center py-20 px-8 bg-[#0F0F0F] border border-neutral-900 rounded-3xl max-w-lg w-full space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#C1121F]/5 blur-2xl pointer-events-none"></div>
            <ShieldAlert className="w-16 h-16 text-[#C1121F] mx-auto animate-pulse-fire" />
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-widest text-white">ACCESS DENIED</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-bold">
                Your account (<span className="text-neutral-200 font-mono">{user.email}</span>) does not possess Administrator clearance. This incident has been logged.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#C1121F] hover:bg-[#A00F19] text-white px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-950/30"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Storefront
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C1121F] selection:text-white relative z-10">
      {/* Original Pre-Diwali Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-900/80 bg-neutral-950/90 backdrop-blur-md shadow-lg shadow-black/45">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="bg-[#C1121F] p-1.5 rounded-xl group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(193,18,31,0.5)] transition-transform duration-300">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="font-extrabold tracking-widest text-lg text-white">
              HELLFIRE <span className="text-[#C1121F] font-black">ADMIN</span>
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-extrabold uppercase tracking-wider">
            <div className="hidden sm:block text-right">
              <p className="font-bold text-white uppercase">{user.name}</p>
              <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-normal">{user.email}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C1121F] to-[#FF4D4D] text-white flex items-center justify-center font-black uppercase shadow border border-red-950/40">
              {user.name ? user.name.charAt(0) : 'A'}
            </div>
            <Link
              href="/"
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl transition-all font-bold uppercase tracking-widest text-[10px] active:scale-95"
            >
              Exit Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar & Drawer (Visible < md) */}
      <AdminMobileNav />

      <div className="flex flex-1 relative z-10">
        {/* Desktop Sidebar Navigation (Visible >= md) */}
        <AdminSidebarNav />

        {/* Main Content Area */}
        <main className="flex-1 bg-transparent p-6 md:p-8 overflow-x-hidden relative z-10">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          <div className="max-w-7xl mx-auto space-y-8 relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
