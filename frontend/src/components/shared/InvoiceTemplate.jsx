import React from 'react';

const InvoiceTemplate = ({ invoice, forwardRef }) => {
  if (!invoice) return null;

  // Determine if the invoice is for a foreign / outside-India client
  const isForeign = (() => {
    if (invoice.currency && (invoice.currency.toUpperCase() === 'USD' || invoice.currency === '$')) {
      return true;
    }
    if (invoice.country) {
      const c = invoice.country.trim().toLowerCase();
      if (c && c !== 'india' && c !== 'in') return true;
    }
    if (invoice.address) {
      const addr = invoice.address.toLowerCase();
      const foreignKeywords = [
        'usa', 'united states', 'uk', 'united kingdom', 'uae', 'dubai', 
        'canada', 'australia', 'singapore', 'germany', 'france', 'china', 
        'japan', 'worldwide', 'others', 'netherlands', 'spain', 'italy', 
        'saudi arabia', 'qatar', 'kuwait', 'oman', 'bahrain', 'malaysia', 
        'south africa', 'brazil', 'mexico', 'russia', 'new zealand', 'hong kong'
      ];
      for (const kw of foreignKeywords) {
        if (new RegExp(`\\b${kw}\\b`, 'i').test(addr)) return true;
      }
    }
    if (Number(invoice.gstRate) === 0 && !invoice.igstAmount && !invoice.cgstAmount && !invoice.sgstAmount) {
      if (!invoice.address || !/india\b/i.test(invoice.address)) {
        return true;
      }
    }
    return false;
  })();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const money = (value) => {
    const val = Number(value) || 0;
    if (isForeign) {
      return `$ ${val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `INR ${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const numberToWords = (num) => {
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
      'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
      'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const n = Math.round(Number(num) || 0);
    if (n === 0) return isForeign ? 'Zero US Dollars Only' : 'Zero Rupees Only';

    const two = (x) => {
      if (x < 20) return a[x];
      return `${b[Math.floor(x / 10)]}${x % 10 ? ' ' + a[x % 10] : ''}`;
    };

    let value = n;
    let result = '';

    if (isForeign) {
      // International Billion / Million / Thousand format for USD
      if (value >= 1000000000) {
        result += `${two(Math.floor(value / 1000000000))} Billion `;
        value %= 1000000000;
      }
      if (value >= 1000000) {
        result += `${two(Math.floor(value / 1000000))} Million `;
        value %= 1000000;
      }
      if (value >= 1000) {
        result += `${two(Math.floor(value / 1000))} Thousand `;
        value %= 1000;
      }
      if (value >= 100) {
        result += `${a[Math.floor(value / 100)]} Hundred `;
        value %= 100;
      }
      if (value > 0) {
        result += `${result ? 'and ' : ''}${two(value)} `;
      }
      return `${result.trim()} US Dollars Only`;
    } else {
      // Indian format for INR
      if (value >= 10000000) {
        result += `${two(Math.floor(value / 10000000))} Crore `;
        value %= 10000000;
      }
      if (value >= 100000) {
        result += `${two(Math.floor(value / 100000))} Lakh `;
        value %= 100000;
      }
      if (value >= 1000) {
        result += `${two(Math.floor(value / 1000))} Thousand `;
        value %= 1000;
      }
      if (value >= 100) {
        result += `${a[Math.floor(value / 100)]} Hundred `;
        value %= 100;
      }
      if (value > 0) {
        result += `${result ? 'and ' : ''}${two(value)} `;
      }
      return `${result.trim()} Rupees Only`;
    }
  };

  const baseAmount = Number(invoice.baseAmount) || 0;
  const igstAmount = isForeign ? 0 : (Number(invoice.igstAmount) || 0);
  const sgstAmount = isForeign ? 0 : (Number(invoice.sgstAmount) || 0);
  const cgstAmount = isForeign ? 0 : (Number(invoice.cgstAmount) || 0);
  const totalAmount = isForeign
    ? (Number(invoice.totalAmount) || baseAmount)
    : (Number(invoice.totalAmount) || (baseAmount + igstAmount + sgstAmount + cgstAmount));

  return (
    <div
      ref={forwardRef}
      style={{
        width: '740px',
        margin: '0 auto',
        padding: '24px 30px',
        background: '#ffffff',
        color: '#000000',
        fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '11px',
        lineHeight: '1.45',
        boxSizing: 'border-box',
      }}
    >
      {/* Centered Logo */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        <img
          src="/logo.png"
          alt="Logistics Scanner"
          style={{
            height: '54px',
            maxWidth: '220px',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto',
          }}
        />
      </div>

      {/* Company / Tax Info Top Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: '8px',
          borderBottom: '1.5px solid #000000',
          fontSize: '10.5px',
          lineHeight: '1.4',
          color: '#000000',
        }}
      >
        <div style={{ width: '62%' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#000000' }}>
            Operated By: Bnb Worldwide Private Limited
          </div>
          <div style={{ color: '#000000', marginTop: '2px', fontWeight: '500' }}>
            210, 2nd Floor DDA-2 Building Janakpuri District Center, New Delhi - 110058
          </div>
          <div style={{ marginTop: '3px', fontWeight: '700', color: '#000000' }}>
            <span><b>GSTIN:</b> 07AALCB1378A1ZX</span>
            <span style={{ marginLeft: '24px' }}><b>PAN:</b> AALCB1378A</span>
            {isForeign && (
              <span style={{ marginLeft: '16px', fontSize: '9px', fontWeight: '800', color: '#000000' }}>
                [Export of Services / Zero Rated]
              </span>
            )}
          </div>
        </div>

        <div style={{ width: '36%', textAlign: 'right', color: '#000000' }}>
          <div><b>EMAIL:</b> INFO@LOGISTICSSCANNER.COM</div>
          <div style={{ marginTop: '2px' }}><b>WEBSITE:</b> WWW.LOGISTICSSCANNER.COM</div>
        </div>
      </div>

      {/* Invoice Meta Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr',
          gap: '12px',
          padding: '10px 0',
          borderBottom: '1.5px solid #000000',
          fontSize: '10.5px',
          alignItems: 'flex-start',
          color: '#000000',
        }}
      >
        <div>
          <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Billed To / Company Name
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', marginTop: '2px' }}>
            {invoice.companyName || '-'}
          </div>
          {invoice.address && (
            <div style={{ color: '#000000', marginTop: '2px', fontWeight: '500' }}>
              <b>Address:</b> {invoice.address}
            </div>
          )}
          {invoice.country && !invoice.address?.toLowerCase().includes(invoice.country.toLowerCase()) && (
            <div style={{ color: '#000000', marginTop: '1px', fontWeight: '600' }}>
              <b>Country:</b> {invoice.country}
            </div>
          )}
          {invoice.gstNo && (
            <div style={{ color: '#000000', marginTop: '1px', fontWeight: '700' }}>
              <b>{isForeign ? 'Tax ID / GST:' : 'GSTIN:'}</b> {invoice.gstNo}
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Invoice Number
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', marginTop: '2px' }}>
            {invoice.invoiceNo || '-'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Invoice Date
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', marginTop: '2px' }}>
            {formatDate(invoice.date)}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '12px',
          fontSize: '10.5px',
          color: '#000000',
        }}
      >
        <thead>
          <tr style={{ background: '#f5f5f5', color: '#000000' }}>
            <th
              style={{
                border: '1.5px solid #000000',
                padding: '7px 10px',
                textAlign: 'left',
                width: '46%',
                fontWeight: '800',
                color: '#000000',
              }}
            >
              Description
            </th>
            <th
              style={{
                border: '1.5px solid #000000',
                padding: '7px 10px',
                textAlign: 'center',
                width: '16%',
                fontWeight: '800',
                color: '#000000',
              }}
            >
              SAC Code
            </th>
            <th
              style={{
                border: '1.5px solid #000000',
                padding: '7px 10px',
                textAlign: 'center',
                width: '16%',
                fontWeight: '800',
                color: '#000000',
              }}
            >
              {isForeign ? 'Tax Rate' : 'GST Rate'}
            </th>
            <th
              style={{
                border: '1.5px solid #000000',
                padding: '7px 10px',
                textAlign: 'right',
                width: '22%',
                fontWeight: '800',
                color: '#000000',
              }}
            >
              {isForeign ? 'Amount ($)' : 'Amount (INR)'}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td
              style={{
                border: '1.5px solid #000000',
                padding: '10px',
                verticalAlign: 'top',
                color: '#000000',
              }}
            >
              <div style={{ fontWeight: '800', fontSize: '11px', color: '#000000' }}>
                {invoice.planName ? `${invoice.planName} Membership Plan` : 'Yearly Membership Plan'}
              </div>
              <div style={{ color: '#000000', fontSize: '9.5px', marginTop: '2px', fontWeight: '500' }}>
                Subscription access to Logistics Scanner Vendor Portal &amp; Directory Services
              </div>
            </td>
            <td
              style={{
                border: '1.5px solid #000000',
                padding: '10px',
                textAlign: 'center',
                verticalAlign: 'top',
                fontWeight: '700',
                color: '#000000',
              }}
            >
              {invoice.sacCode || (isForeign ? '998313' : '9956')}
            </td>
            <td
              style={{
                border: '1.5px solid #000000',
                padding: '10px',
                textAlign: 'center',
                verticalAlign: 'top',
                fontWeight: '700',
                color: '#000000',
              }}
            >
              {isForeign ? '0% (Export)' : `${invoice.gstRate || 18}%`}
            </td>
            <td
              style={{
                border: '1.5px solid #000000',
                padding: '10px',
                textAlign: 'right',
                verticalAlign: 'top',
                fontWeight: '800',
                color: '#000000',
              }}
            >
              {money(baseAmount)}
            </td>
          </tr>

          {/* Amount in words & Tax Breakdown Row */}
          <tr>
            <td
              colSpan="2"
              style={{
                border: '1.5px solid #000000',
                padding: '12px',
                verticalAlign: 'top',
                background: '#ffffff',
                color: '#000000',
              }}
            >
              <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Value in Words
              </div>
              <div
                style={{
                  marginTop: '6px',
                  fontWeight: '800',
                  fontSize: '11px',
                  color: '#000000',
                  lineHeight: '1.4',
                }}
              >
                {numberToWords(Math.round(totalAmount))}
              </div>
            </td>

            <td
              colSpan="2"
              style={{
                border: '1.5px solid #000000',
                padding: '0',
                verticalAlign: 'top',
              }}
            >
              {isForeign ? (
                /* Foreign / Outside India Breakdown Table (No GST, Dollar currency) */
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', color: '#000000' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ padding: '6px 8px', color: '#000000', fontWeight: '700' }}>Sub Total</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700', color: '#000000' }}>{money(baseAmount)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ padding: '6px 8px', color: '#000000', fontWeight: '600' }}>GST / Tax (Export of Service)</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600', color: '#000000' }}>$ 0.00</td>
                    </tr>
                    <tr style={{ background: '#f5f5f5', fontWeight: '800' }}>
                      <td style={{ padding: '8px 8px', fontSize: '11px', color: '#000000', borderTop: '1.5px solid #000000' }}>Total Amount</td>
                      <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: '11px', color: '#000000', borderTop: '1.5px solid #000000' }}>{money(totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* Domestic India Breakdown Table (With GST Split) */
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', color: '#000000' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ padding: '5px 8px', color: '#000000', fontWeight: '700' }}>Sub Total</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '700', color: '#000000' }}>{money(baseAmount)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ padding: '5px 8px', color: '#000000', fontWeight: '600' }}>IGST ({invoice.gstRate || 18}%)</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '600', color: '#000000' }}>{igstAmount > 0 ? money(igstAmount) : '-'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ padding: '5px 8px', color: '#000000', fontWeight: '600' }}>SGST (9%)</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '600', color: '#000000' }}>{sgstAmount > 0 ? money(sgstAmount) : '-'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ padding: '5px 8px', color: '#000000', fontWeight: '600' }}>CGST (9%)</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '600', color: '#000000' }}>{cgstAmount > 0 ? money(cgstAmount) : '-'}</td>
                    </tr>
                    <tr style={{ background: '#f5f5f5', fontWeight: '800' }}>
                      <td style={{ padding: '7px 8px', fontSize: '11px', color: '#000000', borderTop: '1.5px solid #000000' }}>Total Amount</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: '11px', color: '#000000', borderTop: '1.5px solid #000000' }}>{money(totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Payment Details + Authorized Signatory */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '14px',
          padding: '10px 14px',
          background: '#ffffff',
          borderRadius: '4px',
          border: '1.5px solid #000000',
          color: '#000000',
        }}
      >
        <div style={{ width: '62%' }}>
          <div style={{ fontWeight: '800', fontSize: '11px', color: '#000000', marginBottom: '6px' }}>
            Payment Details
          </div>
          <table style={{ fontSize: '10px', lineHeight: '1.6', color: '#000000' }}>
            <tbody>
              <tr>
                <td style={{ color: '#000000', paddingRight: '12px', fontWeight: '600' }}>Amount Received:</td>
                <td style={{ fontWeight: '800', color: '#000000' }}>{money(totalAmount)}</td>
              </tr>
              <tr>
                <td style={{ color: '#000000', paddingRight: '12px', fontWeight: '600' }}>Payment Mode:</td>
                <td style={{ fontWeight: '700', color: '#000000' }}>{invoice.paymentMethod || 'Online / Payment Gateway'}</td>
              </tr>
              <tr>
                <td style={{ color: '#000000', paddingRight: '12px', fontWeight: '600' }}>Payment Reference No.:</td>
                <td style={{ fontWeight: '700', color: '#000000' }}>{invoice.paymentReferenceNo || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Official Rubber Stamp & Signature */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 8px',
          }}
        >
          <img
            src="/stamp.png"
            alt="Authorised Signatory"
            style={{
              width: '135px',
              height: '145px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#000000', marginTop: '2px', textAlign: 'center' }}>
            Authorised Signatory
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1.5px solid #000000',
          fontSize: '9.5px',
          color: '#000000',
          lineHeight: '1.45',
        }}
      >
        <div style={{ fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
          TERMS &amp; CONDITIONS:
        </div>
        <div style={{ display: 'grid', rowGap: '2px', color: '#000000', fontWeight: '500' }}>
          <div>• Subscription once purchased is non-cancellable and non-refundable.</div>
          <div>• This is a one-time subscription valid only for the selected duration.</div>
          <div>• Services will be activated immediately after successful payment confirmation.</div>
          <div>• LogisticsScanner is not responsible for any indirect business outcomes or losses.</div>
          <div>• All disputes are subject to New Delhi jurisdiction only.</div>
        </div>
      </div>

      {/* Thank you Footer */}
      <div
        style={{
          marginTop: '10px',
          paddingTop: '6px',
          borderTop: '1.5px solid #000000',
          textAlign: 'center',
          fontWeight: '800',
          fontSize: '10.5px',
          color: '#000000',
          letterSpacing: '0.5px',
        }}
      >
        Thank you for partnering with Logistics Scanner!
      </div>
    </div>
  );
};

export default InvoiceTemplate;

