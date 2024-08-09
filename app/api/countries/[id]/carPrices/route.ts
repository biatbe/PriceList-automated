import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { CarPrice } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request, {params}: {params: {id: string}}) {
    const session = await auth();
    if (!session?.user?.id) {
        console.error('User is not authenticated');
        return NextResponse.json({error: 'Invalid user', status: 401});
    }
    
    try {

        const country = await prisma.country.findUnique({
            where: {
                abbreviation: params.id.toUpperCase()
            }
        });

        const carPrices : CarPrice[] = await prisma.carPrice.findMany({
            where: {
                countryId: country?.id
            }
        });

        return Response.json(carPrices);
    } catch(error) {
        console.error('Failed to get countries: ', error);
        return new NextResponse('Internal server error', {status: 500});
    }
}