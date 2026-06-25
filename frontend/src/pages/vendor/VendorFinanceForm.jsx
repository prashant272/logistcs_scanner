import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, Building, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const VendorFinanceForm = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const defaultFormState = {
        director1: { name: '', email: '', mobile: '', gender: '', city: '', state: '', address: '', aadharFile: '', panFile: '' },
        personalDetails: {
            panName: { salutation: 'Mr.', firstName: '', middleName: '', lastName: '' },
            fatherName: { salutation: 'Mr.', firstName: '', middleName: '', lastName: '' },
            motherName: { salutation: 'Mrs.', firstName: '', middleName: '', lastName: '' },
            nationality: 'India',
            residentialStatus: ''
        },
        director2: { name: '', mobile: '', designation: '', dob: '', workTenure: '', email: '', aadharFile: '', panFile: '' },
        businessDetails: {
            businessType: '', businessAge: '', gstRegistered: '', msmeRegistered: '', yearlySales: '',
            officePhotoFile: '', bankStatementFile: '', latestITRFile: '', electricityBillFile: '', gstCertificateFile: '', companyPanFile: '', directorPhotoFile: ''
        }
    };

    const [formData, setFormData] = useState(defaultFormState);

    useEffect(() => {
        if (user) {
            setFormData(prev => {
                const nameParts = (user.name || '').trim().split(/\s+/);
                const firstName = user.firstName || nameParts[0] || '';
                const lastName = user.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');
                const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

                return {
                    ...prev,
                    director1: {
                        ...prev.director1,
                        name: user.name || prev.director1.name,
                        email: user.email || prev.director1.email,
                        mobile: user.phone || prev.director1.mobile,
                        city: user.city || prev.director1.city,
                        state: user.state || prev.director1.state,
                        address: user.address || prev.director1.address
                    },
                    personalDetails: {
                        ...prev.personalDetails,
                        panName: {
                            salutation: prev.personalDetails.panName.salutation,
                            firstName: firstName || prev.personalDetails.panName.firstName,
                            middleName: middleName || prev.personalDetails.panName.middleName,
                            lastName: lastName || prev.personalDetails.panName.lastName
                        }
                    },
                    businessDetails: {
                        ...prev.businessDetails,
                        businessAge: user.companyAge || prev.businessDetails.businessAge,
                        gstRegistered: user.gst ? 'Yes' : prev.businessDetails.gstRegistered
                    }
                };
            });
        }
    }, [user]);



    const handleFileUpload = async (e, section, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataPayload = new FormData();
        formDataPayload.append('file', file);

        try {
            const token = localStorage.getItem('userToken');
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/upload`, formDataPayload, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            
            // Update state with uploaded URL
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: data.url
                }
            }));
        } catch (err) {
            console.error('File upload failed:', err);
            alert('File upload failed');
        }
    };

    const handleNestedChange = (section, subsection, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [subsection]: {
                    ...prev[section][subsection],
                    [field]: value
                }
            }
        }));
    };

    const handleChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setError('');
            const token = localStorage.getItem('userToken');
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/finance`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Finance application submitted successfully!');
            setFormData(defaultFormState); // reset form
        } catch (err) {
            console.error('Submission failed:', err);
            setError(err.response?.data?.message || 'Failed to submit application.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">KYC / Finance Application</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Submit your details for financial approval</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Director Information */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-[#0B1E43] flex items-center gap-2 border-b border-slate-100 pb-3">
                        <UserIcon className="text-blue-600" size={20} />
                        Director, Partner, Proprietor Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Name *</label>
                            <input type="text" required value={formData.director1.name} onChange={e => handleChange('director1', 'name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Email *</label>
                            <input type="email" required value={formData.director1.email} onChange={e => handleChange('director1', 'email', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Mobile *</label>
                            <input type="text" required value={formData.director1.mobile} onChange={e => handleChange('director1', 'mobile', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Gender</label>
                            <select value={formData.director1.gender} onChange={e => handleChange('director1', 'gender', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none">
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">City</label>
                            <input type="text" value={formData.director1.city} onChange={e => handleChange('director1', 'city', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">State</label>
                            <input type="text" value={formData.director1.state} onChange={e => handleChange('director1', 'state', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                        </div>
                        <div className="md:col-span-3 space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Address</label>
                            <textarea value={formData.director1.address} onChange={e => handleChange('director1', 'address', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none h-20"></textarea>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Aadhar Card</label>
                            <input type="file" onChange={e => handleFileUpload(e, 'director1', 'aadharFile')} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            {formData.director1.aadharFile && <p className="text-[10px] text-green-600 font-bold mt-1">Uploaded</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Pan Card</label>
                            <input type="file" onChange={e => handleFileUpload(e, 'director1', 'panFile')} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            {formData.director1.panFile && <p className="text-[10px] text-green-600 font-bold mt-1">Uploaded</p>}
                        </div>
                    </div>
                </div>

                {/* 2. Personal Details */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-[#0B1E43] border-b border-slate-100 pb-3">Personal Details</h3>
                    
                    {/* Name As Per PAN */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Name As Per Pan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select value={formData.personalDetails.panName.salutation} onChange={e => handleNestedChange('personalDetails', 'panName', 'salutation', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none">
                                <option value="Mr.">Mr.</option><option value="Mrs.">Mrs.</option><option value="Ms.">Ms.</option>
                            </select>
                            <input type="text" placeholder="First Name *" value={formData.personalDetails.panName.firstName} onChange={e => handleNestedChange('personalDetails', 'panName', 'firstName', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" required />
                            <input type="text" placeholder="Middle Name" value={formData.personalDetails.panName.middleName} onChange={e => handleNestedChange('personalDetails', 'panName', 'middleName', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                            <input type="text" placeholder="Last Name" value={formData.personalDetails.panName.lastName} onChange={e => handleNestedChange('personalDetails', 'panName', 'lastName', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                        </div>
                    </div>
                    {/* Father Name */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Father Name</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select value={formData.personalDetails.fatherName.salutation} onChange={e => handleNestedChange('personalDetails', 'fatherName', 'salutation', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none">
                                <option value="Mr.">Mr.</option>
                            </select>
                            <input type="text" placeholder="First Name" value={formData.personalDetails.fatherName.firstName} onChange={e => handleNestedChange('personalDetails', 'fatherName', 'firstName', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                            <input type="text" placeholder="Middle Name" value={formData.personalDetails.fatherName.middleName} onChange={e => handleNestedChange('personalDetails', 'fatherName', 'middleName', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                            <input type="text" placeholder="Last Name" value={formData.personalDetails.fatherName.lastName} onChange={e => handleNestedChange('personalDetails', 'fatherName', 'lastName', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                        </div>
                    </div>
                    {/* Mother Name */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Mother Name</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select value={formData.personalDetails.motherName.salutation} onChange={e => handleNestedChange('personalDetails', 'motherName', 'salutation', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none">
                                <option value="Mrs.">Mrs.</option>
                            </select>
                            <input type="text" placeholder="First Name" value={formData.personalDetails.motherName.firstName} onChange={e => handleNestedChange('personalDetails', 'motherName', 'firstName', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                            <input type="text" placeholder="Middle Name" value={formData.personalDetails.motherName.middleName} onChange={e => handleNestedChange('personalDetails', 'motherName', 'middleName', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                            <input type="text" placeholder="Last Name" value={formData.personalDetails.motherName.lastName} onChange={e => handleNestedChange('personalDetails', 'motherName', 'lastName', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Nationality</label>
                            <input type="text" value={formData.personalDetails.nationality} onChange={e => handleNestedChange('personalDetails', null, 'nationality', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Residential Status</label>
                            <input type="text" value={formData.personalDetails.residentialStatus} onChange={e => handleNestedChange('personalDetails', null, 'residentialStatus', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                        </div>
                    </div>
                </div>

                {/* 3. Second Director */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-[#0B1E43] border-b border-slate-100 pb-3">Second Director, Accounts, Finance, Authorized Signatory</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Name</label>
                            <input type="text" value={formData.director2.name} onChange={e => handleChange('director2', 'name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Mobile</label>
                            <input type="text" value={formData.director2.mobile} onChange={e => handleChange('director2', 'mobile', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Designation</label>
                            <input type="text" value={formData.director2.designation} onChange={e => handleChange('director2', 'designation', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">DOB</label>
                            <input type="date" value={formData.director2.dob} onChange={e => handleChange('director2', 'dob', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Work Tenure</label>
                            <input type="text" value={formData.director2.workTenure} onChange={e => handleChange('director2', 'workTenure', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Email</label>
                            <input type="email" value={formData.director2.email} onChange={e => handleChange('director2', 'email', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Aadhar Card</label>
                            <input type="file" onChange={e => handleFileUpload(e, 'director2', 'aadharFile')} className="w-full text-sm text-slate-500 file:bg-blue-50 file:text-blue-700 file:border-0 file:py-2 file:px-4 file:rounded-xl" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Pan Card</label>
                            <input type="file" onChange={e => handleFileUpload(e, 'director2', 'panFile')} className="w-full text-sm text-slate-500 file:bg-blue-50 file:text-blue-700 file:border-0 file:py-2 file:px-4 file:rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* 4. Business & Documents */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-[#0B1E43] flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Building className="text-blue-600" size={20} />
                        Logistic Financer Document
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Business Type</label>
                            <input type="text" value={formData.businessDetails.businessType} onChange={e => handleChange('businessDetails', 'businessType', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">How Old is your business?</label>
                            <input type="text" value={formData.businessDetails.businessAge} onChange={e => handleChange('businessDetails', 'businessAge', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Is business GST registered?</label>
                            <select value={formData.businessDetails.gstRegistered} onChange={e => handleChange('businessDetails', 'gstRegistered', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                                <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Is MSME / UDHYAM registered?</label>
                            <select value={formData.businessDetails.msmeRegistered} onChange={e => handleChange('businessDetails', 'msmeRegistered', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                                <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Yearly Sales?</label>
                            <input type="text" value={formData.businessDetails.yearlySales} onChange={e => handleChange('businessDetails', 'yearlySales', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                        </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-700 mt-6 mb-3">Upload Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { label: 'Office Premises with Board Photo', key: 'officePhotoFile' },
                            { label: 'Bank Statement for KYC Purpose', key: 'bankStatementFile' },
                            { label: 'Latest ITR', key: 'latestITRFile' },
                            { label: 'Electricity bill', key: 'electricityBillFile' },
                            { label: 'GST Certificate', key: 'gstCertificateFile' },
                            { label: 'Company Pan Card', key: 'companyPanFile' },
                            { label: 'Director Photo', key: 'directorPhotoFile' }
                        ].map(doc => (
                            <div key={doc.key} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-800">{doc.label}</p>
                                    <input type="file" onChange={e => handleFileUpload(e, 'businessDetails', doc.key)} className="mt-2 text-xs text-slate-500 w-full" />
                                </div>
                                {formData.businessDetails[doc.key] && <CheckCircle size={20} className="text-green-500 shrink-0 ml-2" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={submitting} className="bg-[#0066FF] hover:bg-[#0052cc] text-white px-8 py-3 rounded-2xl font-black tracking-widest uppercase transition-colors flex items-center gap-2">
                        {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VendorFinanceForm;
