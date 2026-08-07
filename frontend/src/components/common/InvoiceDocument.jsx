import React from 'react';
import { Calendar, CalendarClock, MapPin, Package, Truck, CreditCard, Scale, IndianRupee, Clock, AlertCircle, FileText, Phone, Mail, Globe } from 'lucide-react';

const InvoiceDocument = React.forwardRef(({ rateResult, boxes, totalWeight, originPin, destPin, originData, destData, shipmentAmount, user, freightMode, dimensionUnit }, ref) => {

    // Generate dates
    const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const today = new Date();
    const validUntil = new Date();
    validUntil.setDate(today.getDate() + 2);

    const quotationDate = today.toLocaleDateString('en-GB', dateOptions);
    const validDate = validUntil.toLocaleDateString('en-GB', dateOptions);

    const quotationNo = `LSQ-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

    const isVendor = user?.role === 'vendor';

    const getLSID = (id) => {
        if (!id) return 'N/A';
        let hash = 0;
        const str = id.toString();
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) % 900000;
        }
        return `LS-${1000000000 + Math.abs(hash)}`;
    };

    const vendorLsId = user?.lsId || user?.lsid || getLSID(user?._id || user?.id);

    const dimensionsText = boxes.map(b => `${b.l} × ${b.b} × ${b.h} ${dimensionUnit || 'inch'} (${b.count} box)`).join(', ');

    return (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
            <div ref={ref} style={{ backgroundColor: '#ffffff', color: '#1e293b', width: '794px', minHeight: '1123px', margin: '0 auto', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif", display: 'flex', flexDirection: 'column' }}>

                {/* Header Top Border (Fixed for html2canvas) */}
                <div style={{ display: 'flex', height: '6px', width: '100%' }}>
                    <div style={{ width: '25%', backgroundColor: '#00d2ff' }}></div>
                    <div style={{ width: '75%', backgroundColor: '#0B1E43' }}></div>
                </div>

                <div style={{ padding: '32px 40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <img src="/logo.png" alt="Logistics Scanner" style={{ height: '60px' }} />
                            <div style={{ height: '40px', width: '2px', backgroundColor: '#e2e8f0' }}></div>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0B1E43', margin: 0, letterSpacing: '-0.5px' }}>LOGISTICS SCANNER</h1>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Premium Freight Solutions</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0055FF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>QUOTATION</h2>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>#{quotationNo}</p>
                        </div>
                    </div>

                    {/* Info Grid: Date Box */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', backgroundColor: '#f8fafc', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        
                        <div style={{ display: 'flex', gap: '40px' }}>
                            {/* Issued Date */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ backgroundColor: '#eff6ff', color: '#0055FF', padding: '10px', borderRadius: '50%' }}>
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>Date Issued</p>
                                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{quotationDate}</p>
                                </div>
                            </div>

                            <div style={{ height: '40px', width: '1px', backgroundColor: '#cbd5e1' }}></div>

                            {/* Valid Until */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '50%' }}>
                                    <CalendarClock size={24} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>Valid Until</p>
                                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#ef4444', margin: 0 }}>{validDate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Vendor Info (Only visible to Vendors) */}
                        {isVendor && (
                            <div style={{ textAlign: 'right', borderLeft: '1px solid #cbd5e1', paddingLeft: '40px' }}>
                                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>Vendor Information</p>
                                <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>{user.company || user.name}</p>
                                <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 2px 0', fontWeight: '600' }}>LS ID: <span style={{ fontWeight: '800', color: '#0f172a' }}>{vendorLsId}</span></p>
                                {user.phone && <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 2px 0', fontWeight: '600' }}>{user.phone}</p>}
                                {user.email && <p style={{ fontSize: '11px', color: '#475569', margin: 0, fontWeight: '600' }}>{user.email}</p>}
                            </div>
                        )}
                    </div>

                    {/* Section 1: Shipment Details */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ backgroundColor: '#0B1E43', display: 'inline-flex', alignItems: 'center', borderRadius: '50px', padding: '4px 24px 4px 4px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Package size={20} color="#0B1E43" />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#ffffff', marginLeft: '12px' }}>Shipment Details</span>
                            </div>
                            <div style={{ flex: 1, height: '2px', backgroundColor: '#0B1E43' }}></div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px', paddingLeft: '8px' }}>
                            {/* Row 1 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <MapPin size={18} color="#0055FF" strokeWidth={2.5} />
                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Pickup Location</span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>{originData?.city || 'Delhi'} - {originPin || '110045'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Scale size={18} color="#0055FF" strokeWidth={2.5} />
                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Weight (Maximum)</span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>{totalWeight} Kg</span>
                            </div>

                            {/* Row 2 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <MapPin size={18} color="#0055FF" strokeWidth={2.5} />
                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Delivery Location</span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>{destData?.city || 'Darbhanga'} - {destPin || '847101'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Package size={18} color="#0055FF" strokeWidth={2.5} />
                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Dimensions (Maximum)</span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>{dimensionsText}</span>
                            </div>

                            {/* Row 3 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Truck size={18} color="#0055FF" strokeWidth={2.5} />
                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Service Mode</span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>{rateResult?.breakup?.mode || rateResult?.freightMode || 'Surface Express'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <IndianRupee size={18} color="#0055FF" strokeWidth={2.5} />
                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Shipment Value</span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>₹{Number(shipmentAmount).toLocaleString('en-IN')}</span>
                            </div>

                            {/* Row 4 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CreditCard size={18} color="#0055FF" strokeWidth={2.5} />
                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Payment Terms</span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>{freightMode === 'fod' ? 'Freight on Delivery (FOD)' : 'Freight on Pickup (FOP)'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Clock size={18} color="#0055FF" strokeWidth={2.5} />
                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Estimated Transit Time</span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>
                                    {(() => {
                                        let baseDays = 4;
                                        if (rateResult?.breakup?.tat) {
                                            baseDays = Number(rateResult.breakup.tat);
                                        } else if (rateResult?.breakup?.expected_delivery_date) {
                                            const diff = new Date(rateResult.breakup.expected_delivery_date) - new Date();
                                            baseDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                                        }
                                        return `${baseDays} - ${baseDays + 3} Business Days`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Charges Breakdown */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ backgroundColor: '#0B1E43', display: 'inline-flex', alignItems: 'center', borderRadius: '50px', padding: '4px 24px 4px 4px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <FileText size={20} color="#0B1E43" />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#ffffff', marginLeft: '12px' }}>Charges Breakdown</span>
                            </div>
                            <div style={{ flex: 1, height: '2px', backgroundColor: '#0B1E43' }}></div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '800', backgroundColor: '#f0f5ff', color: '#0B1E43', width: '70%' }}>DESCRIPTION</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', backgroundColor: '#f0f5ff', color: '#0B1E43' }}>AMOUNT (INR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '16px', borderBottom: '1px dashed #cbd5e1', fontWeight: '600', color: '#475569' }}>Base Freight (Inclusive of Charges)</td>
                                    <td style={{ padding: '16px', borderBottom: '1px dashed #cbd5e1', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>₹{(rateResult?.finalPrice - (rateResult?.breakup?.price_breakup?.insurance_rov || 0) - (rateResult?.breakup?.price_breakup?.gst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '16px', borderBottom: '1px dashed #cbd5e1', fontWeight: '600', color: '#475569' }}>Insurance</td>
                                    <td style={{ padding: '16px', borderBottom: '1px dashed #cbd5e1', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>₹{(rateResult?.breakup?.price_breakup?.insurance_rov || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #cbd5e1', fontWeight: '600', color: '#475569' }}>GST ({rateResult?.breakup?.price_breakup?.gst_percent || 18}%)</td>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #cbd5e1', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>₹{(rateResult?.breakup?.price_breakup?.gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '20px 16px', fontWeight: '900', color: '#475569', fontSize: '15px', backgroundColor: '#f0f5ff', textTransform: 'uppercase' }}>Total Payable</td>
                                    <td style={{ padding: '20px 16px', fontWeight: '900', color: '#0055FF', fontSize: '20px', textAlign: 'right', backgroundColor: '#f0f5ff' }}>₹{(rateResult?.finalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Important Notes */}
                    <div style={{ marginBottom: '32px', backgroundColor: '#fffbeb', padding: '16px 20px', borderRadius: '8px', borderLeft: '4px solid #f59e0b', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <AlertCircle size={28} color="#f59e0b" style={{ marginTop: '2px' }} />
                        <div>
                            <p style={{ margin: 0, fontWeight: '800', color: '#b45309', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Important Note</p>
                            <p style={{ margin: 0, lineHeight: '1.6', fontWeight: '500', fontSize: '12px', color: '#475569' }}>
                                The quoted rates are based on the dimensions, weight, and invoice value provided by the customer.<br />
                                Any variation in these details at the time of shipment may lead to a revision of the applicable charges.
                            </p>
                        </div>
                    </div>

                    {/* Spacer to push footer to bottom if needed */}
                    <div style={{ flex: 1 }}></div>

                    {/* Footer Info Box */}
                    <div style={{ backgroundColor: '#f0f5ff', padding: '24px', borderRadius: '12px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '24px', gap: '32px' }}>
                        
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: '220px' }}>
                            <div style={{ backgroundColor: '#0055FF', padding: '12px', borderRadius: '8px', color: 'white' }}>
                                <FileText size={32} />
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: '800', color: '#0B1E43', margin: '0 0 4px 0' }}>Logistics Scanner App</p>
                                <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 2px 0', fontWeight: '500' }}>This is a system-generated document</p>
                                <p style={{ fontSize: '11px', color: '#475569', margin: 0, fontWeight: '500' }}>and requires no signature.</p>
                            </div>
                        </div>

                        <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '32px', display: 'flex', flex: 1, justifyContent: 'space-between', gap: '20px' }}>
                            {/* Address Section */}
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>Our Branch</p>
                                <p style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>BNB Worldwide Pvt. Ltd.</p>
                                <p style={{ fontSize: '11px', color: '#475569', margin: 0, fontWeight: '500', lineHeight: '1.5', maxWidth: '240px' }}>
                                    210/2, S/F, Commercial Flats, District Centre, Janakpuri, New Delhi, Delhi, India, 110058
                                </p>
                            </div>

                            {/* Contact Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '160px' }}>
                                <div>
                                    <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>Call Us</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Phone size={14} color="#0055FF" />
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>+91 92663 35550</span>
                                    </div>
                                </div>
                                <div>
                                    <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>Email Us</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Mail size={14} color="#0055FF" />
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>info@logisticsscanner.com</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Bottom Banner */}
                <div style={{ backgroundColor: '#0B1E43', color: '#ffffff', textAlign: 'center', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                    <div style={{ height: '1px', width: '40px', backgroundColor: '#475569' }}></div>
                    <p style={{ fontSize: '12px', fontStyle: 'italic', margin: 0, letterSpacing: '0.5px' }}>Thank you for choosing Logistics Scanner.</p>
                    <div style={{ height: '1px', width: '40px', backgroundColor: '#475569' }}></div>
                </div>

            </div>
        </div>
    );
});

export default InvoiceDocument;
