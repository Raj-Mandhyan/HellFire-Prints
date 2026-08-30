import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
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
        
        <LoginForm />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
