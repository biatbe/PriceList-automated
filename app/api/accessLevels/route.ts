import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {

    const session = await auth();
    if (!session?.user?.id) {
        console.error('User is not authenticated');
        return NextResponse.json({error: 'Invalid user', status: 401});
    }

    try {
        const accessLevel = await prisma.user.findUnique({
            where: {
                userId: session.user.id,
            }, select: {
                accessLevel: true
            }
        })

        return NextResponse.json(accessLevel);
    } catch(error) {
        console.error('Failed to get accessLevel: ', error);
        return NextResponse.json({error: 'Internal server error', status: 500});
    }
}