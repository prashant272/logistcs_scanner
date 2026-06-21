import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const ComplaintsSection = ({ myEnquiries = [], directEnquiries = [], myBookings = [], directBookings = [] }) => {
  // Let's derive complaints from Declined status to make it dynamic and real-time
  const myDeclinedEnquiries = myEnquiries.filter(e => e.status === 'Declined').length;
  const directDeclinedEnquiries = directEnquiries.filter(e => e.status === 'Declined').length;
  const myDeclinedBookings = myBookings.filter(b => b.status === 'Declined').length;
  const directDeclinedBookings = directBookings.filter(b => b.status === 'Declined').length;

  const myComplaintsVendor = myDeclinedBookings;
  const myComplaintsCustomer = myDeclinedEnquiries;
  const complaintsAgainstMeVendor = directDeclinedBookings;
  const complaintsAgainstMeCustomer = directDeclinedEnquiries;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-5">
      <h3 className="text-xs font-black !text-[#0B1E43] uppercase tracking-widest flex items-center gap-2">
        <AlertTriangle size={16} className="text-[#0066FF]" /> Complaints
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My Complaints */}
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]/50 border border-slate-100 rounded-2xl p-5 space-y-4 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center gap-2 text-xs font-bold !text-slate-700 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>My Complaints</span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">For VENDOR</p>
              <h5 className="text-xl font-extrabold !text-slate-800 mt-1.5">{myComplaintsVendor}</h5>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">For CUSTOMER</p>
              <h5 className="text-xl font-extrabold !text-slate-800 mt-1.5">{myComplaintsCustomer}</h5>
            </div>
          </div>
          <Link to="/vendor/dashboard" className="text-[10px] text-[#0066FF] font-black hover:underline text-center block uppercase tracking-wider">
            View Details →
          </Link>
        </div>

        {/* Complaint Against Me */}
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]/50 border border-slate-100 rounded-2xl p-5 space-y-4 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center gap-2 text-xs font-bold !text-slate-700 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Complaint AGAINST ME</span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">For VENDOR</p>
              <h5 className="text-xl font-extrabold !text-slate-800 mt-1.5">{complaintsAgainstMeVendor}</h5>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">For CUSTOMER</p>
              <h5 className="text-xl font-extrabold !text-slate-800 mt-1.5">{complaintsAgainstMeCustomer}</h5>
            </div>
          </div>
          <Link to="/vendor/dashboard" className="text-[10px] text-[#0066FF] font-black hover:underline text-center block uppercase tracking-wider">
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsSection;
