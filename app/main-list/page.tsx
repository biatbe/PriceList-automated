'use client'

import { AccessLevel, Car, CarPrice, Country } from "@prisma/client";
import React, { useRef } from "react";
import { useEffect, useState } from "react"
import CarsPopup from "./carPopUp";
import DataTable from 'datatables.net-dt';
import { TrashIcon } from "@heroicons/react/24/outline";
import '@/app/css_modules/table.css';
import Nav from "../nav/page";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PriceList() {
    const [countries, setCountries] = useState<Country[]>([]);
    const countriesAbb = countries.map((country) => country.abbreviation);
    const [cars, setCars] = useState<Car[]>([]);
    const [refresh, setRefresh] = useState(false);
    const tableRef = useRef(null);
    const dataTableRef = useRef<any>();
    const margin_percentage = 7;

    const {status, data} = useSession();
    const router = useRouter();
    const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchAccessLevels();
        } else if (status === 'unauthenticated') {
            console.log('User is not authenticated, redirecting to login...');
            router.push('/login');
        }
    }, [status, data]);

    const fetchAccessLevels = async () => {
        try {
            const response : any = await fetch('/api/accessLevels', {
                cache: 'no-cache'
            }).then(response => response.json());

            setAccessLevels(response.accessLevel);
        } catch (error) {
            console.error('Failed to fetch access levels:', error);
        }
    }

    useEffect(() => {
        fetch('/api/countries')
            .then(async (res) => await res.json())
            .then((countries) => setCountries(countries));
        fetch('/api/cars')
            .then(async (res) => await res.json())
            .then((cars) => setCars(cars));
    }, [refresh]);

    useEffect(() => {
        if (cars.length > 0 && countries.length > 0) {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
            }
            dataTableRef.current = new DataTable('#carPrices', {
                order: [[0, 'asc'], [1, 'asc'], [2, 'asc'], [3, 'asc'], [4, 'asc'], [5, 'asc'], [7, 'asc'], [8, 'asc'], [9, 'asc']],
                pageLength: 100,
            });
        }
    }, [cars, countries]);

    const handleFormSubmit = () => {
        setRefresh(!refresh); // Toggle the refresh state to trigger useEffect
    };

    const refreshPrices = async () => {
        try {
            const response = await fetch('/api/price-update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });
            if (response.ok) {
                console.log('Prices refreshed successfully!');
            } else {
                console.error('Failed to refresh prices!');
            }
        } catch (error) {
            console.error('Server error:', error);
        }    
    }

    // Alert to confirm deleting the car
    const confirmDelete = (id : number) => {
        const result = confirm("Are you sure you want to delete this car?");
        if (result) {
            deleteRow(id);
        }
    }

    const deleteRow = async (id: number) => {
        try {
            const response = await fetch('/api/cars/' + id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });
            if (response.ok) {
                console.log('Car deleted successfully!');
                setRefresh(!refresh);
            } else {
                console.error('Failed to delete car!');
            }
        } catch (error) {
            console.error('Server error:', error);
        } 
    }

    if (status === 'authenticated' && accessLevels.some((level) => level.page.toLowerCase() == 'main')) {
        return (
            <>
                <div>
                    <Nav />
                </div>
                <div>
                    <div className="mt-5 ml-2">
                        <CarsPopup onFormSubmit={handleFormSubmit} countries={countriesAbb}/>
                    </div>
                    <div className="mt-5 ml-2">
                        <button type="button" onClick={refreshPrices}>Refresh</button>
                    </div>
                    <div className="mt-2 mx-10">
                        <table className="text-xs" id="carPrices" ref={tableRef}>
                            <thead>
                                <tr>
                                    <td>Action</td>
                                    <th>Brand</th>
                                    <th>Model</th>
                                    <th>Power (KW)</th> 
                                    <th>Motor</th>
                                    <th>Type</th>
                                    <th>Doors</th>
                                    <th>Combustion</th>
                                    <th>Transmission</th>
                                    <th>Drive</th>
                                    <th>Eq. Level</th>
                                    <th>Calculated Buying Price</th>
                                    <th>Margin N4C</th>
                                    <th>Sales Price</th>
                                    <th>Target Country</th>
                                    <th>Discount on NCP</th>
                                    <th>NCP target market</th>
                                    {countries.length > 0 && countries.map((country: Country) => (
                                        <React.Fragment key={country.id}>
                                            {country.currency != 'Euro' ? 
                                                <th>{country.abbreviation} Netto in {country.currency}</th>
                                            : null}
                                            <th>{country.abbreviation} Netto in EUR</th>
                                            <th>{country.abbreviation} discount on NCP</th>
                                            <th>{country.abbreviation} target discount %</th>
                                            <th>{country.abbreviation} Available Discount %</th>
                                            <th>{country.abbreviation} Additional Discount needed</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cars.length > 0 && cars.map((car : Car) => {
                                    let salesPrice = 0;
                                    let margin = 0;
                                    let buyingPrice = 0;
                                    let targetPrice = car.target_market_price;
                                    if (targetPrice != 0) {
                                    salesPrice = Math.round((1 - car.discount / 100) * targetPrice!);
                                    margin = Math.round(salesPrice - (salesPrice/ (1 + margin_percentage/100)));
                                    buyingPrice = Math.round(salesPrice - margin);
                                    }


                                    return (
                                        <tr className="odd:bg-white even:bg-gray-200" key={car.id}>
                                            <td className="flex justify-center">
                                                <TrashIcon onClick={() => confirmDelete(car.id)} className="text-red-600 rounded w-6 cursor-pointer text-center hover:text-red-600/50 hover:bg-slate-400"/>    
                                            </td>
                                            <td>{car.brand}</td>
                                            <td>{car.model}</td>
                                            <td>{car.kw}</td>
                                            <td>{car.motor}</td>
                                            <td>{car.type.toUpperCase()}</td>
                                            <td>{car.doors}</td>
                                            <td>{car.combustion}</td>
                                            <td>{car.transmission}</td>
                                            <td>{car.drive}</td>
                                            <td>{car.eqLevel}</td>
                                            <td>€ {buyingPrice}</td>
                                            <td>€ {margin}</td>
                                            <td>€ {salesPrice}</td>
                                            <td>{car.target_country}</td>
                                            <td>{car.discount}%</td>
                                            <td>€ {car.target_market_price}</td>
                                            {countries.length > 0 && countries.map((country: Country) => {
                                                const priceData = car.prices.find((price: CarPrice) => price.countryId === country.id);
                                                let priceInEUR = 0;
                                                let discountOnNCP = 0;
                                                let neededDiscountPercentage = 0;
                                                let additionalDiscountNeeded = 0;

                                                if (priceData.price > 0) {
                                                    priceInEUR = country.currency === 'Euro' ? priceData.price : priceData.price / 20; // TODO: Actual conversion rates
                                                    discountOnNCP = +((1 - (priceInEUR / car.target_market_price))*100).toFixed(2);
                                                    neededDiscountPercentage = +((-(buyingPrice - priceInEUR) / priceInEUR)*100).toFixed(2);
                                                    additionalDiscountNeeded = Math.round((neededDiscountPercentage/100) * priceInEUR);
                                                }
                                                return (
                                                    <React.Fragment key={country.id}>
                                                        {country.currency !== 'Euro' && (
                                                            <td>{country.currency} {priceData ? priceData.price : 'N/A'}</td>
                                                        )}
                                                        <td>€ {priceData ? priceInEUR : 'N/A'}</td>
                                                        <td>{priceData ? discountOnNCP : 'N/A'}%</td>
                                                        <td>{priceData ? neededDiscountPercentage : 'N/A'}%</td>
                                                        <td>{priceData ? priceData.available_discount_percentage : 'N/A'}%</td>
                                                        <td>€ {priceData ? additionalDiscountNeeded : 'N/A'}</td>
                                                    </React.Fragment>
                                            );
                                        })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        )
    } else if (status == 'loading' || accessLevels.length == 0){
        return (
            <>
                <div>
                    <Nav />
                </div>
                <div className="flex justify-center items-center mt-20 font-bold">
                    <h1>Loading data...</h1>
                </div>
            </>
        )
    } else {
        return (
            <>
                <div>
                    <Nav />
                </div>
                <div className="flex justify-center items-center mt-20 font-bold">
                    <h1>You do not have access to this site!</h1>
                </div>
            </>
        )
    }
}