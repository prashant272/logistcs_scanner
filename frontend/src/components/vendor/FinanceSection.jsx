import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, FileText, AlertTriangle } from 'lucide-react';

const FinanceSection = ({ stats }) => {
  // Extract counts and amounts directly from stats API
  const invoicesCount = (stats?.myBookings?.accepted || 0) + (stats?.directBookings?.accepted || 0);
  const upcomingPaymentDue = (stats?.myBookings?.upcomingPaymentDue || 0) + (stats?.directBookings?.upcomingPaymentDue || 0);
  const dueIn5Days = (stats?.myBookings?.dueIn5Days || 0) + (stats?.directBookings?.dueIn5Days || 0);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-5">
      <h3 className="text-xs font-black !text-[#0B1E43] uppercase tracking-widest flex items-center gap-2">
        <Wallet size={16} className="text-[#0066FF]" /> Finance
      </h3>
      <div className="space-y-3">
        {/* My Invoices */}
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]/50 border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0066FF]/8 text-[#0066FF] flex items-center justify-center shadow-sm">
              <FileText size={16} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-405 uppercase tracking-wider leading-none mb-1">My Invoices</p>
              <span className="text-xs font-black !text-slate-800">{invoicesCount} Invoices</span>
            </div>
          </div>
          <Link to="/vendor/finance" className="text-[10px] text-[#0066FF] font-black hover:underline uppercase tracking-wider">
            View Details →
          </Link>
        </div>

        {/* My Upcoming Payment */}
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]/50 border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/8 text-green-600 flex items-center justify-center shadow-sm">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-405 uppercase tracking-wider leading-none mb-1">Upcoming Payment Due</p>
              <span className="text-xs font-black !text-green-600">₹ {upcomingPaymentDue.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <Link to="/vendor/finance" className="text-[10px] text-[#0066FF] font-black hover:underline uppercase tracking-wider">
            View Details →
          </Link>
        </div>

        {/* Due in 5 days */}
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]/50 border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/8 text-red-500 flex items-center justify-center shadow-sm">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-405 uppercase tracking-wider leading-none mb-1">Due in 5 Days</p>
              <span className="text-xs font-black !text-red-600">₹ {dueIn5Days.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <Link to="/vendor/finance" className="text-[10px] text-[#0066FF] font-black hover:underline uppercase tracking-wider">
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FinanceSection;
