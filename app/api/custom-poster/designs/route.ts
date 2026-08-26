import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Retrieve all saved designs for the authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to view your designs.' }, { status: 401 });
    }

    const designs = await prisma.customPosterDesign.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, designs });
  } catch (error) {
    console.error('Error fetching saved designs:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST: Save or update a custom poster design
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to save your designs.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, configuration, previewImage } = body;

    if (!name || !configuration || !previewImage) {
      return NextResponse.json({ error: 'Missing required parameters: name, configuration, and previewImage are required.' }, { status: 400 });
    }

    if (id) {
      // Update existing design
      const existingDesign = await prisma.customPosterDesign.findFirst({
        where: { id, userId: user.id },
      });

      if (!existingDesign) {
        return NextResponse.json({ error: 'Design not found or unauthorized.' }, { status: 404 });
      }

      const updated = await prisma.customPosterDesign.update({
        where: { id },
        data: {
          name,
          configuration,
          previewImage,
        },
      });

      return NextResponse.json({ success: true, design: updated });
    } else {
      // Create new design
      const created = await prisma.customPosterDesign.create({
        data: {
          userId: user.id,
          name,
          configuration,
          previewImage,
        },
      });

      return NextResponse.json({ success: true, design: created });
    }
  } catch (error) {
    console.error('Error saving design:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE: Delete a saved custom poster design
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to delete designs.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Design ID is required.' }, { status: 400 });
    }

    const existingDesign = await prisma.customPosterDesign.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingDesign) {
      return NextResponse.json({ error: 'Design not found or unauthorized.' }, { status: 404 });
    }

    await prisma.customPosterDesign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting design:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
