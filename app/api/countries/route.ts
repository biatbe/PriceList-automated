import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const countries = await prisma.country.findMany();

        return Response.json(countries);
    } catch(error) {
        console.error('Failed to get countries: ', error);
        return new NextResponse('Internal server error', {status: 500});
    }
}
