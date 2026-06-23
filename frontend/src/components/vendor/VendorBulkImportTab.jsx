import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, ChevronRight, AlertCircle, Database, Play, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';

const pricingFields = [
  { key: 'fromLocation', label: 'From Location', required: false, description: 'Origin city or port name' },
  { key: 'toLocation', label: 'To Location', required: false, description: 'Destination city or port name' },
  { key: 'type', label: 'Freight Type', required: false, description: 'Must be air, sea, land, warehouse, or cha' },
  { key: 'deliverySpeed', label: 'Delivery Speed (Days)', required: false, description: 'Transit time in days' },
  { key: 'validUntil', label: 'Valid Until (Expiry Date)', required: false, description: 'Date when pricing expires' },
  { key: 'price', label: 'Price / Rate', required: false, description: 'Numeric rate' },
  { key: 'currency', label: 'Currency', required: false, description: 'e.g. INR, USD, EUR' },
  { key: 'category', label: 'Category', required: false, description: 'domestic or international' },
  { key: 'airline', label: 'Airline', required: false, description: 'Carrier name (Air freight)' },
  { key: 'weightRange', label: 'Weight Range', required: false, description: 'e.g. 45+Kg, 100+Kg' },
  { key: 'truckLoad', label: 'Truck Load', required: false, description: 'FTL or LTL (Land freight)' },
  { key: 'vehicleType', label: 'Vehicle Type', required: false, description: 'e.g. 20ft Container, Box Truck' },
  { key: 'seaLoadType', label: 'Sea Load Type', required: false, description: 'LCL or FCL' },
  { key: 'fclStandard', label: 'FCL Standard', required: false, description: 'e.g. 20ft Standard, 40ft Standard' },
  { key: 'warehouseRateType', label: 'Warehouse Rate Type', required: false, description: 'e.g. Per Month, Per Day' },
  { key: 'warehouseStorageType', label: 'Warehouse Storage Type', required: false, description: 'e.g. General, Cold' },
  { key: 'chaServiceType', label: 'CHA Service Type', required: false, description: 'Air or Sea' },
  { key: 'chaCargoType', label: 'CHA Cargo Type', required: false, description: 'Import or Export' },
  { key: 'handlingType', label: 'Handling Type', required: false, description: 'e.g. General Cargo, Hazardous Goods' },
  { key: 'additionalServices', label: 'Additional Services', required: false, description: 'e.g. Packing, Insurance' }
];

