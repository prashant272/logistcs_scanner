import React, { useState } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';

const VendorInvoiceUploadTab = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploaded(true);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-6">
      <div>
        <h2 className="text-base font-black text-[#0B1E43] tracking-tight">Upload Invoice</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Submit shipment invoices for clearing</p>
      </div>

      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
          dragActive ? 'border-[#0066FF] bg-[#0066FF]/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        }`}
      >
        {uploaded ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center shadow-inner">
              <CheckCircle size={32} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Invoice Uploaded Successfully!</h3>
            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">Our audit team will verify and clear your invoice within 24 hours.</p>
            <button onClick={() => setUploaded(false)} className="text-[#0066FF] text-xs font-bold hover:underline mt-2 cursor-pointer">
              Upload another invoice
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-[#0066FF]/8 text-[#0066FF] flex items-center justify-center shadow-sm">
              <Upload size={28} />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-sm">Drag & drop your invoice PDF here</p>
              <p className="text-xs text-slate-450 font-bold mt-1">or click to browse local files (Max size: 5MB)</p>
            </div>
            <input type="file" className="hidden" id="invoice-file" onChange={() => setUploaded(true)} />
            <label htmlFor="invoice-file" className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-sm shadow-[#0066FF]/10 mt-2">
              Select PDF File
            </label>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorInvoiceUploadTab;
