import React from 'react';

const InvoiceDocument = React.forwardRef(({ rateResult, boxes, totalWeight, originPin, destPin, originData, destData, shipmentAmount, user }, ref) => {

    // Generate dates
    const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const today = new Date();
    const validUntil = new Date();
    validUntil.setDate(today.getDate() + 2);

    const quotationDate = today.toLocaleDateString('en-GB', dateOptions);
    const validDate = validUntil.toLocaleDateString('en-GB', dateOptions);

    const quotationNo = `LSQ-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

    const isVendor = user?.role === 'vendor';

    const dimensionsText = boxes.map(b => `${b.l} × ${b.b} × ${b.h} cm (${b.count} box)`).join(', ');

    // We use explicit hex colors in inline styles because html2canvas does not support oklch() colors used by Tailwind CSS v4.
    // Use off-screen positioning instead of display: none because html2canvas cannot render hidden elements.
    return (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
            <div ref={ref} style={{ backgroundColor: '#ffffff', color: '#000000', padding: '40px', width: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <img src="/logo.png" alt="Logistics Scanner" style={{ height: '64px', margin: '0 auto 8px auto' }} />
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px', margin: 0 }}>LOGISTICS SCANNER</h1>
                </div>

                {/* Freight Quotation Section */}
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', margin: 0 }}>Freight Quotation</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '16px' }}>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', width: '33.333%', backgroundColor: '#f9fafb' }}>Quotation No.</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{quotationNo}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', backgroundColor: '#f9fafb' }}>Quotation Date</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{quotationDate}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', backgroundColor: '#f9fafb' }}>Valid Until</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{validDate}</td>
                            </tr>
                            {isVendor && user?.company_name && (
                                <tr>
                                    <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', backgroundColor: '#f9fafb' }}>Vendor Company</td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{user.company_name}</td>
                                </tr>
                            )}
                            {isVendor && user?.ls_id && (
                                <tr>
                                    <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', backgroundColor: '#f9fafb' }}>Vendor LS ID</td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{user.ls_id}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Shipment Details Section */}
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', fontStyle: 'italic', margin: 0 }}>Shipment Details</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '12px' }}>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', width: '33.333%', backgroundColor: '#f9fafb' }}>Pickup</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{originData?.city ? `${originData.city} - ${originPin}` : `Pin - ${originPin}`}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', backgroundColor: '#f9fafb' }}>Delivery</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{destData?.city ? `${destData.city} - ${destPin}` : `Pin - ${destPin}`}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', backgroundColor: '#f9fafb' }}>Service</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>Surface Express</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', backgroundColor: '#f9fafb' }}>Weight</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{totalWeight} Kg <span style={{ color: '#f97316', fontSize: '12px', marginLeft: '8px' }}>Maximum*</span></td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', backgroundColor: '#f9fafb' }}>Dimensions</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{dimensionsText} <span style={{ color: '#f97316', fontSize: '12px', marginLeft: '8px' }}>Maximum*</span></td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', backgroundColor: '#f9fafb' }}>Shipment Value</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>₹{Number(shipmentAmount).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600', backgroundColor: '#f9fafb' }}>Transit</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>~4 Business Days</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Price Breakdown */}
                <div style={{ marginBottom: '48px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left', fontWeight: '600', backgroundColor: '#0b6cbf', color: '#ffffff' }}>Description</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left', fontWeight: '600', width: '33.333%', backgroundColor: '#0b6cbf', color: '#ffffff' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>Base Freight (Inclusive of Charges)</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>₹{(rateResult?.finalPrice - (rateResult?.breakup?.price_breakup?.insurance_rov || 0) - (rateResult?.breakup?.price_breakup?.gst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>Insurance</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>₹{(rateResult?.breakup?.price_breakup?.insurance_rov || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>GST ({rateResult?.breakup?.price_breakup?.gst_percent || 18}%)</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>₹{(rateResult?.breakup?.price_breakup?.gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr style={{ fontWeight: 'bold' }}>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>Total Payable</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>₹{(rateResult?.finalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer / Vendor Information */}
                <div style={{ fontSize: '14px', marginTop: '32px' }}>
                    {isVendor && (
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '16px', margin: '0 0 4px 0' }}>Vendor Information</h3>
                            <p style={{ margin: '2px 0' }}>{user.company_name}</p>
                            <p style={{ margin: '2px 0' }}>Vendor LS ID: <span style={{ fontWeight: 'bold' }}>{user.ls_id}</span></p>
                            <p style={{ margin: '2px 0' }}>Email: {user.email}</p>
                        </div>
                    )}
                    <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '32px' }}>
                        <p style={{ fontWeight: '600', margin: '2px 0' }}>Generated by Logistics Scanner</p>
                        <p style={{ margin: '2px 0' }}>This is a system-generated quotation and does not require a signature.</p>
                    </div>
                </div>

            </div>
        </div>
    );
});

export default InvoiceDocument;
