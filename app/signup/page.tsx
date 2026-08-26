import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SignupForm from '@/components/SignupForm';
import { Flame } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SignupPage() {
  const user = await getCurrentUser();

  // Redirect to account dashboard if already logged in
  if (user) {
    redirect('/account');
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans selection:bg-[#C1121F] selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-6 relative">
        {/* Cinematic ambient background glow */}
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-[#C1121F]/8 blur-[120px] pointer-events-none -z-10"></div>
        
        <SignupForm />
      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-12 text-center text-xs text-neutral-500 space-y-4">
        <div className="flex justify-center items-center gap-2">
          <Flame className="w-4 h-4 text-[#C1121F]" />
          <span className="font-extrabold tracking-widest text-white text-[10px]">
            HELLFIRE PRINTS
          </span>
        </div>
        <p>© 2026 Hellfire Prints. All rights reserved. Premium Cinematic Poster Art.</p>
      </footer>
    </div>
  );
}
