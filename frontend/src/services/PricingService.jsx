import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const PricingContext = createContext();

export const usePricing = () => {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  return context;
};

export const PricingProvider = ({ children }) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/pricing/vendor');
      setRates(res.data || []);
      return res.data;
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError(err.response?.data?.message || 'Error fetching rates');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addRate = async (payload) => {
    try {
      setError(null);
      const res = await api.post('/pricing', payload);
      return res.data;
    } catch (err) {
      console.error('Error adding rate:', err);
      setError(err.response?.data?.message || 'Error adding rate');
      throw err;
    }
  };

  const toggleRateStatus = async (id) => {
    try {
      setError(null);
      const res = await api.put(`/pricing/${id}/toggle`, {});
      setRates((prev) => prev.map((r) => (r._id === id ? res.data : r)));
      return res.data;
    } catch (err) {
      console.error('Error toggling rate status:', err);
      setError(err.response?.data?.message || 'Error toggling rate status');
      throw err;
    }
  };

  const deleteRate = async (id) => {
    try {
      setError(null);
      const res = await api.delete(`/pricing/${id}`);
      setRates((prev) => prev.filter((r) => r._id !== id));
      return res.data;
    } catch (err) {
      console.error('Error deleting rate:', err);
      setError(err.response?.data?.message || 'Error deleting rate');
      throw err;
    }
  };

  const updateRate = async (id, payload) => {
    try {
      setError(null);
      const res = await api.put(`/pricing/${id}`, payload);
      setRates((prev) => prev.map((r) => (r._id === id ? res.data : r)));
      return res.data;
    } catch (err) {
      console.error('Error updating rate:', err);
      setError(err.response?.data?.message || 'Error updating rate');
      throw err;
    }
  };

  const searchRates = async (payload) => {
    try {
      const res = await api.post('/pricing/search', payload);
      return res.data;
    } catch (err) {
      console.error('Error searching rates:', err);
      throw err;
    }
  };

  return (
    <PricingContext.Provider
      value={{
        rates,
        setRates,
        loading,
        error,
        fetchRates,
        addRate,
        toggleRateStatus,
        deleteRate,
        updateRate,
        searchRates,
      }}
    >
      {children}
    </PricingContext.Provider>
  );
};
