import React from 'react';
import { ShieldCheck, Wallet, Phone, Mail, MessageSquare } from 'lucide-react';

const RelationshipManagerCard = ({ title, name, role, phone, email, isFinance }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-5">
      <div className="flex items-center gap-2 text-xs font-black text-[#0066FF] uppercase tracking-widest">
        {isFinance ? <Wallet size={16} /> : <ShieldCheck size={16} />}
        {title}
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 overflow-hidden shrink-0 shadow-sm text-lg font-black uppercase">
          {name ? name.charAt(0) : '?'}
        </div>
        <div>
          <h4 className="font-extrabold text-sm text-slate-800">{name}</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{role}</p>
        </div>
      </div>
      <div className="space-y-2 text-xs font-bold text-slate-600 pt-3 border-t border-slate-100/70">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-slate-400" />
          <span>{phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-slate-400" />
          <span>{email}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100/70">
        <a href={`tel:${phone}`} className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-center py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer">
          <Phone size={12} /> Call
        </a>
        <a href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="border border-green-200 bg-green-50 hover:bg-green-100/50 text-green-700 text-center py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer">
          <MessageSquare size={12} /> WhatsApp
        </a>
      </div>
    </div>
  );
};

export default RelationshipManagerCard;
