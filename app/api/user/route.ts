import {auth} from '@/auth';
import {NextResponse} from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    console.error('User is not authenticated');
    return NextResponse.json({error: 'Invalid user', status: 401});
  }

  try {
    const users = await prisma.user.findMany();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to get users:', error);
    return new NextResponse('Internal Server Error', {status: 500});
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    console.error('User is not authenticated');
    return NextResponse.json({error: 'Invalid user', status: 401});
  }

  try {
    const user = await prisma.user.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        name: session!.user!.name!,
        email: session!.user!.email!,
      },
      create: {
        userId: session.user.id,
        name: session!.user!.name!,
        email: session!.user!.email!,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to get or create user:', error);
    return new NextResponse('Internal Server Error', {status: 500});
  }
}