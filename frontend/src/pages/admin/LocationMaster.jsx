import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Edit as EditIcon, X, ShieldCheck, Tag, Anchor, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useLocations } from '../../services/LocationService';

const LOCATION_TYPES = ['Airport', 'Seaport', 'Land Port', 'Warehouse', 'CHA'];
const COUNTRIES = [
    { name: 'India', code: 'IN' },
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'UK' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'Singapore', code: 'SG' },
    { name: 'China', code: 'CN' }
];

const LocationMaster = () => {
    const {
        locations,
        currentPage,
        totalPages,
        totalLocations,
        loading,
        fetchLocations,
        addLocation,
        updateLocation,
        deleteLocation
    } = useLocations();

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const limit = 15;

    // Add Form states
    const [type, setType] = useState('Airport');
    const [code, setCode] = useState('');
    const [icao, setIcao] = useState('');
    const [name, setName] = useState('');
    const [countryIndex, setCountryIndex] = useState(0); 
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    // Edit Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editId, setEditId] = useState('');
    const [editType, setEditType] = useState('Airport');
    const [editCode, setEditCode] = useState('');
    const [editIcao, setEditIcao] = useState('');
    const [editName, setEditName] = useState('');
    const [editCountryIndex, setEditCountryIndex] = useState(0);
    const [editCity, setEditCity] = useState('');
    const [editState, setEditState] = useState('');

    // Debounce search input changes
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLocations(1, limit, searchQuery);
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this location?')) return;
        try {
            await deleteLocation(id);
            showSuccessAlert('Location deleted successfully.');
            fetchLocations(currentPage, limit, searchQuery);
        } catch (err) {
            console.error('Error deleting location:', err);
            showErrorAlert('Could not delete location.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!type || !code || !name || !city || !state) {
            setError('Please fill in all required fields');
            return;
        }

        const selectedCountry = COUNTRIES[countryIndex];

        const payload = {
            type,
            code,
            icao,
            name,
            country: selectedCountry.name,
            countryCode: selectedCountry.code,
            city,
            state
        };

        try {
            await addLocation(payload);
            showSuccessAlert('Location added to master successfully!');
            resetForm();
            setSearchQuery(''); 
            fetchLocations(1, limit, ''); 
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving location');
        }
    };

    const handleOpenEditModal = (loc) => {
        setEditId(loc._id);
        setEditType(loc.type);
        setEditCode(loc.code);
        setEditIcao(loc.icao || '');
        setEditName(loc.name);
        setEditCity(loc.city);
        setEditState(loc.state);

        // Find country index
        const idx = COUNTRIES.findIndex(c => c.name.toLowerCase() === loc.country.toLowerCase());
        setEditCountryIndex(idx >= 0 ? idx : 0);

        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!editType || !editCode || !editName || !editCity || !editState) {
            alert('Please fill in all required fields');
            return;
        }

        const selectedCountry = COUNTRIES[editCountryIndex];

        const payload = {
            type: editType,
            code: editCode,
            icao: editIcao,
            name: editName,
            country: selectedCountry.name,
            countryCode: selectedCountry.code,
            city: editCity,
            state: editState
        };

        try {
            await updateLocation(editId, payload);
            setIsEditModalOpen(false);
            showSuccessAlert('Location updated successfully!');
            fetchLocations(currentPage, limit, searchQuery); 
        } catch (err) {
            console.error('Error updating location:', err);
            alert(err.response?.data?.message || 'Error updating location');
        }
    };

    const showSuccessAlert = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const showErrorAlert = (msg) => {
        setError(msg);
        setTimeout(() => setError(''), 3000);
    };

    const resetForm = () => {
        setType('Airport');
        setCode('');
        setIcao('');
        setName('');
        setCountryIndex(0);
        setCity('');
        setState('');
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            fetchLocations(page, limit, searchQuery);
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${currentPage === 1 ? 'bg-[#0066FF] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(<span key="ellipsis-start" className="px-1.5 text-slate-400 font-bold">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${currentPage === i ? 'bg-[#0066FF] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'}`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis-end" className="px-1.5 text-slate-400 font-bold">...</span>);
            }
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${currentPage === totalPages ? 'bg-[#0066FF] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                >
                    {totalPages}
                </button>
            );
        }

        return pages;
    };

    const showingFrom = totalLocations === 0 ? 0 : (currentPage - 1) * limit + 1;
    const showingTo = Math.min(currentPage * limit, totalLocations);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12 text-slate-800">
            <div>
                <h2 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
                    <Globe className="text-[#0066FF]" /> Location Master
                </h2>
                <p className="text-xs text-slate-500 font-black uppercase tracking-wider mt-0.5">Manage global ports, airports, and custom clearance sites</p>
            </div>

            {/* TOP CARD: Add Location Form - Border Radius Reduced (rounded-lg) */}
            <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 justify-between">
                    <h3 className="text-sm font-black !text-[#0B1E43] uppercase tracking-wider flex items-center gap-2">
                        <Plus size={16} className="text-[#0066FF]" /> Add Master Location
                    </h3>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3.5 text-sm font-black">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-100 text-green-600 rounded-md p-3.5 text-sm font-black">
                        {success}
                    </div>
                )}

                {/* Form fields with rounded-md border radius */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="block text-xs font-black !text-black uppercase tracking-wider">Select Type</label>
                        <select
                             value={type}
                             onChange={(e) => setType(e.target.value)}
                             className="w-full bg-white border border-slate-350 rounded-md px-3 py-2.5 text-base font-black !text-black focus:outline-none focus:border-[#0066FF]"
                        >
                            {LOCATION_TYPES.map((t) => (
                                <option key={t} value={t} className="!text-black text-base">{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-black !text-black uppercase tracking-wider">Code (IATA/Port)</label>
                        <input
                            type="text"
                            placeholder="e.g. DEL or INVTZ1"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full bg-white border border-slate-355 rounded-md px-4 py-2.5 text-base font-black !text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] uppercase"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-black !text-black uppercase tracking-wider">ICAO Code</label>
                        <input
                            type="text"
                            placeholder="e.g. VIDP"
                            value={icao}
                            onChange={(e) => setIcao(e.target.value)}
                            className="w-full bg-white border border-slate-355 rounded-md px-4 py-2.5 text-base font-black !text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] uppercase"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-black !text-black uppercase tracking-wider">Location Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Indira Gandhi Intl Airport"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white border border-slate-355 rounded-md px-4 py-2.5 text-base font-black !text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF]"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-black !text-black uppercase tracking-wider">Select Country</label>
                        <select
                            value={countryIndex}
                            onChange={(e) => setCountryIndex(Number(e.target.value))}
                            className="w-full bg-white border border-slate-355 rounded-md px-3 py-2.5 text-base font-black !text-black focus:outline-none focus:border-[#0066FF]"
                        >
                            {COUNTRIES.map((c, idx) => (
                                <option key={c.code} value={idx} className="!text-black text-base">{c.name} ({c.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-black !text-black uppercase tracking-wider">City</label>
                        <input
                            type="text"
                            placeholder="e.g. New Delhi"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-white border border-slate-355 rounded-md px-4 py-2.5 text-base font-black !text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF]"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-black !text-black uppercase tracking-wider">State</label>
                        <input
                            type="text"
                            placeholder="e.g. Delhi"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full bg-white border border-slate-355 rounded-md px-4 py-2.5 text-base font-black !text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF]"
                            required
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-sm font-black py-3 rounded-md transition-all cursor-pointer uppercase tracking-wider shadow-md shadow-[#0066FF]/25"
                        >
                            Save Location
                        </button>
                    </div>
                </form>
            </div>

            {/* BOTTOM CARD: Location list - Border Radius Reduced (rounded-lg) */}
            <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-md space-y-4">
                
                {/* Header and Search Strip */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-4">
                    <h3 className="text-sm font-black !text-[#0B1E43] uppercase tracking-wider flex items-center gap-2">
                        <Globe size={16} className="text-[#0066FF]" /> Master Location List
                    </h3>

                    {/* Global Database Search Bar */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black !text-black uppercase tracking-wider">Search:</span>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search code, name, country..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white border border-slate-300 rounded-md pl-3 pr-8 py-2 text-base font-bold !text-black focus:outline-none focus:border-[#0066FF] shadow-sm w-64 transition-all"
                            />
                            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 !text-slate-500 font-bold text-xs uppercase tracking-wider flex flex-col items-center gap-2 justify-center">
                        <Loader2 className="animate-spin text-[#0066FF]" size={20} />
                        <span>Loading locations...</span>
                    </div>
                ) : locations.length === 0 ? (
                    <div className="text-center py-10 !text-slate-400 font-bold text-xs">No locations found matching your search.</div>
                ) : (
                    <div className="space-y-4">
                        <div className="overflow-x-auto rounded-md border border-slate-200/80">
                            <table className="w-full text-left text-base !text-black border-collapse">
                                <thead className="bg-[#f4f7fc] !text-[#0B1E43] text-sm font-black uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        {/* Removed '#' column */}
                                        <th className="p-4 !text-[#0B1E43]">Type</th>
                                        <th className="p-4 !text-[#0B1E43]">Code</th>
                                        <th className="p-4 !text-[#0B1E43]">Name(ICAO)</th>
                                        <th className="p-4 !text-[#0B1E43]">Country(Code)</th>
                                        <th className="p-4 !text-[#0B1E43]">City</th>
                                        <th className="p-4 !text-[#0B1E43]">State</th>
                                        <th className="p-4 text-center !text-[#0B1E43] w-32">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {locations.map((loc, idx) => {
                                        return (
                                            <tr key={loc._id} className="hover:bg-slate-50/50 transition-colors">
                                                {/* Removed '#' cell */}
                                                <td className="p-4 font-black !text-slate-700 lowercase text-base">
                                                    {loc.type === 'Land Port' ? 'land' : loc.type === 'Warehouse' ? 'warehouse' : loc.type.toLowerCase()}
                                                </td>
                                                <td className="p-4 font-black !text-black uppercase text-base">
                                                    {loc.code}
                                                </td>
                                                <td className="p-4 font-black !text-slate-900 max-w-[250px] truncate text-base" title={loc.name}>
                                                    {loc.name} {loc.icao ? `(${loc.icao})` : ''}
                                                </td>
                                                <td className="p-4 font-black !text-slate-900 text-base">
                                                    {loc.country}({loc.countryCode})
                                                </td>
                                                <td className="p-4 font-black !text-slate-700 text-base">
                                                    {loc.city}
                                                </td>
                                                <td className="p-4 font-black !text-slate-700 text-base">
                                                    {loc.state}
                                                </td>
                                                <td className="p-4 text-base">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenEditModal(loc)}
                                                            className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-sm font-black px-4 py-2 rounded-md transition-all cursor-pointer shadow-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(loc._id)}
                                                            className="bg-red-500 hover:bg-red-600 text-white text-sm font-black p-2 rounded-md transition-all cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 gap-4">
                            <span className="text-sm font-black !text-slate-900">
                                Showing {showingFrom} to {showingTo} of {totalLocations.toLocaleString()} entries
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                
                                <div className="flex items-center gap-1">
                                    {renderPageNumbers()}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* EDIT MASTER LOCATION MODAL POPUP */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg shadow-[0_24px_60px_rgba(11,30,67,0.15)] border border-slate-200 overflow-hidden flex flex-col">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-black !text-[#0B1E43] tracking-tight">Edit Master Location</h3>
                                <p className="text-[10px] !text-slate-450 font-bold uppercase tracking-wider mt-0.5">Modify port details below</p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-black !text-black uppercase tracking-wider">Select Type</label>
                                <select
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value)}
                                    className="w-full bg-white border border-slate-350 rounded-md px-3 py-2.5 text-base font-black !text-black focus:outline-none focus:border-[#0066FF]"
                                >
                                    {LOCATION_TYPES.map((t) => (
                                        <option key={t} value={t} className="!text-black text-base">{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-black !text-black uppercase tracking-wider">Code (IATA/Port)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. DEL"
                                        value={editCode}
                                        onChange={(e) => setEditCode(e.target.value)}
                                        className="w-full bg-white border border-slate-355 rounded-md px-4 py-2.5 text-base font-black !text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] uppercase"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-black !text-black uppercase tracking-wider">ICAO Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. VIDP"
                                        value={editIcao}
                                        onChange={(e) => setEditIcao(e.target.value)}
                                        className="w-full bg-white border border-slate-355 rounded-md px-4 py-2.5 text-base font-black !text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] uppercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-black !text-black uppercase tracking-wider">Location Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Indira Gandhi Intl Airport"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-white border border-slate-355 rounded-md px-4 py-2.5 text-base font-black !text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF]"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-black !text-black uppercase tracking-wider">Select Country</label>
                                <select
                                    value={editCountryIndex}
                                    onChange={(e) => setEditCountryIndex(Number(e.target.value))}
                                    className="w-full bg-white border border-slate-355 rounded-md px-3 py-2.5 text-base font-black !text-black focus:outline-none focus:border-[#0066FF]"
                                >
                                    {COUNTRIES.map((c, idx) => (
                                        <option key={c.code} value={idx} className="!text-black text-base">{c.name} ({c.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-black !text-black uppercase tracking-wider">City</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. New Delhi"
                                        value={editCity}
                                        onChange={(e) => setEditCity(e.target.value)}
                                        className="w-full bg-white border border-slate-355 rounded-md px-4 py-2.5 text-base font-black !text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF]"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-black !text-black uppercase tracking-wider">State</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Delhi"
                                        value={editState}
                                        onChange={(e) => setEditState(e.target.value)}
                                        className="w-full bg-white border border-slate-355 rounded-md px-4 py-2.5 text-base font-black !text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF]"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-md cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-sm font-black px-5 py-2.5 rounded-md cursor-pointer shadow-md shadow-[#0066FF]/25"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationMaster;
