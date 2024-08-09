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
        const countries = await prisma.country.findMany();

        return Response.json(countries);
    } catch(error) {
        console.error('Failed to get countries: ', error);
        return new NextResponse('Internal server error', {status: 500});
    }
}
