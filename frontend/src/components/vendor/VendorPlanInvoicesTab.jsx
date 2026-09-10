import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Download, FileText, Loader2, Eye } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import InvoiceTemplate from '../shared/InvoiceTemplate';

const VendorPlanInvoicesTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const invoiceRef = useRef();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/invoices/my-invoices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` }
      });
      if (Array.isArray(res.data)) {
        setInvoices(res.data);
      } else {
        console.error('Expected an array of invoices, but got:', res.data);
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (invoice) => {
    setDownloadingId(invoice._id);
    setSelectedInvoice(invoice);

    // Wait a brief moment for state to update and render the hidden template
    setTimeout(() => {
      const element = invoiceRef.current;
      if (!element) {
        setDownloadingId(null);
        setSelectedInvoice(null);
        return;
      }

      const opt = {
        margin:       [6, 6, 6, 6],
        filename:     `Invoice_${invoice.invoiceNo}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setDownloadingId(null);
        setSelectedInvoice(null);
      }).catch((err) => {
        console.error('PDF generation error:', err);
        setDownloadingId(null);
        setSelectedInvoice(null);
      });
    }, 400);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[#0B1E43]">Subscription Invoices</h2>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Total: {invoices.length}
        </span>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-sm font-black text-slate-700">No Invoices Found</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1">You haven't purchased any plans yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Invoice No</th>
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Plan Name</th>
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold text-slate-800">{inv.invoiceNo}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs font-semibold text-slate-600">
                      {new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs font-bold text-[#0066FF] bg-blue-50 px-2.5 py-1 rounded-md">
                      {inv.planName}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold text-slate-800">₹{inv.totalAmount.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleDownload(inv)}
                      disabled={downloadingId === inv._id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                      {downloadingId === inv._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hidden Invoice Template for PDF Generation */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -9999 }}>
        {selectedInvoice && (
          <InvoiceTemplate invoice={selectedInvoice} forwardRef={invoiceRef} />
        )}
      </div>
    </div>
  );
};

export default VendorPlanInvoicesTab;
