import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VendorFinanceList from './VendorFinanceList';
import UploadInvoiceTab from '../../components/vendor/UploadInvoiceTab';
import WalletLedgerTab from '../../components/vendor/WalletLedgerTab';
import VendorPlanInvoicesTab from '../../components/vendor/VendorPlanInvoicesTab';
import { FileText, UploadCloud, Wallet } from 'lucide-react';

const VendorFinanceDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Parse tab from URL
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'finance_list';
    
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync tab changes with URL
    useEffect(() => {
        const currentTab = queryParams.get('tab');
        if (currentTab && currentTab !== activeTab) {
            setActiveTab(currentTab);
        }
    }, [location.search]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        const newParams = new URLSearchParams(location.search);
        newParams.set('tab', tab);
        navigate(`/vendor/finance-list?${newParams.toString()}`, { replace: true });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Finance Dashboard</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Manage your finance applications and wallet</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => handleTabChange('finance_list')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-black transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'finance_list'
                            ? 'border-[#0066FF] text-[#0066FF]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                    }`}
                >
                    <FileText size={16} /> Finance Applications
                </button>
                <button
                    onClick={() => handleTabChange('upload_invoice')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-black transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'upload_invoice'
                            ? 'border-[#0066FF] text-[#0066FF]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                    }`}
                >
                    <UploadCloud size={16} /> Upload Invoice
                </button>
                <button
                    onClick={() => handleTabChange('wallet_ledger')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-black transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'wallet_ledger'
                            ? 'border-[#0066FF] text-[#0066FF]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                    }`}
                >
                    <Wallet size={16} /> Wallet Passbook
                </button>
                <button
                    onClick={() => handleTabChange('plan_invoices')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-black transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'plan_invoices'
                            ? 'border-[#0066FF] text-[#0066FF]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                    }`}
                >
                    <FileText size={16} /> Subscription Invoices
                </button>
            </div>

            {/* Tab Content */}
            <div className="pt-2">
                {activeTab === 'finance_list' && <VendorFinanceList />}
                {activeTab === 'upload_invoice' && <UploadInvoiceTab />}
                {activeTab === 'wallet_ledger' && <WalletLedgerTab />}
                {activeTab === 'plan_invoices' && <VendorPlanInvoicesTab />}
            </div>
        </div>
    );
};

export default VendorFinanceDashboard;
