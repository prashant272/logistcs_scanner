import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, Globe } from 'lucide-react';
import { COUNTRIES } from '../../utils/countries';

const MultiCountrySelect = ({ 
  selectedCountries, // Array of strings e.g., ['India', 'United States']
  onChange, // Function to call when selection changes
  error,
  label = "Select Countries",
  required = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleCountry = (countryName) => {
    let newSelection = [...(selectedCountries || [])];
    
    if (countryName === 'Worldwide') {
        if (newSelection.includes('Worldwide')) {
            newSelection = [];
        } else {
            newSelection = ['Worldwide'];
        }
    } else {
        // If selecting a specific country, remove 'Worldwide' if it's there
        newSelection = newSelection.filter(c => c !== 'Worldwide');
        
        if (newSelection.includes(countryName)) {
            newSelection = newSelection.filter(c => c !== countryName);
        } else {
            newSelection.push(countryName);
        }
    }
    
    onChange(newSelection);
  };

  const removeCountry = (e, countryName) => {
    e.stopPropagation();
    const newSelection = (selectedCountries || []).filter(c => c !== countryName);
    onChange(newSelection);
  };

  const allOptions = [{ name: 'Worldwide', code: 'ALL' }, ...COUNTRIES];

  const filteredCountries = allOptions.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3 w-full" ref={dropdownRef}>
      <div className="relative group">
        <label className="block text-xs font-bold !text-slate-900 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Dropdown Trigger */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl bg-white text-slate-800 focus-within:border-[#00b2fe] focus-within:ring-2 focus-within:ring-[#00b2fe]/10 transition-all min-h-[44px] cursor-pointer ${
            error ? 'border-red-300' : 'border-slate-200'
          }`}
        >
          <div className="flex flex-wrap gap-1.5 items-center flex-1">
            {(!selectedCountries || selectedCountries.length === 0) ? (
              <span className="text-sm font-medium text-slate-400 pl-1">Select Countries...</span>
            ) : (
              selectedCountries.map((country, idx) => (
                <span key={idx} className="flex items-center gap-1 bg-[#00b2fe]/10 text-[#00b2fe] px-2 py-0.5 rounded-md text-[10px] font-bold">
                  {country === 'Worldwide' && <Globe size={10} />}
                  {country}
                  <button type="button" onClick={(e) => removeCountry(e, country)} className="hover:bg-[#00b2fe]/20 p-0.5 rounded-full transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown size={16} className={`text-slate-400 ml-2 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col overflow-hidden max-h-72">
            <div className="p-2 border-b border-slate-100 flex items-center bg-slate-50">
              <Search size={14} className="text-slate-400 mr-2 ml-1" />
              <input
                type="text"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none placeholder:text-slate-400 py-1"
                autoFocus
              />
            </div>

            <ul className="overflow-y-auto flex-1 py-1 max-h-56">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, idx) => {
                  const isSelected = (selectedCountries || []).includes(country.name);
                  return (
                    <li
                      key={idx}
                      onClick={() => handleToggleCountry(country.name)}
                      className={`px-4 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-[#00b2fe]/5 text-[#00b2fe]' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-[#00b2fe] border-[#00b2fe]' : 'border-slate-300'}`}>
                          {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={country.name === 'Worldwide' ? 'text-blue-600 font-extrabold flex items-center gap-1' : ''}>
                          {country.name === 'Worldwide' && <Globe size={12} />} {country.name}
                        </span>
                      </div>
                    </li>
                  )
                })
              ) : (
                <li className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                  No matching countries found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiCountrySelect;
