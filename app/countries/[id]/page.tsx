'use client'

import { Car, CarPrice, Country } from "@prisma/client";
import React, { useRef } from "react";
import { useEffect, useState } from "react"
import DataTable from 'datatables.net-dt';
import '@/app/css_modules/table.css';

export default function PriceList({params} : {params : {id : string}}) {
    const [country, setCountry] = useState<Country>();
    const [cars, setCars] = useState<Car[]>([]);
    const [refreshData, setRefreshData] = useState(false);
    const [refreshTable, setRefreshTable] = useState(false);
    const [carPrices, setCarPrices] = useState<CarPrice[]>([]);
    const tableRef = useRef(null);
    const dataTableRef = useRef<any>();
    const margin_percentage = 7;

    useEffect(() => {
        fetch('/api/countries/' + params.id)
            .then(async (res) => await res.json())
            .then((country) => {
                setCountry(country);
            });
        fetch('/api/cars')
            .then(async (res) => await res.json())
            .then((cars) => setCars(cars));
    }, []);

    useEffect(() => {
        fetch('/api/countries/' + params.id + '/carPrices')
            .then(async (res) => await res.json())
            .then((carprices) => setCarPrices(carprices));
    }, [refreshData]);

    useEffect(() => {
        if (cars.length > 0 && country) {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
            }
            dataTableRef.current = new DataTable('#carPrices', {
                order: [[0, 'asc'], [1, 'asc'], [2, 'asc'], [3, 'asc'], [4, 'asc'], [5, 'asc'], [7, 'asc'], [8, 'asc'], [9, 'asc']],
                pageLength: 100,
            });
        }
    }, [cars, country, refreshTable]);

    const updateCarPriceDetails = async (carPrice : CarPrice) => {
        const discount = carPrice.available_discount_percentage;
        const notes = carPrice.additional_notes;
        try {
          const response = await fetch('/api/countries/' + carPrice.id.toString(), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({discount, notes}),
          });
    
          if (response.ok) {
            console.log("Car details updated successfully!");
          } else {
            console.error("Error updating car details!");
          }
        } catch (error) {
          console.error('Failed to edit car detail: ', error);
        }
      };

    const handleNotesChange = ((e : any, priceData : CarPrice) => {
        const updatedCarPrices = carPrices.map((carPrice) => {
            if (carPrice.id === priceData.id) {
                return { ...carPrice, additional_notes: e.target.value };
            }
            return carPrice;
        });
    
        setCarPrices(updatedCarPrices);
    })

    const handleDiscountChange = ((e : any, priceData : CarPrice) => {
        const updatedCarPrices = carPrices.map((carPrice) => {
            if (carPrice.id === priceData.id) {
                return { ...carPrice, available_discount_percentage: e.target.value };
            }
            return carPrice;
        });
    
        setCarPrices(updatedCarPrices);
    })

    // On enter press we update the values in the database
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, priceData: CarPrice) => {
        if (e.key === 'Enter') {
          updateCarPriceDetails(priceData);
          e.currentTarget.blur();
        }
      };

    // If the user clicks outside we reset the data, bascically cancelling the edit
    const handleOnBlur = () => {
        setRefreshData(!refreshData);
    };

    return (
        <>
            <div>
                <div className="mt-2 mx-10">
                    <table className="text-xs" id="carPrices" ref={tableRef}>
                        <thead>
                            <tr>
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
                                {country ? (
                                    <React.Fragment key={country.id}>
                                        {country.currency != 'Euro' ? 
                                            <th>{country.abbreviation} Netto in {country.currency}</th>
                                        : null}
                                        <th>{country.abbreviation} Netto in EUR</th>
                                        <th>{country.abbreviation} target discount %</th>
                                        <th>{country.abbreviation} Available Discount %</th>
                                        <th>{country.abbreviation} Additional Discount needed</th>
                                        <th>Notes</th>
                                    </React.Fragment>
                                ): null}
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
                                        {country && (
                                        (() => {
                                            const priceData = carPrices.find((price: CarPrice) => price.carId === car.id);
                                            let priceInEUR = 0;
                                            let neededDiscountPercentage = 0;
                                            let additionalDiscountNeeded = 0;

                                            if (priceData && priceData.price && priceData.price > 0) {
                                                priceInEUR = country.currency === 'Euro' ? priceData.price : priceData.price / 20; // TODO: Actual conversion rates
                                                neededDiscountPercentage = +((-(buyingPrice - priceInEUR) / priceInEUR) * 100).toFixed(2);
                                                additionalDiscountNeeded = Math.round((neededDiscountPercentage / 100) * priceInEUR);
                                            }

                                            return (
                                            <React.Fragment key={country.id}>
                                                {country.currency !== 'Euro' && (
                                                <td>{country.currency} {priceData ? priceData.price : 'N/A'}</td>
                                                )}
                                                <td>€ {priceData ? priceInEUR : 'N/A'}</td>
                                                <td>{priceData ? neededDiscountPercentage : 'N/A'}%</td>
                                                <td><input type="number" className="border-none bg-transparent p-1" id={'discount-'+car.id} onBlur={() => handleOnBlur()} onKeyDown={(e) => handleKeyPress(e, priceData!)} value={priceData?.available_discount_percentage} onChange={(e) => handleDiscountChange(e, priceData!)} />%</td>
                                                <td>€ {priceData ? additionalDiscountNeeded : 'N/A'}</td>
                                                <td><input className="border-none bg-transparent p-1" id={'notes-'+car.id} onBlur={() => handleOnBlur()} onKeyDown={(e) => handleKeyPress(e, priceData!)} value={priceData?.additional_notes} onChange={(e) => handleNotesChange(e, priceData!)} /></td>
                                            </React.Fragment>
                                            );
                                        })()
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}