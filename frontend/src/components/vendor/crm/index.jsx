import React, { useState, useEffect } from 'react';
import { User, Plane, Truck, Warehouse, Package, Ship } from 'lucide-react';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

import CrmHeader from './CrmHeader';
import CrmFilters from './CrmFilters';
import CrmLeadCard from './CrmLeadCard';
import CrmDetailModal from './CrmDetailModal';
import CrmContactModal from './CrmContactModal';

const statuses = ['New', 'Contacted', 'Negotiating', 'Closed-Won', 'Closed-Lost'];

const VendorCRMTab = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedContactLead, setSelectedContactLead] = useState(null);
    const [newNote, setNewNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Filters State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [modeFilter, setModeFilter] = useState('All Transport Mode');
    const [regionFilter, setRegionFilter] = useState('All Regions');
    const [sortFilter, setSortFilter] = useState('Sort by: Newest');

    const fetchLeads = async () => {
        try {
            const query = new URLSearchParams();
            if (searchQuery) query.append('search', searchQuery);
            if (statusFilter !== 'All Status') query.append('status', statusFilter);
            if (modeFilter !== 'All Transport Mode') query.append('mode', modeFilter);
            if (regionFilter !== 'All Regions') query.append('region', regionFilter);
            if (sortFilter !== 'Sort by: Newest') query.append('sort', sortFilter);

            const res = await api.get(`/crm/vendor?${query.toString()}`);
            if (res.data.success) {
                setLeads(res.data.leads);
            }
        } catch (error) {
            console.error('Failed to fetch CRM leads', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [searchQuery, statusFilter, modeFilter, regionFilter, sortFilter]);

    const handleUpdateStatus = async (leadId, newStatus) => {
        setIsUpdating(true);
        try {
            const res = await api.put(`/crm/${leadId}/status`, { status: newStatus });
            if (res.data.success) {
                setLeads(leads.map(l => l._id === leadId ? res.data.lead : l));
                if (selectedLead && selectedLead._id === leadId) {
                    setSelectedLead(res.data.lead);
                }
                if (selectedContactLead && selectedContactLead._id === leadId) {
                    setSelectedContactLead(res.data.lead);
                }
            }
        } catch (error) {
            console.error('Failed to update status', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddNote = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        
        const leadTarget = selectedLead || selectedContactLead;
        if (!newNote.trim() || !leadTarget) return;
        
        setIsUpdating(true);
        try {
            const res = await api.post(`/crm/${leadTarget._id}/note`, { note: newNote });
            if (res.data.success) {
                setLeads(leads.map(l => l._id === leadTarget._id ? res.data.lead : l));
                if (selectedLead) setSelectedLead(res.data.lead);
                if (selectedContactLead) setSelectedContactLead(res.data.lead);
                setNewNote('');
            }
        } catch (error) {
            console.error('Failed to add note', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleScheduleFollowUp = async (leadId, dateObj) => {
        setIsUpdating(true);
        try {
            const res = await api.put(`/crm/${leadId}/followup`, { followUpDate: dateObj });
            if (res.data.success) {
                setLeads(leads.map(l => l._id === leadId ? res.data.lead : l));
                if (selectedContactLead && selectedContactLead._id === leadId) {
                    setSelectedContactLead(res.data.lead);
                }
            }
        } catch (error) {
            console.error('Failed to schedule follow up', error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Helper functions passed to children
    const getStatusColor = (status) => {
        switch(status) {
            case 'New': return 'bg-blue-100 text-blue-600';
            case 'Contacted': return 'bg-purple-100 text-purple-600';
            case 'Negotiating': return 'bg-amber-100 text-amber-600';
            case 'Closed-Won': return 'bg-emerald-100 text-emerald-600';
            case 'Closed-Lost': return 'bg-rose-100 text-rose-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getModeIcon = (mode, size=24) => {
        const m = (mode || '').toLowerCase();
        if (m === 'air') return <Plane size={size} />;
        if (m === 'land') return <Truck size={size} />;
        if (m === 'warehouse') return <Warehouse size={size} />;
        if (m === 'cha') return <Package size={size} />;
        return <Ship size={size} />;
    };

    const getModeBg = (mode) => {
        const m = (mode || '').toLowerCase();
        if (m === 'air') return 'bg-emerald-50 text-emerald-600';
        if (m === 'land') return 'bg-blue-50 text-blue-600';
        return 'bg-indigo-50 text-indigo-600';
    };

    const formatDateStr = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full pt-0 pb-4">
            <CrmHeader leadsCount={leads.length} />

            <CrmFilters 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                modeFilter={modeFilter}
                setModeFilter={setModeFilter}
                regionFilter={regionFilter}
                setRegionFilter={setRegionFilter}
                sortFilter={sortFilter}
                setSortFilter={setSortFilter}
                statuses={statuses}
            />

            {/* Leads List */}
            <div className="overflow-x-auto hide-scrollbar pb-4">
                <div className="min-w-[950px] space-y-4">
                {leads.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                        <User size={48} className="mx-auto mb-4 opacity-20 text-slate-400" />
                        <h3 className="text-xl font-bold text-[#0B1E43] mb-2">No leads found</h3>
                        <p className="text-slate-500 font-medium">There are no leads matching your current filters.</p>
                    </div>
                ) : (
                    leads.map(lead => (
                        <CrmLeadCard 
                            key={lead._id}
                            lead={lead}
                            onViewClick={setSelectedLead}
                            onContactClick={setSelectedContactLead}
                            getModeIcon={getModeIcon}
                            getModeBg={getModeBg}
                            getStatusColor={getStatusColor}
                            formatDateStr={formatDateStr}
                        />
                    ))
                )}
                </div>
            </div>

            <CrmDetailModal 
                selectedLead={selectedLead}
                setSelectedLead={setSelectedLead}
                statuses={statuses}
                isUpdating={isUpdating}
                handleUpdateStatus={handleUpdateStatus}
                getStatusColor={getStatusColor}
                getModeBg={getModeBg}
                getModeIcon={getModeIcon}
                onContactClick={setSelectedContactLead}
                newNote={newNote}
                setNewNote={setNewNote}
                handleAddNote={handleAddNote}
            />

            <CrmContactModal 
                selectedContactLead={selectedContactLead}
                setSelectedContactLead={setSelectedContactLead}
                statuses={statuses}
                isUpdating={isUpdating}
                handleUpdateStatus={handleUpdateStatus}
                newNote={newNote}
                setNewNote={setNewNote}
                handleAddNote={handleAddNote}
                handleScheduleFollowUp={handleScheduleFollowUp}
            />

            <style jsx global>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slideInRight {
                    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default VendorCRMTab;
