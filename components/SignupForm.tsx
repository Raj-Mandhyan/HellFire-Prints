'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { signupAction } from '@/app/actions/auth';
import { Flame, User, Mail, Lock } from 'lucide-react';

const initialState = {
  error: null as string | null,
};

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, initialState);

  return (
    <div className="max-w-md w-full bg-[#161616] p-8 sm:p-10 rounded-3xl border border-neutral-900 shadow-2xl space-y-8 relative overflow-hidden">
      {/* Top colored accent line */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#C1121F] to-transparent"></div>

      {/* Title Area */}
      <div className="text-center space-y-2">
        <div className="inline-flex bg-[#C1121F]/10 p-2.5 rounded-2xl border border-[#C1121F]/20 text-[#FF4D4D] mb-2">
          <Flame className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">
          Create an <span className="text-[#C1121F]">Account</span>
        </h1>
        <p className="text-xs text-neutral-500">
          Join Hellfire Prints to track purchases and sync your prints collection.
        </p>
      </div>

      {/* Form */}
      <form action={formAction} className="space-y-5">
        {/* Display Errors */}
        {state?.error && (
          <div className="p-4 bg-red-950/40 border border-red-900 text-red-300 text-xs rounded-xl font-medium">
            {state.error}
          </div>
        )}

        {/* Name Input */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              id="name"
              name="name"
              placeholder="John Doe"
              required
              disabled={isPending}
              className="w-full bg-[#0A0A0A] border border-neutral-850 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        {/* Email Input */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              required
              disabled={isPending}
              className="w-full bg-[#0A0A0A] border border-neutral-850 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              disabled={isPending}
              className="w-full bg-[#0A0A0A] border border-neutral-850 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        {/* Confirm Password Input */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              required
              disabled={isPending}
              className="w-full bg-[#0A0A0A] border border-neutral-850 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center bg-[#C1121F] hover:bg-[#A00F19] disabled:bg-neutral-900 border border-transparent disabled:border-neutral-850 disabled:text-neutral-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/20 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? 'CREATING ACCOUNT...' : 'SIGN UP'}
        </button>
      </form>

      {/* Bottom redirection Link */}
      <div className="text-center text-xs text-neutral-500 pt-4 border-t border-neutral-900">
        Already have an account?{' '}
        <Link href="/login" className="text-[#FF4D4D] font-bold hover:underline">
          Log In
        </Link>
      </div>
    </div>
  );
}
