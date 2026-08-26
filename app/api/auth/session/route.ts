import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error('Error fetching session endpoint:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
