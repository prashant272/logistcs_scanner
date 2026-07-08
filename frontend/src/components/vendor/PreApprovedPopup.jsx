import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Upload, X, Loader2, Phone, Mail } from 'lucide-react';

const PreApprovedPopup = () => {
    const { user, login } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const [uploading, setUploading] = useState(false);

    if (!user || user.role !== 'vendor' || user.verificationStatus !== 'Pre Approved' || user.uploadedDocument || !isVisible) {
        return null;
    }

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validating file type and size
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid PDF or Image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('File size should not exceed 5MB.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('userToken');
            
            // 1. Upload file to storage
            const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (!uploadRes.data.url) throw new Error("Upload failed to return URL");

            // 2. Submit the URL to backend
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/pre-approved-submit`, {
                documentUrl: uploadRes.data.url
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            alert('Document uploaded successfully. Our team will review it soon.');
            setIsVisible(false);
            
            // Refresh user data so status updates in Context
            if (data.user) {
                login(data.user, token);
            } else {
                window.location.reload();
            }

        } catch (error) {
            console.error('Error uploading document:', error);
            alert(error.response?.data?.message || 'Error uploading document.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-amber-50 p-6 flex flex-col items-center text-center border-b border-amber-100">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 mb-2">Action Required</h2>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        You have not uploaded any document. Your documents are not supported on our new portal, please upload document.
                    </p>
                </div>
                
                <div className="p-6 bg-white space-y-4">
                    <div className="flex flex-col gap-3 relative">
                        <label className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-black tracking-wider uppercase transition-all shadow-sm ${uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-blue-600/25'}`}>
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            {uploading ? 'Uploading...' : 'Upload Document'}
                            <input 
                                type="file" 
                                className="hidden" 
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </label>
                        
                        <button 
                            onClick={() => setIsVisible(false)}
                            disabled={uploading}
                            className="w-full px-6 py-3 rounded-xl text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            Ignore For Now
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 font-medium px-4">
                        * Ignoring this for 4 days will automatically move your account back to Pending status.
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="uppercase tracking-widest text-[10px] text-slate-400">For Support</span>
                        <div className="flex items-center gap-4">
                            <a href="tel:9266850036" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                                <Phone size={14} /> 9266850036
                            </a>
                            <a href="mailto:info@logisticsscanner.com" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                                <Mail size={14} /> info@logisticsscanner.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreApprovedPopup;
