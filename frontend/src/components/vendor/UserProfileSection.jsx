import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar } from 'lucide-react';

const UserProfileSection = ({ user }) => {
  const navigate = useNavigate();
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      };
      setCurrentDateTime(now.toLocaleDateString('en-GB', options).replace(',', ''));
    };
    updateDateTime();
    // Interval intentionally removed to prevent live time updates as per user request
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-5">
      <div className="flex items-center gap-2 text-xs font-black text-[#0066FF] uppercase tracking-widest">
        <User size={16} /> User Profile
      </div>
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-800 leading-relaxed">
          Welcome, <span className="text-[#0066FF] font-black">{user?.name || 'Sandeep'}</span>
          <span className="text-slate-400 block text-[10px] mt-0.5 font-bold uppercase tracking-wider">{user?.company || 'PIRAMAL LOGISTICS'}</span>
        </h4>
        
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-extrabold bg-[#f4f7fc] p-2.5 rounded-xl border border-slate-100/50 uppercase tracking-wider">
          <Calendar size={13} className="text-[#0066FF]" />
          <span>{currentDateTime || 'Loading time...'}</span>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CURRENT PLAN</p>
            <span className="text-xs font-black text-slate-800 tracking-wide">{user?.activePlan?.name || user?.plan || 'FREE PLAN'}</span>
          </div>
          <button 
            onClick={() => navigate('/vendor/upgrade')}
            className="bg-gradient-to-r from-[#0066FF] to-[#00b2fe] hover:opacity-95 text-white text-[9px] font-black px-3.5 py-2 rounded-xl uppercase tracking-widest transition-all shadow-sm shadow-[#0066FF]/10 cursor-pointer"
          >
            UPGRADE PRO
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CURRENT WALLET</p>
            <span className={`text-xs font-black tracking-wide ${
              user?.walletBalance && user.walletBalance > 0 ? 'text-[#0066FF]' : 'text-red-550'
            }`}>
              {user?.walletBalance && user.walletBalance > 0 ? `₹ ${user.walletBalance.toLocaleString('en-IN')}` : 'Not Approved'}
            </span>
          </div>
          <button className="border border-[#0066FF]/20 hover:bg-[#0066FF]/5 text-[#0066FF] text-[9px] font-black px-3.5 py-2 rounded-xl uppercase tracking-widest transition-all cursor-pointer">
            view more
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSection;
