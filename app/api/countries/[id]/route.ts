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

        return Response.json(country);
    } catch(error) {
        console.error('Failed to get countries: ', error);
        return new NextResponse('Internal server error', {status: 500});
    }
}

export async function PUT(request: Request, {params}: {params: {id: string}}) {

    const session = await auth();
    if (!session?.user?.id) {
        console.error('User is not authenticated');
        return NextResponse.json({error: 'Invalid user', status: 401});
    }

    try {
        const {discount, notes} : {discount: string, notes: string} = await request.json();

        const updatedCountry = await prisma.carPrice.update({
            where: {
                id: parseInt(params.id)
            },
            data: {
                available_discount_percentage: parseFloat(discount),
                additional_notes: notes
            }
        });

        return Response.json(updatedCountry);
    } catch(error) {
        console.error('Failed to get countries: ', error);
        return new NextResponse('Internal server error', {status: 500});
    }
}
