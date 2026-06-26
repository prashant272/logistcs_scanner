import React, { useState } from 'react';
import VendorFinanceList from './VendorFinanceList';
import UploadInvoiceTab from '../../components/vendor/UploadInvoiceTab';
import WalletLedgerTab from '../../components/vendor/WalletLedgerTab';
import { FileText, UploadCloud, Wallet } from 'lucide-react';

const VendorFinanceDashboard = () => {
    const [activeTab, setActiveTab] = useState('finance_list');

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
                    onClick={() => setActiveTab('finance_list')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-black transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'finance_list'
                            ? 'border-[#0066FF] text-[#0066FF]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                    }`}
                >
                    <FileText size={16} /> Finance Applications
                </button>
                <button
                    onClick={() => setActiveTab('upload_invoice')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-black transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'upload_invoice'
                            ? 'border-[#0066FF] text-[#0066FF]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                    }`}
                >
                    <UploadCloud size={16} /> Upload Invoice
                </button>
                <button
                    onClick={() => setActiveTab('wallet_ledger')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-black transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'wallet_ledger'
                            ? 'border-[#0066FF] text-[#0066FF]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                    }`}
                >
                    <Wallet size={16} /> Wallet Passbook
                </button>
            </div>

            {/* Tab Content */}
            <div className="pt-2">
                {activeTab === 'finance_list' && <VendorFinanceList />}
                {activeTab === 'upload_invoice' && <UploadInvoiceTab />}
                {activeTab === 'wallet_ledger' && <WalletLedgerTab />}
            </div>
        </div>
    );
};

export default VendorFinanceDashboard;
