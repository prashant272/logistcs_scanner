import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const EnquiryContext = createContext();

export const useEnquiries = () => {
  const context = useContext(EnquiryContext);
  if (!context) {
    throw new Error('useEnquiries must be used within an EnquiryProvider');
  }
  return context;
};

export const EnquiryProvider = ({ children }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(''); // '', 'submitting', 'success', 'error'
  const [limitReached, setLimitReached] = useState(false);

  const fetchVendorEnquiries = async (type, page = 1, limit = 10, search = '', filter = 'all') => {
    try {
      if (page === 1) setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        type,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) queryParams.append('search', search);
      if (filter && filter !== 'all') queryParams.append('filter', filter);
      
      const res = await api.get(`/enquiries/vendor?${queryParams.toString()}`);
      setLimitReached(res.headers['x-limit-reached'] === 'true');
      
      const responseData = res.data.data || res.data;
      if (page === 1) {
        setEnquiries(responseData || []);
      } else {
        setEnquiries(prev => [...prev, ...(responseData || [])]);
      }
      return res.data;
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      setError(err.response?.data?.message || 'Could not retrieve enquiries.');
      throw err;
    } finally {
      if (page === 1) setLoading(false);
    }
  };

  const fetchVendorBookings = async (type, page = 1, limit = 10) => {
    try {
      if (page === 1) setLoading(true);
      setError(null);
      const res = await api.get(`/enquiries/vendor?type=${type}&isBooking=true&page=${page}&limit=${limit}`);
      setLimitReached(res.headers['x-limit-reached'] === 'true');
      return res.data; // returns the paginated object { data, totalPages... }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Could not retrieve bookings.');
      throw err;
    } finally {
      if (page === 1) setLoading(false);
    }
  };

  const createEnquiry = async (payload) => {
    try {
      setSubmissionStatus('submitting');
      setLoading(true);
      setError(null);
      const res = await api.post('/enquiries', payload);
      setSubmissionStatus('success');
      return res.data;
    } catch (err) {
      console.error('Error creating enquiry:', err);
      const errMsg = err.response?.data?.message || 'Error creating enquiry';
      setError(errMsg);
      setSubmissionStatus('error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEnquiryStatus = async (id, status, typeContext, price, quoteDetails, targetVendorId) => {
    console.log('[updateEnquiryStatus] id:', id, 'status:', status, 'typeContext:', typeContext, 'price:', price, 'quoteDetails:', quoteDetails, 'targetVendorId:', targetVendorId);
    try {
      setError(null);
      const payload = {};
      if (status) payload.status = status;
      if (price !== undefined && price !== null) payload.price = price;
      if (quoteDetails !== undefined) payload.quoteDetails = quoteDetails;
      if (targetVendorId) payload.targetVendorId = targetVendorId;
      
      const res = await api.put(`/enquiries/${id}/status`, payload);
      console.log('[updateEnquiryStatus] API response:', res.data);
      
      // Update state locally
      setEnquiries((prev) => {
        const next = prev.map((e) => {
          if (e._id === id) {
            const updated = { ...e };
            if (typeContext === 'direct') {
              updated.myResponse = {
                status: status || (e.myResponse?.status || 'Pending'),
                price: price !== undefined ? price : (e.myResponse?.price || null),
                quoteDetails: quoteDetails !== undefined ? quoteDetails : (e.myResponse?.quoteDetails || null)
              };
            } else {
              updated.status = status || e.status;
              if (price !== undefined && price !== null) updated.price = price;
              if (quoteDetails !== undefined && quoteDetails !== null) updated.quoteDetails = quoteDetails;
            }
            console.log('[updateEnquiryStatus] Updated local item:', updated);
            return updated;
          }
          return e;
        });
        console.log('[updateEnquiryStatus] Next enquiries array:', next);
        return next;
      });
      return res.data;
    } catch (err) {
      console.error('Error updating enquiry status:', err);
      setError(err.response?.data?.message || 'Error updating status');
      throw err;
    }
  };

  const fetchClientEnquiries = async (type, page = 1, limit = 10, search = '', filter = 'all') => {
    try {
      if (page === 1) setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        type,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) queryParams.append('search', search);
      if (filter && filter !== 'all') queryParams.append('filter', filter);

      const res = await api.get(`/enquiries/client?${queryParams.toString()}`);
      
      const responseData = res.data.data || res.data;
      if (page === 1) {
        setEnquiries(responseData || []);
      } else {
        setEnquiries(prev => [...prev, ...(responseData || [])]);
      }
      return res.data;
    } catch (err) {
      console.error('Error fetching client enquiries:', err);
      setError(err.response?.data?.message || 'Could not retrieve enquiries.');
      throw err;
    } finally {
      if (page === 1) setLoading(false);
    }
  };

  return (
    <EnquiryContext.Provider
      value={{
        enquiries,
        setEnquiries,
        loading,
        error,
        submissionStatus,
        setSubmissionStatus,
        limitReached,
        fetchVendorEnquiries,
        fetchVendorBookings,
        fetchClientEnquiries,
        createEnquiry,
        updateEnquiryStatus,
      }}
    >
      {children}
    </EnquiryContext.Provider>
  );
};
