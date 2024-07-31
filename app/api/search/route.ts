import puppeteer from 'puppeteer';

const url = process.env.URL!;
const email = process.env.EMAIL!;
const password = process.env.PASSWORD!;

const countryMapping = new Map([['be', 'b'], ['de', 'd'], ['fr', 'f'], ['cz', 'cz'], ['nl', 'nl'], ['hu', 'h'], ['it', 'i'], ['pl', 'pl'], ['pt', 'p'], ['ro', 'ro']])

export async function POST(req: Request) {
    const {country, brand, model, combustion, transmission, drive, power, motor, eqLevel } :
        {country: string; brand: string; model: string; combustion: string; transmission: string; drive: string; power: number; motor: string; eqLevel: string}
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
        console.log(email, password);

        // Perform the login
        await page.type('#email', email);
        await page.type('#password', password);
        await page.click('.btn-primary');
        if (countryMapping.has(country.toLowerCase()) === false) {
            return Response.json(0);
        }
        const countryCode = countryMapping.get(country.toLowerCase())!;
        await page.locator('select').fill(countryCode);
        await page.locator('h2').filter(text => text.textContent?.toLowerCase() === brand.toLowerCase()).click();


    } catch (error) {   
        console.error(`Error while searching for car in ${country}:`, error);
    }

}