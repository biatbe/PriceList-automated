'use client';

import React, {useState, useEffect} from 'react';
import Popup from 'reactjs-popup';
import {XMarkIcon} from '@heroicons/react/24/outline';
import {Tooltip} from "@nextui-org/tooltip";
import { Leva } from 'leva';

export default function CarsPopup({onFormSubmit, countries} : {onFormSubmit : any, countries : string[]}) {
  // Loading state
  const [state, setState] = useState('loaded');
  // State for whether the popup is open
  const [isOpen, setIsOpen] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('hatchback');
  const [doors, setDoors] = useState(5);
  const [power, setPower] = useState(0);
  const [motor, setMotor] = useState('');
  const [combustion, setCombustion] = useState('Petrol');
  const [transmission, setTransmission] = useState('A');
  const [drive, setDrive] = useState('FWD');
  const [eqLevel, setEqLevel] = useState('');
  const [country, setCountry] = useState('DE');
  const [discount, setDiscount] = useState(0);
  const margin_percentage = 7;

  const searchCarPrice = async () => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({country, brand, model, type, doors, combustion, transmission, drive, power, motor, eqLevel, countries}),
      });

      if (response.ok) {
        let countryPrices : any = await response.json();
        createCarInput(countryPrices);
      } else {
        console.error("Error searching car!");
      }
    } catch (error) {
      console.error('Failed to search car price: ', error);
    }
  };

  const createCarInput = async (countryPrices : any) => {
    try {
      if (countryPrices) { 
        const countryObject = JSON.parse(countryPrices);
        let targetPrice = countryObject[country.toLowerCase()];

        // Send request to save the process to the database
        const response = await fetch('/api/cars', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({brand, model, type, doors, power, motor, combustion, transmission, drive,
            eqLevel, country, discount, targetPrice, countryPrices: countryObject}),
        });
      
        if (response.ok) {
          console.log('Car saved successfully!', response.json());
          setState('saved');
        } else {
          setState('failed');
          console.error('Failed to save car!');
        }
      }
    } catch (error) { 
      // Handle network error
      setState('error');
      console.error('Network error:', error);
    }
  }

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setState("loading");
    await searchCarPrice();
  }

  // sets state to true causing the popup to open
  const openModal = () => {
    setIsOpen(true);
  };

  // sets state to false causing the popup to close
  const closeModal = () => {
    onFormSubmit();
    setState('loaded');
    setIsOpen(false);
  };

  if (state == 'loading') {
    return (
      <>
        <div className="w-36 h-12 p-2 border flex justify-center items-center rounded mr-2 mb-2 text-black font-bold cursor-pointer bg-green-300 hover:bg-green-500/10 hover:text-black/50 " onClick={openModal}>
          Add Car
        </div>
        <Popup open={isOpen} onClose={closeModal} modal nested>
          <div className="w-full h-full flex justify-center items-center bg-gray-800 bg-opacity-75 fixed top-0 left-0 z-50">
            <div className="modal-frame flex flex-col w-4/5 h-4/5 p-8 bg-white rounded-lg">
              <div className={'w-full items-center justify-center flex h-full z-30'}>
                  <div className={'absolute z-40 h-auto left-2 top-2'}>
                    <Leva fill />
                  </div>
                  <div role="status">
                    <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                  </div>
                  <p className={'ml-4'}>{"Saving your data..."}</p>
                </div>
            </div>
          </div>
        </Popup>
      </>
    )
  } else if (state == 'loaded') {
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
                <form onSubmit={handleCreate}>
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
                      <label htmlFor="type-select">Type:</label>
                      <select className='border-black border rounded-lg p-1 ml-2' value={type} onChange={(e) => setType(e.target.value)} id="type-select">
                        <option value="hatchback">Hatchback</option>
                        <option value="sedan">Sedan</option>
                        <option value="coupe">Coupe</option>
                        <option value="sw">SW</option>
                        <option value="suv">SUV</option>
                        <option value="convertible">Cabriolet</option>
                      </select>
                    </div>
                    <div className='mb-4'>
                      <label htmlFor="doors-select">Doors:</label>
                      <select className='border-black border rounded-lg p-1 ml-2' value={doors.toString()} onChange={(e) => setDoors(parseInt(e.target.value))} id="doors-select">
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                      </select>
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
                      <input type='text' id='eq-level' value={eqLevel} onChange={(e) => setEqLevel(e.target.value)} className='ml-2 rounded pl-2'/>
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
                      <button type='submit' className='border rounded-lg border-black py-2 px-4 text-lg bg-indigo-600 text-white hover:bg-indigo-800/50'>Create</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Popup>
      </>
    );
  } else {
      return (
        <>
          <div className="w-36 h-12 p-2 border flex justify-center items-center rounded mr-2 mb-2 text-black font-bold cursor-pointer bg-green-300 hover:bg-green-500/10 hover:text-black/50 " onClick={openModal}>
            Add Car
          </div>
          <Popup open={isOpen} onClose={closeModal} modal nested>
            <div className="w-full h-full flex justify-center items-center bg-gray-800 bg-opacity-75 fixed top-0 left-0 z-50">
              <div className="modal-frame flex flex-col w-4/5 h-4/5 p-8 bg-white rounded-lg">
                <div className={'w-full items-center justify-center flex h-full z-30'}>
                  <div>
                    <h4>
                      {state == 'saved' ? "Success! Data is saved!" : state == 'failed' ? "Failed to save car!"
                       : state == 'error' ? "There was a network error! Please try again!" : "Unkonwn error!"}
                    </h4>
                    <button onClick={closeModal}>OK</button>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        </>
      )
  }
}