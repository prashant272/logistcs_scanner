import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Globe, Phone } from 'lucide-react';
import { COUNTRIES } from '../../utils/countries';

const CountrySelect = ({ 
  selectedCountry, 
  selectedPhoneCode, 
  onChange, 
  error,
  label = "Country",
  required = true,
  showCustomOthersInput = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customCountryName, setCustomCountryName] = useState('');
  const [customPhoneCode, setCustomPhoneCode] = useState('');
  
  const dropdownRef = useRef(null);

  // Determine if "Others" is active based on whether the country name is not in the list of standard names,
  // or if it was explicitly set to "Others", or if custom text fields are being used.
  const isStandardCountry = COUNTRIES.some(c => c.name !== 'Others' && c.name === selectedCountry);
  const isOthers = selectedCountry === 'Others' || (!isStandardCountry && selectedCountry !== '');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync custom inputs if parent resets or updates state from outside
  useEffect(() => {
    if (isOthers) {
      if (selectedCountry !== 'Others') {
        setCustomCountryName(selectedCountry);
      }
      setCustomPhoneCode(selectedPhoneCode);
    } else {
      setCustomCountryName('');
      setCustomPhoneCode('');
    }
  }, [selectedCountry, selectedPhoneCode, isOthers]);

  const handleSelectCountry = (country) => {
    setIsOpen(false);
    setSearchQuery('');
    if (country.name === 'Others') {
      onChange({ country: 'Others', phoneCode: '' });
    } else {
      onChange({ country: country.name, phoneCode: country.code });
    }
  };

  const handleCustomCountryChange = (e) => {
    const val = e.target.value;
    setCustomCountryName(val);
    onChange({ country: val, phoneCode: customPhoneCode });
  };

  const handleCustomPhoneCodeChange = (e) => {
    const val = e.target.value;
    setCustomPhoneCode(val);
    onChange({ country: customCountryName || 'Others', phoneCode: val });
  };

  // Filter countries by name or dialing code
  const filteredCountries = COUNTRIES.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  // Display value in the trigger button
  const displayVal = selectedCountry 
    ? (isOthers ? (customCountryName ? `${customCountryName} (${selectedPhoneCode || 'No Code'})` : 'Others') : `${selectedCountry} (${selectedPhoneCode})`)
    : 'Select Country';

  return (
    <div className="space-y-3 w-full" ref={dropdownRef}>
      <div className="relative group">
        <label className="block text-xs font-bold !text-slate-900 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl bg-white text-slate-800 font-medium text-sm focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all ${
            error ? 'border-red-300' : 'border-slate-200'
          }`}
        >
          <span className="truncate">{displayVal}</span>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col overflow-hidden max-h-72">
            {/* Search Input */}
            <div className="p-2 border-b border-slate-100 flex items-center bg-slate-50">
              <Search size={14} className="text-slate-400 mr-2 ml-1" />
              <input
                type="text"
                placeholder="Search country or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none placeholder:text-slate-400 py-1"
                autoFocus
              />
            </div>

            {/* List */}
            <ul className="overflow-y-auto flex-1 py-1 max-h-56">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectCountry(country)}
                    className={`px-4 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedCountry === country.name ? 'bg-[#00b2fe]/5 text-[#00b2fe]' : 'text-slate-700'
                    }`}
                  >
                    <span>{country.name}</span>
                    <span className="text-slate-400 font-bold">{country.code}</span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                  No matching countries found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Auxiliary Inputs for "Others" */}
      {isOthers && showCustomOthersInput && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl animate-fadeIn">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Globe size={11} /> Custom Country Name
            </label>
            <input
              type="text"
              required={required}
              placeholder="e.g. Costa Rica"
              value={customCountryName}
              onChange={handleCustomCountryChange}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00b2fe] transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Phone size={11} /> Custom Code
            </label>
            <input
              type="text"
              required={required}
              placeholder="e.g. +506"
              value={customPhoneCode}
              onChange={handleCustomPhoneCodeChange}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00b2fe] transition-all"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelect;
