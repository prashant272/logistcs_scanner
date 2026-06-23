import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, MapPin, DollarSign, Calendar, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { useLocations } from '../../services/LocationService';

const ViaPricingManagement = () => {
  const { getSuggestions } = useLocations();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Fields
  const [toLocation, setToLocation] = useState('');
  const [via, setVia] = useState('');
  const [ihcPrice, setIhcPrice] = useState('');
  const [standard20, setStandard20] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null); // 'to', 'via'
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/ihc`, config);
      setList(data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching via-pricing:', err);
      setError('Failed to fetch via pricing list');
      setLoading(false);
    }
  };

  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      // Suggest both Seaports and Airports for locations
      const locations = await getSuggestions(query, 'Seaport,Airport,Land Port');
      setSuggestions(locations || []);
    } catch (err) {
      console.error('Error getting location suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    let activeQuery = '';
    if (activeInput === 'to') activeQuery = toLocation;
    else if (activeInput === 'via') activeQuery = via;

    if (!activeQuery || activeQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const debounce = setTimeout(() => {
      fetchSuggestions(activeQuery);
    }, 300);

    return () => clearTimeout(debounce);
  }, [toLocation, via, activeInput]);

  const handleSelectSuggestion = (loc, inputType) => {
    const value = loc.code ? `${loc.city} (${loc.code})` : loc.city;
    if (inputType === 'to') {
      setToLocation(value);
    } else if (inputType === 'via') {
      setVia(value);
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  const renderSuggestions = (inputType) => {
    if (activeInput !== inputType || suggestions.length === 0) return null;

    return (
      <div className="absolute left-0 right-0 z-[9999] mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto w-full suggestions-scrollbar">
        {suggestions.map((loc) => (
          <div
            key={loc._id}
            onMouseDown={() => handleSelectSuggestion(loc, inputType)}
            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-left transition-colors flex items-center justify-between border-b border-slate-100 last:border-0"
          >
            <div className="flex flex-col min-w-0 pr-2 text-slate-700">
              <span className="text-xs font-bold truncate">
                {loc.city}, {loc.country}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {loc.name}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {loc.code && (
                <span className="bg-[#0066FF]/10 text-[#0066FF] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-[#0066FF]/20">
                  {loc.code}
                </span>
              )}
              <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                {loc.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!toLocation || !via || ihcPrice === '' || standard20 === '') {
      setFormError('Please fill in all the required fields');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = {
        toLocation,
        via,
        ihcPrice: Number(ihcPrice),
        standard20: Number(standard20)
      };

      if (editId) {
        const { data } = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/ihc/${editId}`, payload, config);
        setFormSuccess('Via pricing updated successfully!');
        setList(prev => prev.map(item => item._id === editId ? data : item));
        setEditId(null);
      } else {
        const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/ihc`, payload, config);
        setFormSuccess('Via pricing added successfully!');
        setList(prev => [data.data || data, ...prev]);
      }
      
      // Clear form fields
      setToLocation('');
      setVia('');
      setIhcPrice('');
      setStandard20('');
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save via pricing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setToLocation(item.destination || item.toLocation);
    setVia(item.viaPort || item.via);
    setIhcPrice(item.ihcPrice);
    setStandard20(item.standard20);
    setFormError('');
    setFormSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this via pricing entry?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/ihc/${id}`, config);
      setList(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error('Delete via-pricing failed:', err);
      alert('Failed to delete via pricing entry');
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = list.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(list.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Add Via Pricing</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Configure and list transit route options, IHC, and standard 20' rates</p>
        </div>
        <button 
          onClick={fetchList} 
          className="p-2.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-650 rounded-xl transition-all cursor-pointer shadow-sm"
          title="Refresh Data"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="space-y-6">
        {/* TOP ROW: Add Via Price Form Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.025)] space-y-5">
          <h3 className="text-xs font-black text-[#0B1E43] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Plus size={16} className="text-[#0066FF]" /> {editId ? 'Edit Via Price' : 'Add Via Price'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-100 text-red-650 p-3.5 rounded-xl text-xs font-bold">
                {formError}
              </div>
            )}
            
            {formSuccess && (
              <div className="bg-green-50 border border-green-100 text-green-650 p-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> {formSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              {/* To Location Field */}
              <div className="space-y-1 relative">
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">To Location</label>
                <input
                  type="text"
                  placeholder="Destination Port/City"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  onFocus={() => setActiveInput('to')}
                  onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all"
                  required
                />
                {renderSuggestions('to')}
              </div>

              {/* Via Field */}
              <div className="space-y-1 relative">
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">Via</label>
                <input
                  type="text"
                  placeholder="Transit Port"
                  value={via}
                  onChange={(e) => setVia(e.target.value)}
                  onFocus={() => setActiveInput('via')}
                  onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all"
                  required
                />
                {renderSuggestions('via')}
              </div>

              {/* IHC Price Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">IHC Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    placeholder="IHC Price"
                    value={ihcPrice}
                    onChange={(e) => setIhcPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    required
                  />
                </div>
              </div>

              {/* 20' Standard Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">20' Standard (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    placeholder="20' Std price"
                    value={standard20}
                    onChange={(e) => setStandard20(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    required
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-sm shadow-[#0066FF]/10 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  <Send size={13} /> {submitting ? 'Saving...' : editId ? 'Update' : 'Save'}
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(null);
                      setToLocation('');
                      setVia('');
                      setIhcPrice('');
                      setStandard20('');
                      setFormError('');
                      setFormSuccess('');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* BOTTOM ROW: Table displaying added Via Prices */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.025)] space-y-5">
          <h3 className="text-xs font-black text-[#0B1E43] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <DollarSign size={16} className="text-[#0066FF]" /> Configured Via Pricing
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-650 p-4 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0066FF] rounded-full animate-spin"></div>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold text-xs uppercase tracking-wider">
              No via pricing entries added yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-[#f8fafc] text-[#0B1E43] text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-4">To Location</th>
                    <th className="p-4">Via</th>
                    <th className="p-4">IHC Price</th>
                    <th className="p-4">20' Standard</th>
                    <th className="p-4">Date Configured</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-bold text-xs">
                  {currentItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-slate-800 uppercase font-black">{item.destination || item.toLocation}</td>
                      <td className="p-4 text-[#0066FF] uppercase font-black">{item.viaPort || item.via}</td>
                      <td className="p-4 text-[#0B1E43]">₹ {item.ihcPrice.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-[#0B1E43]">₹ {item.standard20?.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-slate-400 font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          <span>
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-500 hover:text-blue-700 font-bold transition-colors cursor-pointer"
                          title="Edit Entry"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && list.length > itemsPerPage && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, list.length)} of {list.length} entries
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer ${
                      currentPage === i + 1
                        ? 'bg-[#0B1E43] text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViaPricingManagement;
