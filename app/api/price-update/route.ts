
import { Car, CarPrice, Country } from '@prisma/client';
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import prisma from '@/lib/prisma';
import fs from 'fs';

// url, email and password are stored in the .env file
// hidden on purpose
const date = new Date()
const dateFormated = date.toISOString().split('T')[0]
// For debugging
const url = process.env.URL_UPDATE! + `zdatum=2024-08-08`;
//const url = process.env.URL_UPDATE! + `zdatum=${dateFormated}`;

const countryMapping = new Map([['be', 'b'], ['de', 'd'], ['fr', 'f'], ['cz', 'cz'], ['nl', 'nl'], ['hu', 'h'], ['it', 'i'], ['pl', 'pl'], ['pt', 'p'], ['ro', 'ro']]);
const typeMappings = new Map([['HA', 'HATCHBACK'], ['ES', 'SW'], ['OD', 'SUV'], ['CA', 'CABRIOLET'], ['SA', 'SEDAN'], ['FW', 'VAN']]);
const fuelMappings = new Map([['U', 'PETROL'], ['P', 'PETROL'], ['D','DIESEL'], ['E', 'ELECTRIC']]);

export async function PUT(req: Request) {
    try {
        // Launch puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
            ]
        });
        const page = await browser.newPage();

        // Navigate to the login page
        await page.goto(url);
        await page.waitForSelector('table');
        const table = await page.evaluate(() => {
            const tables = document.querySelectorAll('table');
            return tables[2].outerHTML; // or fieldset.textContent, etc.
        });
        if (!table) {
            console.log('No updates for this date!');
            return new NextResponse('No updates for this date!');
        }
        let rows = await page.evaluate(tableHTML => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = tableHTML;
            const tableElement = tempDiv.querySelector('table');
            return Array.from(tableElement!.rows).map(row => {
                return Array.from(row.cells).map(cell => cell.textContent); // Extracting text content from each cell
            });
        }, table);
        rows.shift();
        for (const row of rows) {
            const rowCountry = row[1];
            const rowBrand = row[2];
            const rowModel = row[3];
            const rowEqLevel = row[5];
            const eqLevelSplit = rowEqLevel?.split(' ');
            const rowType = row[7]?.trim();
            const rowFuel = row[9]?.trim();
            const rowPower = row[11];
            const rowTransmission = row[13]?.trim();
            const rowOldPrice = row[23];
            const rowNewPrice = row[21];

            const cars : Car[] = await prisma.car.findMany({
                where: {
                    brand: rowBrand?.toUpperCase(),
                    model: rowModel?.toUpperCase(),
                    type: typeMappings.get(rowType!.toUpperCase()),
                    kw: parseInt(rowPower!),
                    motor: {
                        contains: rowEqLevel?.split(' ')[0]
                    },
                    combustion: fuelMappings.get(rowFuel!),
                    transmission: rowTransmission?.toUpperCase(),
                }, include: {
                    prices: true
                }
            });

            const possibleUpdates = cars.filter((car: Car) => eqLevelSplit?.includes(car.eqLevel));

            const countries = await prisma.country.findMany();

            if (possibleUpdates.length == 1) {
                //If the country is the target country, update the target price
                if (countryMapping.get(possibleUpdates[0].target_country.toLowerCase()) == rowCountry?.toLowerCase()
                && Math.abs(possibleUpdates[0].target_market_price - parseInt(rowOldPrice!)) < 10) {
                    await prisma.car.update({
                        where: {
                            id: possibleUpdates[0].id
                        }, 
                        data: {
                            target_market_price: parseInt(rowNewPrice!)
                        }
                    })
                    fs.writeFile(
                        'logs/price-updates/log.txt', 
                        `${rowCountry};${rowBrand};${rowModel};${rowEqLevel};${typeMappings.get(rowType!.toUpperCase())};${fuelMappings.get(rowFuel!)};${rowPower};${rowTransmission};${rowOldPrice};${rowNewPrice};\n`,
                        function (err) {
                            if (err) {
                                return console.error(err);
                            }
                        }    
                    );
                } else {
                    // Look for the country among sales countries
                    const countryId = countries.find((country: Country) => countryMapping.get(country.abbreviation.toLowerCase()) == rowCountry?.toLowerCase())?.id;
                    const carPrice : CarPrice = possibleUpdates[0].prices.find((salesCountry: CarPrice) => countryId == salesCountry.countryId);
                    await prisma.carPrice.update({
                        where: {
                            id: carPrice.id
                        }, 
                        data: {
                            price: parseInt(rowNewPrice!)
                        }
                    })
                    fs.writeFile(
                        'logs/price-updates/log.txt', 
                        `${rowCountry};${rowBrand};${rowModel};${rowEqLevel};${typeMappings.get(rowType!.toUpperCase())};${fuelMappings.get(rowFuel!)};${rowPower};${rowTransmission};${rowOldPrice};${rowNewPrice};\n`,
                        function (err) {
                            if (err) {
                                return console.error(err);
                            }
                        }    
                    );
                }
            }

        }

        return new NextResponse();

    } catch (error) {   
        console.error(`Error while searching for price update:`, error);
        return new NextResponse(JSON.stringify(error));
    }

}