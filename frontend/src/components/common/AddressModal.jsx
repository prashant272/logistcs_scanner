import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddressModal = ({ isOpen, onClose, onSave, type, prefillPincode }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        facilityName: '',
        contactName: '',
        mobile: '',
        email: '',
        addressLine: '',
        pincode: prefillPincode || '',
        city: '',
        state: 'Delhi', // mock default
        country: 'India',
        slot: '09:00 AM - 06:00 PM',
        workingDays: {
            Monday: true, Tuesday: true, Wednesday: true, 
            Thursday: true, Friday: true, Saturday: true, Sunday: false
        },
        sameAsPickup: false,
        gstin: '',
        pan: '',
        storeCode: ''
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDayToggle = (day) => {
        setFormData(prev => ({
            ...prev,
            workingDays: {
                ...prev.workingDays,
                [day]: !prev.workingDays[day]
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (type === 'billing') {
            if (!formData.gstin && !formData.pan) {
                alert('Either GSTIN or PAN must be provided for Billing Address.');
                return;
            }
            if (!formData.facilityName || !formData.contactName || !formData.addressLine || !formData.mobile || !formData.pincode || !formData.city || !formData.state) {
                alert('Please fill all mandatory fields (Company Name, Contact Person, Mobile, Address, Pincode, State, City).');
                return;
            }
        } else {
            if(!formData.facilityName || !formData.addressLine || !formData.mobile) {
                alert('Please fill mandatory fields (Facility Name, Address, Mobile).');
                return;
            }
        }

        onSave({ ...formData, type });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative" style={{ color: '#334155' }}>
                <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-[#0B1E43]">
                        {type === 'billing' ? 'Add Billing Address' : `Add ${type === 'pickup' ? 'Pickup' : 'Drop'} Address Details`}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {type === 'billing' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1">Consignee GST Number</label>
                                    <input type="text" name="gstin" placeholder="Enter GST number" value={formData.gstin} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <p className="text-[10px] text-slate-400 mt-1">Optional if PAN is entered</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1">Consignee PAN Number</label>
                                    <input type="text" name="pan" placeholder="Enter PAN number" value={formData.pan} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <p className="text-[10px] text-slate-400 mt-1">Optional if GST is entered</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Store Code (Optional)</label>
                                <input type="text" name="storeCode" placeholder="Enter store code" value={formData.storeCode} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </>
                    )}

                    {/* Facility & Contact */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">{type === 'billing' ? 'Company Name *' : 'Facility Name *'}</label>
                        <input type="text" name="facilityName" placeholder="Enter name" value={formData.facilityName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <p className="text-[11px] text-slate-400 mt-1">Please note that facility name cannot be edited after saving</p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">{type === 'billing' ? 'Contact Person Name *' : 'Contact Person Name (Optional)'}</label>
                        <input type="text" name="contactName" placeholder="Enter contact person name" value={formData.contactName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700 block mb-1">{type === 'billing' ? 'Mobile Number *' : 'Pickup Location Contact *'}</label>
                            <div className="flex">
                                <span className="bg-slate-50 border border-slate-300 border-r-0 rounded-l-lg p-3 text-sm text-slate-500">+91</span>
                                <input type="tel" name="mobile" placeholder="Enter mobile number" value={formData.mobile} onChange={handleChange} className="w-full border border-slate-300 rounded-r-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700 block mb-1">Email (Optional)</label>
                            <input type="email" name="email" placeholder="Enter email ID" value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    {/* Address details */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Address Line *</label>
                        <input type="text" name="addressLine" placeholder="Enter address" value={formData.addressLine} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700 block mb-1">Pincode *</label>
                            <input 
                                type="text" 
                                name="pincode" 
                                placeholder="Enter pincode" 
                                value={formData.pincode} 
                                onChange={handleChange} 
                                className={`w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${type !== 'billing' ? 'bg-slate-50' : 'bg-white'}`}
                                readOnly={type !== 'billing'} 
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700 block mb-1">City</label>
                            <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700 block mb-1">State, India</label>
                            <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    {type === 'billing' && (
                        <div>
                            <label className="text-sm font-semibold text-slate-700 block mb-1">Country</label>
                            <input type="text" name="country" value={formData.country} readOnly className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none bg-slate-50" />
                        </div>
                    )}

                    {type !== 'billing' && (
                        <>
                            {/* Slots and Days */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Default Pickup Slot</label>
                                <select name="slot" value={formData.slot} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option>09:00 AM - 06:00 PM</option>
                                    <option>10:00 AM - 02:00 PM</option>
                                    <option>02:00 PM - 06:00 PM</option>
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">Pickup requests for this location will be scheduled for this slot by default.</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 block mb-3">Working Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(formData.workingDays).map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => handleDayToggle(day)}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                                                formData.workingDays[day] 
                                                ? 'bg-blue-50 border-blue-600 text-blue-700' 
                                                : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Return Details */}
                    {type === 'pickup' && (
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 mb-3">Return Details</h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="sameAsPickup" checked={formData.sameAsPickup} onChange={handleChange} className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
                                <span className="text-sm text-slate-700 font-medium">Return address is the same as the pickup address</span>
                            </label>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-slate-100 p-5 flex justify-end gap-3 z-10">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-lg font-bold text-slate-600 border border-slate-300 hover:bg-slate-50">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 rounded-lg font-bold text-white bg-[#0B1E43] hover:bg-[#1a2d55]">Save Address</button>
                </div>
            </div>
        </div>
    );
};

export default AddressModal;
