import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUserLoggedIn = async () => {
            const token = localStorage.getItem('userToken');
            if (token) {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    };
                    const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, config);
                    setUser(data);
                } catch (error) {
                    console.error("Token verification failed:", error);
                    localStorage.removeItem('userToken');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkUserLoggedIn();
    }, []);

    const login = async (email, password, role) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, { email, password, role });
            localStorage.setItem('userToken', data.token);
            // Clear any lingering adminToken on fresh user login
            sessionStorage.removeItem('adminToken');
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
                isVerified: error.response?.data?.isVerified,
                email: error.response?.data?.email
            };
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, userData);
            if (data.isVerified === false) {
                return { success: true, needsVerification: true, email: data.email };
            }
            localStorage.setItem('userToken', data.token);
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const verifyOtp = async (email, otp) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-otp`, { email, otp });
            localStorage.setItem('userToken', data.token);
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'OTP verification failed'
            };
        }
    };

    const resendOtp = async (email) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/resend-otp`, { email });
            return { success: true, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Resending OTP failed'
            };
        }
    };

    const forgotPassword = async (email, phone) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, { email, phone });
            return { success: true, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Request failed'
            };
        }
    };

    const resetPassword = async (email, otp, newPassword) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, { email, otp, newPassword });
            return { success: true, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Reset password failed'
            };
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const token = localStorage.getItem('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            const { data } = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, profileData, config);
            setUser(data);
            return { success: true, data };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Profile update failed'
            };
        }
    };

    const deleteAccount = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, config);
            localStorage.removeItem('userToken');
            setUser(null);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Account deletion failed'
            };
        }
    };

    const reloadUserProfile = async () => {
        const token = localStorage.getItem('userToken');
        if (token) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                };
                const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, config);
                setUser(data);
            } catch (error) {
                console.error("Failed to reload profile:", error);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('userToken');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        updateProfile,
        deleteAccount,
        logout,
        reloadUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
