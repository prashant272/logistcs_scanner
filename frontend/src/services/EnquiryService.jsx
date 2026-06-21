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

  const fetchVendorEnquiries = async (type) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/enquiries/vendor?type=${type}`);
      setLimitReached(res.headers['x-limit-reached'] === 'true');
      setEnquiries(res.data || []);
      return res.data;
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      setError(err.response?.data?.message || 'Could not retrieve enquiries.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorBookings = async (type) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/enquiries/vendor?type=${type}&isBooking=true`);
      setLimitReached(res.headers['x-limit-reached'] === 'true');
      return res.data || [];
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Could not retrieve bookings.');
      throw err;
    } finally {
      setLoading(false);
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

  const updateEnquiryStatus = async (id, status, typeContext, price) => {
    try {
      setError(null);
      const payload = {};
      if (status) payload.status = status;
      if (price !== undefined && price !== null) payload.price = price;
      
      const res = await api.put(`/enquiries/${id}/status`, payload);
      
      // Update state locally
      setEnquiries((prev) => 
        prev.map((e) => 
          e._id === id 
            ? { ...e, status: status || e.status, price: price !== undefined ? price : e.price } 
            : e
        )
      );
      return res.data;
    } catch (err) {
      console.error('Error updating enquiry status:', err);
      setError(err.response?.data?.message || 'Error updating status');
      throw err;
    }
  };

  const fetchClientEnquiries = async (type) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/enquiries/client?type=${type}`);
      setEnquiries(res.data || []);
      return res.data;
    } catch (err) {
      console.error('Error fetching client enquiries:', err);
      setError(err.response?.data?.message || 'Could not retrieve enquiries.');
      throw err;
    } finally {
      setLoading(false);
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
