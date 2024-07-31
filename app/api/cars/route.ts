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
         eqLevel, country, discount, calculated_buying_price, margin,
          sales_price, target_market_price } = await request.json();

    try {

        const countries = await prisma.country.findMany();

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
                calculated_buying_price: calculated_buying_price ?? 0,
                margin: margin ?? 0,
                sales_price: sales_price ?? 0,
                target_country: country,
                discount: discount,
                target_market_price: target_market_price ?? 0,
                prices: {
                    create: countries.map((country) => ({
                        countryId: country.id,
                        price: country.currency !== 'Euro' ? 0 : null, // replace `someCalculatedPrice` with your price calculation logic
                        //price_in_EUR: calculated_buying_price ?? 0, // assuming price_in_EUR is equivalent to calculated_buying_price for simplicity
                        //discount_on_NCP: discount ?? 0,
                        //needed_discount_percentage: 0, // set appropriate value
                        //available_discount_percentage: 0, // set appropriate value
                        //additional_discount_needed: 0 // set appropriate value
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