'use client';

import React, {useState, useEffect} from 'react';
import Popup from 'reactjs-popup';
import {XMarkIcon} from '@heroicons/react/24/outline';
import {Tooltip} from "@nextui-org/tooltip";

export default function CarsPopup({onFormSubmit} : {onFormSubmit : any}) {
  // State for whether the popup is open
  const [isOpen, setIsOpen] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [power, setPower] = useState(0);
  const [motor, setMotor] = useState('');
  const [combustion, setCombustion] = useState('Petrol');
  const [transmission, setTransmission] = useState('A');
  const [drive, setDrive] = useState('FWD');
  const [eqLevel, setEqLevel] = useState('');
  const [calculatedBuyingPrice, setCalculatedBuyingPrice] = useState(0);
  const [margin, setMargin] = useState(0);
  const [salesPrice, setSalesPrice] = useState(0);
  const [country, setCountry] = useState('DE');
  const [discount, setDiscount] = useState(0);
  const [targetMarketPrice, setTargetMarketPrice] = useState(0);
  const margin_percentage = 7;

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({country, brand, model, combustion, transmission, drive, power, motor, eqLevel}),
      });

      const targetPrice = await response.json();
      setTargetMarketPrice(targetPrice!);
    } catch (error) { 
      // Handle network error
      console.error('Network error:', error);
    }
    
    if (targetMarketPrice != 0) {
      setSalesPrice((1 - discount / 100) * targetMarketPrice);
      setMargin(salesPrice - (salesPrice/ (1 + margin_percentage/100)));
      setCalculatedBuyingPrice(salesPrice /  margin);
    }
    try {
      // Send request to save the process to the database
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({brand, model, power, motor, combustion, transmission, drive,
           eqLevel, country, discount, calculatedBuyingPrice, margin, salesPrice, targetMarketPrice}),
      });

      if (response.ok) {
        console.log('Car saved successfully!', response.json());
        onFormSubmit();
      } else {
        console.error('Failed to save car!');
      }
    } catch (error) {
      // Handle network error
      console.error('Network error:', error);
    }
  };


  // sets state to true causing the popup to open
  const openModal = () => {
    setIsOpen(true);
  };

  // sets state to false causing the popup to close
  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="w-36 h-12 p-2 border flex justify-center items-center rounded mr-2 mb-2 text-black font-bold cursor-pointer bg-green-300 hover:bg-green-500/10 hover:text-black/50 " onClick={openModal}>
        Add Car
      </div>
      <Popup open={isOpen} onClose={closeModal} modal nested>
        <div className="w-full h-full flex justify-center items-center bg-gray-800 bg-opacity-75 fixed top-0 left-0 z-50">
          <div className="modal-frame flex flex-col w-4/5 h-4/5 p-8 bg-white rounded-lg">
            <div className="relative">
              <h5 className="text-left font-bold text-xl leading-9 tracking-tight text-black pb-2">Add a new car</h5>
              <div className="absolute right-0 top-0 cursor-pointer" onClick={closeModal}>
                <XMarkIcon className="w-8 hover:text-black/50" />
              </div>
            </div>
            <div className="w-full h-full modal overflow-auto">
              <form action={handleCreate}>
                <div className='flex flex-wrap flex-col overflow-hidden'>
                  <div className='mb-4'>
                    <label htmlFor="brand">Brand:</label>
                    <input type='text' id='brand' value={brand} onChange={(e) => setBrand(e.target.value)} className='ml-2 rounded pl-2' required/>
                  </div>
                  <div className='mb-4'>
                    <label htmlFor="model">Model:</label>
                    <input type='text' id='model' value={model} onChange={(e) => setModel(e.target.value)} className='ml-2 rounded pl-2' required/>
                  </div>
                  <div className='mb-4'>
                    <label htmlFor="power">Power (KW):</label>
                    <input type='number' id='power' value={power} onChange={(e) => setPower(parseInt(e.target.value))} className='ml-2 rounded pl-2' required/>
                  </div>
                  <div className='mb-4'>
                    <label htmlFor="motor">Motor (e.g. MHEV TURBO):</label>
                    <input type='text' id='motor' value={motor} onChange={(e) => setMotor(e.target.value)} className='ml-2 rounded pl-2' required/>
                  </div>
                  <div className='mb-4'>
                    <Tooltip showArrow={true} content="The option choosen in auto-configurator">
                      <label htmlFor="combustion-select" className='underline decoration-dashed'>Combustion:</label>
                    </Tooltip>
                    <select id="combustion-select" value={combustion} onChange={(e) => setCombustion(e.target.value)} className='border-black border rounded-lg p-1 ml-2'>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>
                  <div className='mb-4'>
                    <label htmlFor="transmission-select">Transmission:</label>
                    <select className='border-black border rounded-lg p-1 ml-2' value={transmission} onChange={(e) => setTransmission(e.target.value)} id="transmission-select">
                      <option value="A">Automatic</option>
                      <option value="M">Manual</option>
                    </select>
                  </div>
                  <div className='mb-4'>
                    <label htmlFor="drive">Drive:</label>
                    <select className='border-black border rounded-lg p-1 ml-2' value={drive} onChange={(e) => setDrive(e.target.value)} id="drive">
                      <option value="FWD">FWD</option>
                      <option value="RWD">RWD</option>
                      <option value="AWD">AWD</option>
                    </select>
                  </div>
                  <div className='mb-4'>
                    <label htmlFor="eq-level">Eq. level (e.g. N-Line):</label>
                    <input type='text' id='eq-level' value={eqLevel} onChange={(e) => setEqLevel(e.target.value)} className='ml-2 rounded pl-2' required/>
                  </div>
                  <div className='mb-4'>
                    <label htmlFor="ncp-country">NCP Country:</label>
                    <select className='border-black border rounded-lg p-1 ml-2' value={country} onChange={(e) => setCountry(e.target.value)} id="ncp-country">
                      <option value="DE">Germany</option>
                      <option value="IT">Italy</option>
                      <option value="FR">France</option>
                      <option value="NL">Netherlands</option>
                    </select>
                  </div>
                  <div className='mb-4'>
                    <label htmlFor="discount">Discount:</label>
                    <input type='number' id='discount' value={discount} onChange={(e) => setDiscount(parseInt(e.target.value))} className='ml-2 rounded pl-2' required/>
                  </div>
                  <div className='mb-4'>
                    <button type='submit' onClick={closeModal} className='border rounded-lg border-black py-2 px-4 text-lg bg-indigo-600 text-white hover:bg-indigo-800/50'>Create</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Popup>
    </>
  );
}