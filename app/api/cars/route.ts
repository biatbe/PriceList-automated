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
        const cars = await prisma.car.findMany({
            include: {
                prices: true
            }
        });

        return Response.json(cars);
    } catch(error) {
        console.error('Failed to get cars: ', error);
        return new NextResponse('Internal server error', {status: 500});
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        console.error('User is not authenticated');
        return NextResponse.json({error: 'Invalid user', status: 401});
    }

    const {brand, model, type, doors, power, motor, combustion, transmission, drive,
         eqLevel, country, discount, targetPrice, countryPrices } = await request.json();

    try {

        const countries = await prisma.country.findMany();

        const car = await prisma.car.create({
            data: {
                brand: brand.toUpperCase(),
                model: model.toUpperCase(),
                type: type.toUpperCase(),
                doors: doors,
                kw: power,
                motor: motor.toUpperCase(),
                combustion: combustion.toUpperCase(),
                transmission: transmission.toUpperCase(),
                drive: drive.toUpperCase(),
                eqLevel: eqLevel.toUpperCase(),
                target_country: country.toUpperCase(),
                discount: discount,
                target_market_price: targetPrice,
                prices: {
                    create: countries.map((country) => {
                        const countryAbbreviation = country.abbreviation.toLowerCase();
                        const price = countryPrices[countryAbbreviation] || 0;

                        return {
                            countryId: country.id,
                            price: country.currency !== 'Euro' ? price : null, 
                            available_discount_percentage: 0,
                        }
                    })
                }
            }
        });

        return Response.json(car);
    } catch(error) {
        console.error('Failed to get cars: ', error);
        return new NextResponse('Internal server error', {status: 500});
    }
}