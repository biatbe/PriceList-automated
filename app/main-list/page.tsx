'use client'

import { Car, CarPrice, Country } from "@prisma/client";
import React, { useRef } from "react";
import { useEffect, useState } from "react"
import CarsPopup from "./carPopUp";
import DataTable from 'datatables.net-dt';

export default function PriceList() {

    const [countries, setCountries] = useState<Country[]>([]);
    const countriesAbb = countries.map((country) => country.abbreviation);
    const [cars, setCars] = useState<Car[]>([]);
    const [refresh, setRefresh] = useState(false);
    const tableRef = useRef(null);
    const dataTableRef = useRef<any>();

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
                order: [[0, 'asc'], [1, 'asc'], [2, 'asc'], [3, 'asc'], [5, 'asc'], [6, 'asc'], [7, 'asc']],
                pageLength: 100,
            });
        }
    }, [cars, countries, refresh]);

    const handleFormSubmit = () => {
        setRefresh(!refresh); // Toggle the refresh state to trigger useEffect
    };

    return (
        <>
            <div>
                <div className="mt-5 ml-2">
                    <CarsPopup onFormSubmit={handleFormSubmit} countries={countriesAbb}/>
                </div>
                <div className="flex mt-2">
                    <table id="carPrices" ref={tableRef}>
                        <thead>
                            <tr>
                                <th>Brand</th>
                                <th>Model</th>
                                <th>Power (KW)</th>
                                <th>Motor</th>
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
                            {cars.length > 0 && cars.map((car : Car) => (
                                <tr className="odd:bg-slate-200 even:bg-slate-50" key={car.id}>
                                    <td>{car.brand}</td>
                                    <td>{car.model}</td>
                                    <td>{car.kw}</td>
                                    <td>{car.motor}</td>
                                    <td>{car.combustion}</td>
                                    <td>{car.transmission}</td>
                                    <td>{car.drive}</td>
                                    <td>{car.eqLevel}</td>
                                    <td>{car.calculated_buying_price}</td>
                                    <td>{car.margin}</td>
                                    <td>{car.sales_price}</td>
                                    <td>{car.target_country}</td>
                                    <td>{car.discount}</td>
                                    <td>{car.target_market_price}</td>
                                    {countries.length > 0 && countries.map((country: Country) => {
                                        const priceData = car.prices.find((price: CarPrice) => price.countryId === country.id);
                                        return (
                                            <React.Fragment key={country.id}>
                                                {country.currency !== 'Euro' && (
                                                    <td>{priceData ? priceData.price : 'N/A'}</td>
                                                )}
                                                <td>{priceData ? priceData.price_in_EUR : 'N/A'}</td>
                                                <td>{priceData ? priceData.discount_on_NCP : 'N/A'}</td>
                                                <td>{priceData ? priceData.needed_discount_percentage : 'N/A'}</td>
                                                <td>{priceData ? priceData.available_discount_percentage : 'N/A'}</td>
                                                <td>{priceData ? priceData.additional_discount_needed : 'N/A'}</td>
                                            </React.Fragment>
                                    );
                                })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}