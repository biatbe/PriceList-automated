
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// url, email and password are stored in the .env file
// hidden on purpose
const url = process.env.URL!;
const email = process.env.EMAIL!;
const password = process.env.PASSWORD!;

const countryMapping = new Map([['be', 'b'], ['de', 'd'], ['fr', 'f'], ['cz', 'cz'], ['nl', 'nl'], ['hu', 'h'], ['it', 'i'], ['pl', 'pl'], ['pt', 'p'], ['ro', 'ro']]);
const countryPrice = new Map();

const typeMappings = new Map([['hatchback', 'hatchback'], ['sw', 'wagon'], ['suv','sport utility vehicle'], ['coupe', 'coupe'], ['cabriolet', 'convertible'], ['sedan', 'sedan']]);

export async function POST(req: Request) {
    const {country, brand, model, type, doors, combustion, transmission, drive, power, motor, eqLevel, countries } :
        {country: string; brand: string; model: string; type: string; doors: number; combustion: string;
             transmission: string; drive: string; power: number; motor: string; eqLevel: string, countries: string[]}
     = await req.json();

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

        // Perform the login
        await page.type('#email', email);
        await page.type('#password', password);
        await page.click('.btn-primary');
        if (countryMapping.has(country.toLowerCase()) === false) {
            await browser.close();
            return NextResponse.json(JSON.stringify(Object.fromEntries(new Map([[country, 0]]))));
        }

        // We choose the country we want to search in
        const countryCode = countryMapping.get(country.toLowerCase())!;
        await page.locator('select').fill(countryCode);
        await page.waitForSelector('h2');

        // Selects the car brand
        // We know that all car brands are in an h2 DOM element and capitalized so we need to loop through them
        await page.evaluate((brand) => {
            const h2Elements = Array.from(document.querySelectorAll('h2'));
            const h2Element = h2Elements.find(h2 => h2.textContent?.toLowerCase().includes(brand.toLowerCase()));
            if (h2Element) {
                (h2Element as HTMLElement).click();
            }
        }, brand);

        await page.waitForSelector('h2');

        // Selects the car model
        // Same as previously
        await page.evaluate((model) => {
            const h2Elements = Array.from(document.querySelectorAll('h2'));
            const h2Element = h2Elements.find(h2 => h2.textContent?.toLowerCase().includes(model.toLowerCase()));
            if (h2Element) {
                (h2Element as HTMLElement).click();
            }
        }, model);

        const driveN = drive.toLowerCase() == 'awd' ? '4' : '2';
        let fuel;
        if (combustion.toLowerCase() === 'petrol') {
            fuel = 'U-P-F';
        } else if (combustion.toLowerCase() === 'diesel') {
            fuel = 'D';
        } else {
            fuel = 'E';
        }

        await page.waitForSelector('#tranmissionSelect');

        await page.click(`#tranmissionSelect input[value="${transmission.toUpperCase()}"]`);
        await page.waitForSelector('#tranmissionSelect');
        await page.click(`#tranmissionSelect input[value="${driveN}"]`);
        await page.waitForSelector('#tranmissionSelect');
        await page.click(`#tranmissionSelect input[value="${fuel}"]`);

        await page.waitForSelector('div.thumbWrapper');

        // Convert the typemapping Map to a plain object
        // Important as page.evaluate can only use this or array
        const typeMappingObj = Object.fromEntries(typeMappings);

        // Selects the exact car we are looking for
        await page.evaluate((motor, eqLevel, power, type, doors, typeMapping) => {
            const types_spans = Array.from(document.querySelectorAll('div.thumbWrapper span'));
            const cars = Array.from(document.querySelectorAll('div.vehicleSelect'));
            let index = -1;
            index = types_spans.findIndex(type_text => type_text.textContent?.includes(typeMapping[type])
                && type_text.textContent?.includes(doors.toString()));
            console.log(index);
            if (index == -1) {
                console.log('No car found matching the criteria'); 
                return NextResponse.json(JSON.stringify(Object.fromEntries(new Map([[country.toLowerCase(), 0]]))));
            }
            const car_options_arr = Array.from(cars[index].querySelectorAll('.voertuig'));
            
            car_options_arr.forEach(car_option => {
                const input = car_option.querySelector('#vehicleID');
                const typeSpan = car_option.querySelector('span.type');
                const typeDetailsSpan = car_option.querySelector('span.typeDetails');
                const motorDetails = motor.split(' ');
                let found = false;

                if (input && typeSpan && typeDetailsSpan) {
                    const motorDetailsIncluded = motorDetails.every(detail => typeDetailsSpan!.textContent?.includes(detail.toUpperCase()));
                    if (eqLevel == '') {
                        if (typeSpan!.textContent?.includes(String(power)) && !found
                        && motorDetailsIncluded) {
                            console.log("found no eq");
                            found = true;
                            (input! as HTMLElement).click();
                        }
                    } else if (typeSpan!.textContent?.includes(String(power)) && !found
                        && motorDetailsIncluded
                        && typeDetailsSpan!.textContent?.includes(eqLevel.toUpperCase())) {
                            console.log("found eq");
                            found = true;
                            (input! as HTMLElement).click();
                    }
                }
            })
        }, motor, eqLevel, power, type, doors, typeMappingObj);

        await page.waitForSelector('#chosen');

        const price = await page.evaluate(() => {
            const div = document.querySelector('#chosen div.row.specs');
            if (div) {
                const spans = div!.querySelectorAll('span.row.odd');
                if (spans!.length > 10) {
                    const price = spans![11].querySelector('b');
                    if (price) {
                        const priceText = price.textContent;
                        return priceText ? parseInt(priceText.replaceAll('.', '')) : null;
                    }
                }
            }
            return null
        });


        if (price !== null) {
            console.log("Price found!", price);
            countryPrice.set(country.toLowerCase(), price);
        } else {
            console.log("Price not found or the element structure is incorrect.");
            countryPrice.set(country, 0);
        }

        // Convert the countryMapping Map to a plain object
        // Important as page.evaluate can only use this or array
        const countryMappingObj = Object.fromEntries(countryMapping);

        for (const localCountry of countries) {
            // Wait for the main column to load
            await page.waitForSelector('#maincolumn');

            // Select the checkbox for the current country
            await page.evaluate((localCountry, countryMapping) => {
                const countryKey = countryMapping[localCountry.toLowerCase()].toUpperCase();
                const checkBox = document.querySelector(`input[value="${countryKey}"]`);
                if (checkBox) {
                    (checkBox as HTMLElement).click();
                }
            }, localCountry, countryMappingObj);

            await page.waitForSelector('div.column.vehicle');
    
            // Evaluate the checkboxes and prices within the browser context
            const price : number = await page.evaluate(async (localCountry: string, countryMapping: {[key: string]: string}, eqLevel: string) => {
                const countryKey = countryMapping[localCountry.toLowerCase()].toUpperCase();
                const checkBox = document.querySelector(`input[value="${countryKey}"]`);
    
                if (checkBox) {
                    const divs = document.querySelectorAll('div.column.vehicle');
                    for (const div of divs) {
                        if (div.hasAttribute('id') && div.getAttribute('id')!.includes('chosen')) {
                            continue;
                        }
                        const specs = div.querySelector('div.row.specs');
                        const spans = specs!.querySelectorAll('span.row.odd');
                        const localEqLevel = spans[1];
    
                        if (localEqLevel.textContent!.toLowerCase().includes(eqLevel.toLowerCase())) {
                            const priceElement = spans[11].querySelector('b');
                            if (priceElement) {
                                const priceText = priceElement.textContent;
                                return priceText ? parseInt(priceText.replaceAll('.', '')) : 0;
                            }
                        }
                    }
                    return 0;
                }
                return 0;
            }, localCountry, countryMappingObj, eqLevel);

            countryPrice.set(localCountry.toLowerCase(), price);

            // Deselect the checkbox for the current country
            await page.evaluate((localCountry, countryMapping) => {
                const countryKey = countryMapping[localCountry.toLowerCase()].toUpperCase();
                const checkBox = document.querySelector(`input[value="${countryKey}"]`);
                if (checkBox) {
                    (checkBox as HTMLElement).click();
                }
            }, localCountry, countryMappingObj);

            // Wait a bit before processing the next country
            await new Promise(r => setTimeout(r, 2000));
        };
        console.log(countryPrice);
        await browser.close();
        return NextResponse.json(JSON.stringify(Object.fromEntries(countryPrice)));

    } catch (error) {   
        console.error(`Error while searching for car in ${country}:`, error);
        return NextResponse.json(JSON.stringify(Object.fromEntries(new Map([[country.toLowerCase(), 0]]))));
    }

}