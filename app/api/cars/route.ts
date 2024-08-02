import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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

    const {brand, model, type, doors, power, motor, combustion, transmission, drive,
         eqLevel, country, discount, targetPrice, countryPrices } = await request.json();

    const countryMapping = new Map([['be', 'b'], ['de', 'd'], ['fr', 'f'], ['cz', 'cz'], ['nl', 'nl'], ['hu', 'h'], ['it', 'i'], ['pl', 'pl'], ['pt', 'p'], ['ro', 'ro']]);

    try {

        const countries = await prisma.country.findMany();
        console.log( countries);
        console.log( countryPrices);

        const car = await prisma.car.create({
            data: {
                brand: brand,
                model: model,
                type: type,
                doors: doors,
                kw: power,
                motor: motor,
                combustion: combustion,
                transmission: transmission,
                drive: drive,
                eqLevel: eqLevel,
                target_country: country,
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