import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const labels = await db.label.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json(labels, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name, color }: { name: string; color?: string } = await req.json();

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    if (!session.user.id) {
      return new NextResponse('User ID is missing', { status: 400 });
    }

    const label = await db.label.create({
      data: {
        userId: session.user.id,
        name,
        color: color || undefined,
      },
    });

    return NextResponse.json(label, { status: 200 });
  } catch (error) {
    return new NextResponse('Error creating label', { status: 500 });
  }
}
