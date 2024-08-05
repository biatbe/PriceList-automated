import prisma from "@/lib/prisma";
import { CarPrice } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request, {params}: {params: {id: string}}) {
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