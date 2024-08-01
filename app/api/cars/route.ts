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

    const {brand, model, power, motor, combustion, transmission, drive,
         eqLevel, country, discount, buyingPrice, margin,
          salesPrice, targetPrice, countryPrices } = await request.json();

    const countryMapping = new Map([['be', 'b'], ['de', 'd'], ['fr', 'f'], ['cz', 'cz'], ['nl', 'nl'], ['hu', 'h'], ['it', 'i'], ['pl', 'pl'], ['pt', 'p'], ['ro', 'ro']]);

    try {

        const countries = await prisma.country.findMany();
        console.log( countries);
        console.log( countryPrices);

        const car = await prisma.car.create({
            data: {
                brand: brand,
                model: model,
                kw: power,
                motor: motor,
                combustion: combustion,
                transmission: transmission,
                drive: drive,
                eqLevel: eqLevel,
                calculated_buying_price: buyingPrice,
                margin: margin,
                sales_price: salesPrice,
                target_country: country,
                discount: discount,
                target_market_price: targetPrice,
                prices: {
                    create: countries.map((country) => ({
                        countryId: country.id,
                        price: country.currency !== 'Euro' ? countryPrices[country.abbreviation.toLowerCase()] : null, // replace `someCalculatedPrice` with your price calculation logic
                        price_in_EUR: country.currency == 'Euro' ? countryPrices[country.abbreviation.toLowerCase()] : countryPrices[country.abbreviation.toLowerCase()] / 20, // assuming price_in_EUR is equivalent to calculated_buying_price for simplicity
                        discount_on_NCP: 1 - (countryPrices[country.abbreviation.toLowerCase()] / targetPrice),
                        needed_discount_percentage: -(buyingPrice - countryPrices[country.abbreviation.toLowerCase()])/countryPrices[country.abbreviation.toLowerCase()],
                        available_discount_percentage: 0,
                        additional_discount_needed: (-(buyingPrice - countryPrices[country.abbreviation.toLowerCase()])/countryPrices[country.abbreviation.toLowerCase()] - 0)*countryPrices[country.abbreviation.toLowerCase()]
                    }))
                }
            }
        });

        return Response.json(car);
    } catch(error) {
        console.error('Failed to get cars: ', error);
        return new NextResponse('Internal server error', {status: 500});
    }
}