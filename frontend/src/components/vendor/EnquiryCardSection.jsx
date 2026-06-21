import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, MessageSquare, FileText, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const EnquiryCardSection = ({ title, type, enquiryCount, acceptedCount, rejectedCount }) => {
  const isDirect = type === 'direct';
  const targetLink = isDirect ? '/vendor/direct-enquiries' : '/vendor/my-enquiries';

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-5">
      <h3 className="text-xs font-black !text-[#0B1E43] uppercase tracking-widest flex items-center gap-2">
        {isDirect ? <MessageSquare size={16} className="text-[#0066FF]" /> : <Landmark size={16} className="text-[#0066FF]" />}
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total */}
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]/50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all duration-300 group">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total enquiry received</p>
            <h4 className="text-3xl font-extrabold !text-slate-800 mt-2">{enquiryCount}</h4>
            <Link to={targetLink} className="text-[11px] text-[#0066FF] font-extrabold hover:underline mt-3 inline-flex items-center gap-1">
              View Details <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0066FF]/8 text-[#0066FF] flex items-center justify-center shadow-sm">
            <FileText size={20} />
          </div>
        </div>
        {/* Accepted */}
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]/50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all duration-300 group">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enquiry accepted</p>
            <h4 className="text-3xl font-extrabold !text-green-600 mt-2">{acceptedCount}</h4>
            <Link to={targetLink} className="text-[11px] text-[#0066FF] font-extrabold hover:underline mt-3 inline-flex items-center gap-1">
              View Details <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-500/8 text-green-600 flex items-center justify-center shadow-sm">
            <CheckCircle2 size={20} />
          </div>
        </div>
        {/* Not Accepted */}
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]/50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all duration-300 group">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enquiry not accepted</p>
            <h4 className="text-3xl font-extrabold !text-red-500 mt-2">{rejectedCount}</h4>
            <Link to={targetLink} className="text-[11px] text-[#0066FF] font-extrabold hover:underline mt-3 inline-flex items-center gap-1">
              View Details <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/8 text-red-500 flex items-center justify-center shadow-sm">
            <XCircle size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryCardSection;
