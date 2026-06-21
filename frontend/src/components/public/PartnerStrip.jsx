import React, { useState } from 'react';
import { Plane, Ship, Truck, Warehouse, ClipboardList, ArrowLeftRight, Calendar } from 'lucide-react';

const PartnerStrip = () => {
    const [activeTab, setActiveTab] = useState('air');
    
    // Form States
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [width, setWidth] = useState('');
    const [length, setLength] = useState('');
    const [unit, setUnit] = useState('Unit');
    const [quantity, setQuantity] = useState('');
    const [loadType, setLoadType] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [warehouseLocation, setWarehouseLocation] = useState('');
    const [storageArea, setStorageArea] = useState('');
    const [duration, setDuration] = useState('');
    const [storageType, setStorageType] = useState('');
    const [chaType, setChaType] = useState('Air');
    const [port, setPort] = useState('');
    const [chaCargoType, setChaCargoType] = useState('Select Type');

    const handleSwap = () => {
        const temp = origin;
        setOrigin(destination);
        setDestination(temp);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        alert(`Searching quotes for ${activeTab.toUpperCase()} ...`);
    };

    return (
        <section className="pt-6 pb-2 bg-white text-black font-sans">
            <div className="container mx-auto px-4">

                {/* Tab Capsule Selector Container */}
                <div className="flex justify-center mb-10">
                    <div className="bg-white rounded-full p-2 flex flex-wrap md:flex-nowrap gap-3 items-center justify-center shadow-lg border border-gray-200 max-w-full">
                        
                        {/* Air Tab */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('air')}
                            className={`px-6 py-2.5 rounded-full text-base font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer ${
                                activeTab === 'air'
                                    ? 'bg-[#0091d5] text-white shadow-md'
                                    : 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Plane size={18} className={activeTab === 'air' ? 'text-white' : 'text-gray-500'} />
                            <span>Air</span>
                        </button>

                        {/* Sea Tab */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('sea')}
                            className={`px-6 py-2.5 rounded-full text-base font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer ${
                                activeTab === 'sea'
                                    ? 'bg-[#0091d5] text-white shadow-md'
                                    : 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Ship size={18} className={activeTab === 'sea' ? 'text-white' : 'text-gray-500'} />
                            <span>Sea</span>
                        </button>

                        {/* Land Tab */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('land')}
                            className={`px-6 py-2.5 rounded-full text-base font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer ${
                                activeTab === 'land'
                                    ? 'bg-[#0091d5] text-white shadow-md'
                                    : 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Truck size={18} className={activeTab === 'land' ? 'text-white' : 'text-gray-500'} />
                            <span>Land</span>
                        </button>

                        {/* Warehouse Tab */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('warehouse')}
                            className={`px-6 py-2.5 rounded-full text-base font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer ${
                                activeTab === 'warehouse'
                                    ? 'bg-[#0091d5] text-white shadow-md'
                                    : 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Warehouse size={18} className={activeTab === 'warehouse' ? 'text-white' : 'text-gray-500'} />
                            <span>Warehouse</span>
                        </button>

                        {/* CHA Tab */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('cha')}
                            className={`px-6 py-2.5 rounded-full text-base font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer ${
                                activeTab === 'cha'
                                    ? 'bg-[#0091d5] text-white shadow-md'
                                    : 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <ClipboardList size={18} className={activeTab === 'cha' ? 'text-white' : 'text-gray-500'} />
                            <span>CHA</span>
                        </button>

                    </div>
                </div>

                {/* Form Area Wrapper Container - Thick Sky Blue Border Box */}
                <div className="max-w-6xl mx-auto border-[6px] border-[#0091d5] rounded-3xl p-8 bg-white shadow-lg">
                    <form onSubmit={handleSearch} className="space-y-6">

                        {/* ==================== AIR TAB FORM ==================== */}
                        {activeTab === 'air' && (
                            <div className="space-y-6">
                                {/* Row 1 */}
                                <div className="flex flex-col lg:flex-row items-center gap-3">
                                    <div className="w-full lg:flex-1">
                                        <input
                                            type="text"
                                            placeholder="Origin"
                                            value={origin}
                                            onChange={(e) => setOrigin(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={handleSwap}
                                        className="bg-[#0091d5] text-white p-2.5 rounded hover:bg-[#007cb8] transition-all shadow flex items-center justify-center shrink-0"
                                        title="Swap Origin and Destination"
                                    >
                                        <ArrowLeftRight size={16} />
                                    </button>

                                    <div className="w-full lg:flex-1">
                                        <input
                                            type="text"
                                            placeholder="Destination"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="w-full lg:w-44">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] font-medium text-sm transition-all cursor-pointer"
                                            required
                                        />
                                    </div>

                                    <div className="w-full lg:w-48">
                                        <select
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-3 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] font-medium text-sm transition-all"
                                            required
                                        >
                                            <option value="">Select Weight</option>
                                            <option value="0-50">0 - 50 kg</option>
                                            <option value="50-100">50 - 100 kg</option>
                                            <option value="100-500">100 - 500 kg</option>
                                            <option value="500+">500+ kg</option>
                                        </select>
                                    </div>

                                    <div className="w-full lg:w-auto">
                                        <button
                                            type="submit"
                                            className="w-full lg:px-10 py-3 bg-[#0091d5] hover:bg-[#007cb8] text-white font-bold rounded transition-all shadow text-sm tracking-wider"
                                        >
                                            Search
                                        </button>
                                    </div>
                                </div>

                                {/* Row 2 */}
                                <div className="flex flex-wrap items-center justify-start gap-4 max-w-4xl mx-auto lg:ml-12 pt-2">
                                    <div className="w-[120px] sm:w-[150px]">
                                        <input
                                            type="text"
                                            placeholder="Height"
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                        />
                                    </div>
                                    <div className="w-[120px] sm:w-[150px]">
                                        <input
                                            type="text"
                                            placeholder="Width"
                                            value={width}
                                            onChange={(e) => setWidth(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                        />
                                    </div>
                                    <div className="w-[120px] sm:w-[150px]">
                                        <input
                                            type="text"
                                            placeholder="Length"
                                            value={length}
                                            onChange={(e) => setLength(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                        />
                                    </div>
                                    <div className="w-[120px] sm:w-[130px]">
                                        <select
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-3 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] font-medium text-sm transition-all"
                                        >
                                            <option value="Unit">Unit</option>
                                            <option value="cm">cm</option>
                                            <option value="inch">inch</option>
                                            <option value="m">m</option>
                                        </select>
                                    </div>
                                    <div className="w-[120px] sm:w-[150px]">
                                        <input
                                            type="text"
                                            placeholder="Quantity"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== SEA TAB FORM ==================== */}
                        {activeTab === 'sea' && (
                            <div className="space-y-6">
                                <div className="flex flex-col lg:flex-row items-center gap-3">
                                    <div className="w-full lg:flex-1">
                                        <input
                                            type="text"
                                            placeholder="Origin"
                                            value={origin}
                                            onChange={(e) => setOrigin(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={handleSwap}
                                        className="bg-[#0091d5] text-white p-2.5 rounded hover:bg-[#007cb8] transition-all shadow flex items-center justify-center shrink-0"
                                        title="Swap Origin and Destination"
                                    >
                                        <ArrowLeftRight size={16} />
                                    </button>

                                    <div className="w-full lg:flex-1">
                                        <input
                                            type="text"
                                            placeholder="Destination"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="w-full lg:w-44">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] font-medium text-sm transition-all cursor-pointer"
                                            required
                                        />
                                    </div>

                                    <div className="w-full lg:w-48">
                                        <select
                                            value={loadType}
                                            onChange={(e) => setLoadType(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-3 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] font-medium text-sm transition-all"
                                            required
                                        >
                                            <option value="">Select Load Type</option>
                                            <option value="LCL">LCL (Less than Container Load)</option>
                                            <option value="FCL">FCL (Full Container Load)</option>
                                        </select>
                                    </div>

                                    <div className="w-full lg:w-auto">
                                        <button
                                            type="submit"
                                            className="w-full lg:px-10 py-3 bg-[#0091d5] hover:bg-[#007cb8] text-white font-bold rounded transition-all shadow text-sm tracking-wider"
                                        >
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== LAND TAB FORM ==================== */}
                        {activeTab === 'land' && (
                            <div className="space-y-6">
                                {/* Row 1 */}
                                <div className="flex flex-col lg:flex-row items-center gap-3">
                                    <div className="w-full lg:w-40">
                                        <input
                                            type="text"
                                            value="India"
                                            className="w-full border border-gray-400 bg-gray-100 text-black px-4 py-2.5 rounded outline-none font-semibold text-sm cursor-not-allowed"
                                            readOnly
                                        />
                                    </div>

                                    <div className="w-full lg:flex-1">
                                        <input
                                            type="text"
                                            placeholder="Origin"
                                            value={origin}
                                            onChange={(e) => setOrigin(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={handleSwap}
                                        className="bg-[#0091d5] text-white p-2.5 rounded hover:bg-[#007cb8] transition-all shadow flex items-center justify-center shrink-0"
                                        title="Swap Origin and Destination"
                                    >
                                        <ArrowLeftRight size={16} />
                                    </button>

                                    <div className="w-full lg:flex-1">
                                        <input
                                            type="text"
                                            placeholder="Destination"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="w-full lg:w-44">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] font-medium text-sm transition-all cursor-pointer"
                                            required
                                        />
                                    </div>

                                    <div className="w-full lg:w-auto">
                                        <button
                                            type="submit"
                                            className="w-full lg:px-10 py-3 bg-[#0091d5] hover:bg-[#007cb8] text-white font-bold rounded transition-all shadow text-sm tracking-wider"
                                        >
                                            Search
                                        </button>
                                    </div>
                                </div>

                                {/* Row 2 */}
                                <div className="flex flex-wrap items-center justify-start gap-4 max-w-4xl mx-auto lg:ml-44 pt-2">
                                    <div className="w-full md:w-[220px]">
                                        <select
                                            value={loadType}
                                            onChange={(e) => setLoadType(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-3 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] font-medium text-sm transition-all"
                                        >
                                            <option value="">Select Load Type</option>
                                            <option value="PTL">Part Truck Load (PTL)</option>
                                            <option value="FTL">Full Truck Load (FTL)</option>
                                        </select>
                                    </div>
                                    <div className="w-full md:w-[220px]">
                                        <select
                                            value={vehicleType}
                                            onChange={(e) => setVehicleType(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-3 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] font-medium text-sm transition-all"
                                        >
                                            <option value="">Select Vehicle Type</option>
                                            <option value="Open">Open Body Truck</option>
                                            <option value="Container">Closed Container</option>
                                            <option value="Trailer">Flatbed Trailer</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== WAREHOUSE TAB FORM ==================== */}
                        {activeTab === 'warehouse' && (
                            <div className="space-y-6">
                                <div className="flex flex-col lg:flex-row items-center gap-3">
                                    <div className="w-full lg:flex-1">
                                        <input
                                            type="text"
                                            placeholder="Location / City"
                                            value={warehouseLocation}
                                            onChange={(e) => setWarehouseLocation(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="w-full lg:flex-1">
                                        <input
                                            type="text"
                                            placeholder="Storage Area Needed (sq. ft.)"
                                            value={storageArea}
                                            onChange={(e) => setStorageArea(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="w-full lg:w-44">
                                        <input
                                            type="text"
                                            placeholder="Duration (Months)"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="w-full lg:w-48">
                                        <select
                                            value={storageType}
                                            onChange={(e) => setStorageType(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-3 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] font-medium text-sm transition-all"
                                            required
                                        >
                                            <option value="">Select Storage Type</option>
                                            <option value="General">General Warehousing</option>
                                            <option value="Cold">Cold Storage</option>
                                            <option value="Bonded">Bonded Warehouse</option>
                                        </select>
                                    </div>

                                    <div className="w-full lg:w-auto">
                                        <button
                                            type="submit"
                                            className="w-full lg:px-10 py-3 bg-[#0091d5] hover:bg-[#007cb8] text-white font-bold rounded transition-all shadow text-sm tracking-wider"
                                        >
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== CHA TAB FORM ==================== */}
                        {activeTab === 'cha' && (
                            <div className="space-y-6">
                                <div className="flex flex-col lg:flex-row items-center gap-3">
                                    <div className="w-full lg:w-48">
                                        <input
                                            type="text"
                                            value="Air"
                                            className="w-full border border-gray-400 bg-gray-100 text-black px-4 py-2.5 rounded outline-none font-semibold text-sm cursor-not-allowed"
                                            readOnly
                                        />
                                    </div>

                                    <div className="w-full lg:flex-1">
                                        <input
                                            type="text"
                                            placeholder="Port"
                                            value={port}
                                            onChange={(e) => setPort(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-4 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] placeholder-gray-500 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="w-full lg:w-64">
                                        <select
                                            value={chaCargoType}
                                            onChange={(e) => setChaCargoType(e.target.value)}
                                            className="w-full border border-gray-400 bg-white text-black px-3 py-2.5 rounded outline-none focus:border-[#0091d5] focus:ring-1 focus:ring-[#0091d5] font-medium text-sm transition-all"
                                            required
                                        >
                                            <option value="Select Type">Select Type</option>
                                            <option value="Customs Clearing">Customs Clearing</option>
                                            <option value="Import Duty">Import Duty Clearance</option>
                                            <option value="Export Documentation">Export Documentation</option>
                                        </select>
                                    </div>

                                    <div className="w-full lg:w-auto">
                                        <button
                                            type="submit"
                                            className="w-full lg:px-10 py-3 bg-[#0091d5] hover:bg-[#007cb8] text-white font-bold rounded transition-all shadow text-sm tracking-wider"
                                        >
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </form>
                </div>

            </div>
        </section>
    );
};

export default PartnerStrip;