const VendorBulkImportTab = () => {
  const [fileHeaders, setFileHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [mappings, setMappings] = useState({});
  const [step, setStep] = useState(1); // 1: Upload, 2: Map & Preview, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert sheet to json in array of arrays format
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data.length === 0) {
          setError("The uploaded file is empty");
          return;
        }

        const headers = data[0].map(h => String(h).trim());
        const rows = data.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));

        setFileHeaders(headers);
        setRawRows(rows);

        // Auto-match headers based on similarity
        const initialMappings = {};
        pricingFields.forEach(field => {
          const match = headers.find(h => 
            h.toLowerCase() === field.key.toLowerCase() ||
            h.toLowerCase() === field.label.toLowerCase() ||
            h.toLowerCase().replace(/[^a-z0-9]/g, '') === field.key.toLowerCase()
          );
          if (match) {
            initialMappings[field.key] = match;
          }
        });

        setMappings(initialMappings);
        setStep(2);
      } catch (err) {
        console.error("Excel read error:", err);
        setError("Could not parse file. Please upload a valid CSV or Excel spreadsheet.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingChange = (fieldKey, headerValue) => {
    setMappings(prev => ({
      ...prev,
      [fieldKey]: headerValue || undefined
    }));
  };

  // Convert raw row array to target object using mappings
  const getMappedRow = (row) => {
    const mapped = {};
    pricingFields.forEach(field => {
      const headerName = mappings[field.key];
      if (headerName) {
        const index = fileHeaders.indexOf(headerName);
        if (index !== -1 && row[index] !== undefined && row[index] !== null) {
          mapped[field.key] = row[index];
        }
      }
    });
    return mapped;
  };

  // Format validUntil to date and validate values
  const processMappedData = () => {
    const validated = [];
    const errors = [];

    rawRows.forEach((row, idx) => {
      const rowData = getMappedRow(row);
      const rowNum = idx + 2; // 1-based index plus header

      // Safe fallback values if column is missing or unmapped
      const fromLocation = rowData.fromLocation ? String(rowData.fromLocation).trim() : 'Test Origin';
      const toLocation = rowData.toLocation ? String(rowData.toLocation).trim() : 'Test Destination';
      
      let type = rowData.type ? String(rowData.type).toLowerCase().trim() : 'air';
      const allowedTypes = ['air', 'sea', 'land', 'warehouse', 'cha'];
      if (!allowedTypes.includes(type)) {
        type = 'air'; // default fallback
      }

      const deliverySpeed = rowData.deliverySpeed ? String(rowData.deliverySpeed).trim() : '3-5';

      let priceVal = 0;
      if (rowData.price !== undefined && rowData.price !== null && !isNaN(Number(rowData.price))) {
        priceVal = Number(rowData.price);
      } else {
        priceVal = 100; // default rate fallback
      }

      let dateVal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now default
      if (rowData.validUntil) {
        let parsedDate;
        if (typeof rowData.validUntil === 'number') {
          parsedDate = new Date(Math.round((rowData.validUntil - 25569) * 86400 * 1000));
        } else {
          parsedDate = new Date(rowData.validUntil);
        }
        if (!isNaN(parsedDate.getTime())) {
          dateVal = parsedDate;
        }
      }

      validated.push({
        ...rowData,
        fromLocation,
        toLocation,
        type,
        deliverySpeed,
        price: priceVal,
        validUntil: dateVal.toISOString()
      });
    });

    return { validated, errors };
  };

  const handleImportSubmit = async () => {
    const { validated, errors } = processMappedData();
    
    if (errors.length > 0) {
      setError(errors.slice(0, 5).join(' | ') + (errors.length > 5 ? ` ...and ${errors.length - 5} more errors` : ''));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/pricing/bulk`, { entries: validated }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccessCount(res.data.count);
      setStep(3);
    } catch (err) {
      console.error("Bulk upload err:", err);
      setError(err.response?.data?.message || "Server error while bulk importing rates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-6 max-w-5xl mx-auto">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#0B1E43] tracking-tight">Bulk Import pricing</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Import freight rates in bulk via spreadsheet upload</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-bold flex items-start gap-2.5 shadow-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="leading-normal">{error}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD SPREADSHEET */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 hover:border-[#0066FF] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 transition-all hover:bg-slate-50/40">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shadow-sm">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-sm">Drag & drop your rate sheet here</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Accepts Excel (.xlsx, .xls) and CSV sheets</p>
            </div>
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              id="bulk-import-file" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <label htmlFor="bulk-import-file" className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer transition-all shadow-md shadow-[#0066FF]/10 mt-2">
              Select Spreadsheet File
            </label>
          </div>
          
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3">
            <h4 className="text-xs font-extrabold text-[#0B1E43] uppercase tracking-wider">Required columns in your spreadsheet:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-700 font-bold">
              {pricingFields.filter(f => f.required).map(f => (
                <div key={f.key} className="flex items-center gap-1.5 bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING & PREVIEW */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-sky-50/50 border border-sky-100 p-4 rounded-xl text-xs font-bold text-sky-800 flex items-center gap-2">
            <Database size={16} className="text-[#0066FF]" />
            <span>Successfully read file: <strong className="text-slate-800">{fileName}</strong>. Please map the columns below to your Pricing model.</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Column Mapping Form */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.015)]">
              <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider border-b border-slate-100 pb-3">Field Mapping Configuration</h3>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {pricingFields.map((field) => (
                  <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-slate-50 last:border-0">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-red-500 text-xs">*</span>}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal">{field.description}</p>
                    </div>
                    
                    <select
                      value={mappings[field.key] || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      className="bg-[#f4f7fc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0066FF] min-w-[180px] max-w-full"
                    >
                      <option value="">-- Ignore Field --</option>
                      {fileHeaders.map((header) => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Live Mapped Preview */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex flex-col">
              <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider border-b border-slate-100 pb-3">Live Preview (Top 5 rows)</h3>
              <div className="flex-grow overflow-x-auto">
                <table className="w-full text-left text-[11px] text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-800 font-black">
                      {pricingFields.filter(f => mappings[f.key]).map(f => (
                        <th key={f.key} className="p-2 uppercase tracking-wide">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rawRows.slice(0, 5).map((row, idx) => {
                      const data = getMappedRow(row);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          {pricingFields.filter(f => mappings[f.key]).map(f => (
                            <td key={f.key} className="p-2 font-bold truncate max-w-[120px]">
                              {f.key === 'validUntil' && data[f.key] ? (
                                typeof data[f.key] === 'number' ? (
                                  new Date(Math.round((data[f.key] - 25569) * 86400 * 1000)).toLocaleDateString()
                                ) : (
                                  String(data[f.key])
                                )
                              ) : (
                                String(data[f.key] || '')
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button 
              onClick={() => setStep(1)} 
              className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
            >
              Back to Upload
            </button>
            <button 
              onClick={handleImportSubmit}
              disabled={loading}
              className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black px-6 py-3 rounded-xl cursor-pointer transition-all shadow-md shadow-[#0066FF]/10 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play size={12} fill="white" />
                  <span>Import Pricing</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SUCCESS VIEW */}
      {step === 3 && (
        <div className="text-center py-12 space-y-5 animate-scaleUp max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-green-50 text-green-500 flex items-center justify-center shadow-inner mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 text-base">Bulk pricing Imported Successfully!</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Successfully matched and imported <strong className="text-[#0066FF]">{successCount}</strong> pricing records to your catalog. All records are active immediately.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <button 
              onClick={() => {
                setStep(1);
                setFileName('');
                setRawRows([]);
                setFileHeaders([]);
                setMappings({});
              }} 
              className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer"
            >
              Import More Rates
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorBulkImportTab;
