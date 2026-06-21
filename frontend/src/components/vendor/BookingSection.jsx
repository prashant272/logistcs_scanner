import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

const BookingSection = ({ myBookingsCount = 0, directBookingsCount = 0 }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-5">
      <h3 className="text-xs font-black !text-[#0B1E43] uppercase tracking-widest flex items-center gap-2">
        <Calendar size={16} className="text-[#0066FF]" /> Booking
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]/50 border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all duration-300 group">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Booking</p>
          <div className="flex items-center justify-between mt-3">
            <h4 className="text-2xl font-extrabold !text-slate-800">{myBookingsCount}</h4>
            <div className="w-9 h-9 rounded-xl bg-[#0066FF]/8 text-[#0066FF] flex items-center justify-center">
              <Calendar size={15} />
            </div>
          </div>
          <Link to="/vendor/my-bookings" className="text-[10px] text-[#0066FF] font-black hover:underline mt-4 block uppercase tracking-wider">
            View Details →
          </Link>
        </div>

        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]/50 border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all duration-300 group">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Booking</p>
          <div className="flex items-center justify-between mt-3">
            <h4 className="text-2xl font-extrabold !text-slate-800">{directBookingsCount}</h4>
            <div className="w-9 h-9 rounded-xl bg-[#0066FF]/8 text-[#0066FF] flex items-center justify-center">
              <Calendar size={15} />
            </div>
          </div>
          <Link to="/vendor/direct-booking" className="text-[10px] text-[#0066FF] font-black hover:underline mt-4 block uppercase tracking-wider">
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSection;
