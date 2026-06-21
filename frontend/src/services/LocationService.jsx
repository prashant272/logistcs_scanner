import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const LocationContext = createContext();

export const useLocations = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLocations, setTotalLocations] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocations = async (page = 1, limit = 10, search = '', type = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/locations?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&type=${type}`);
      setLocations(res.data.locations || []);
      setCurrentPage(res.data.currentPage || 1);
      setTotalPages(res.data.totalPages || 1);
      setTotalLocations(res.data.totalLocations || 0);
      return res.data;
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err.response?.data?.message || 'Error fetching locations');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async (query, typeParam = '', limit = 15) => {
    try {
      const res = await api.get(`/locations?limit=${limit}&search=${encodeURIComponent(query)}&type=${typeParam}`);
      return res.data.locations || [];
    } catch (err) {
      console.error('Error getting location suggestions:', err);
      return [];
    }
  };

  const addLocation = async (payload) => {
    try {
      setError(null);
      const res = await api.post('/locations', payload);
      return res.data;
    } catch (err) {
      console.error('Error adding location:', err);
      setError(err.response?.data?.message || 'Error adding location');
      throw err;
    }
  };

  const updateLocation = async (id, payload) => {
    try {
      setError(null);
      const res = await api.put(`/locations/${id}`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating location:', err);
      setError(err.response?.data?.message || 'Error updating location');
      throw err;
    }
  };

  const deleteLocation = async (id) => {
    try {
      setError(null);
      const res = await api.delete(`/locations/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error deleting location:', err);
      setError(err.response?.data?.message || 'Error deleting location');
      throw err;
    }
  };

  return (
    <LocationContext.Provider
      value={{
        locations,
        currentPage,
        totalPages,
        totalLocations,
        loading,
        error,
        fetchLocations,
        getSuggestions,
        addLocation,
        updateLocation,
        deleteLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
