import PriceList from '@/app/main-list/page';
import puppeteer, { BrowserEvent } from 'puppeteer';

// url, email and password are stored in the .env file
// hidden on purpose
const url = process.env.URL!;
const email = process.env.EMAIL!;
const password = process.env.PASSWORD!;

const countryMapping = new Map([['be', 'b'], ['de', 'd'], ['fr', 'f'], ['cz', 'cz'], ['nl', 'nl'], ['hu', 'h'], ['it', 'i'], ['pl', 'pl'], ['pt', 'p'], ['ro', 'ro']]);
const countryPrice = new Map();

export async function POST(req: Request) {
    const {country, brand, model, combustion, transmission, drive, power, motor, eqLevel, countries } :
        {country: string; brand: string; model: string; combustion: string; transmission: string; drive: string; power: number; motor: string; eqLevel: string, countries: string[]}
     = await req.json();

    try {
        // Launch puppeteer
        const browser = await puppeteer.launch({
            headless: false,
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
            countryPrice.set(country.toLowerCase(), 0);
            return Response.json(countryPrice);
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

        await page.waitForSelector('.voertuig');

        // Selects the exact car we are looking for
        await page.evaluate((motor, eqLevel, power) => {
            const car_options_arr = Array.from(document.querySelectorAll('.voertuig'));
            
            car_options_arr.forEach(car_option => {
                const input = car_option.querySelector('#vehicleID');
                const typeSpan = car_option.querySelector('span.type');
                const typeDetailsSpan = car_option.querySelector('span.typeDetails');
                const motorDetails = motor.split(' ');

                if (input && typeSpan && typeDetailsSpan) {

                    const motorDetailsIncluded = motorDetails.every(detail => typeDetailsSpan!.textContent?.includes(detail.toUpperCase()));
                    if (typeSpan!.textContent?.includes(String(power))
                        && motorDetailsIncluded
                        && typeDetailsSpan!.textContent?.includes(eqLevel.toUpperCase())) {
                            (input! as HTMLElement).click();
                    }
                }
            })
        }, motor, eqLevel, power);

        await page.waitForSelector('#chosen');

        const price = await page.evaluate(() => {
            const div = document.querySelector('#chosen div.row.specs');
            if (div) {
                const spans = div!.querySelectorAll('span.row.odd');
                if (spans!.length > 10) {
                    const price = spans![11].querySelector('b');
                    if (price) {
                        const priceText = price.textContent;
                        return priceText ? parseInt(priceText.replace('.', '')) : null;
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
        const countryMappingObj = Object.fromEntries(countryMapping);

        await page.evaluate((countries : string[], countryMapping: {[key: string]: string}, eqLevel: string) => {

            countries.forEach(async (country: string) => {
                console.log(country.toLowerCase());
                console.log(countryMapping[country.toLowerCase()].toUpperCase());
                const checkBox = document.querySelector(`input[value="${countryMapping[country.toLowerCase()].toUpperCase()}"]`);
                console.log(checkBox);
                if (checkBox) {
                    (checkBox as HTMLInputElement).click();
                }
                console.log('got here3');
                await page.waitForSelector('div.column.vehicle');
                const divs = document.querySelectorAll('div.column.vehicle');
                divs.forEach((div: any) => {
                    const specs = div.querySelector('div.row.specs');
                    const spans = specs.querySelectorAll('span.row.odd');
                    const localEqLevel = spans[1];
                    if (localEqLevel.toLowerCase().contains(eqLevel.toLowerCase())) {
                        const price = spans[11].querySelector('b');
                        if (price) {
                            const priceText = price.textContent;
                            countryPrice.set(country.toLowerCase(), priceText ? parseInt(priceText.replace('.', '')) : null);
                        }
                    }
                })
                if (checkBox) {
                    (checkBox as HTMLInputElement).click();
                }
            });
        }, countries, countryMappingObj, eqLevel);

        //await browser.close();
        return Response.json(countryPrice);

    } catch (error) {   
        console.error(`Error while searching for car in ${country}:`, error);
        countryPrice.set(country.toLowerCase(), 0);
        return Response.json(countryPrice);
    }

}