'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { mergeCarts } from '@/lib/cart';
import { redirect } from 'next/navigation';

/**
 * Handle user registration / signup
 */
export async function signupAction(prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Basic Validation
  if (!name || !email || !password || !confirmPassword) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { error: 'Please enter a valid email address.' };
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { error: 'An account with this email already exists.' };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in Neon DB
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
      },
    });

    // Establish authenticated session automatically after registration
    const token = signToken({ userId: user.id, email: user.email || '' });
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // If guest cart exists, merge it
    const sessionToken = cookieStore.get('cart_session_token')?.value;
    if (sessionToken) {
      await mergeCarts(sessionToken, user.id);
      cookieStore.delete('cart_session_token');
    }

  } catch (error) {
    console.error('Signup action error:', error);
    return { error: 'Failed to create account. Please try again later.' };
  }

  redirect('/account');
}

/**
 * Handle user login
 */
export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      return { error: 'Invalid email or password.' };
    }

    // Check password hash match
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { error: 'Invalid email or password.' };
    }

    // Sign session token
    const token = signToken({ userId: user.id, email: user.email || '' });
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Merge guest cart if items exist
    const sessionToken = cookieStore.get('cart_session_token')?.value;
    if (sessionToken) {
      await mergeCarts(sessionToken, user.id);
      cookieStore.delete('cart_session_token');
    }

  } catch (error) {
    console.error('Login action error:', error);
    return { error: 'Login failed. Please try again later.' };
  }

  redirect('/account');
}

/**
 * Handle user logout
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/');
}
