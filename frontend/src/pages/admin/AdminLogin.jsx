import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
    const [email, setEmail] = useState('admin@biryaniyoyo.com');
    const [password, setPassword] = useState('admin@2026');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/login`, { email, password });
            localStorage.setItem('adminToken', data.token);
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900">
            <div className="bg-dark-800 p-8 rounded-lg border border-white/10 w-full max-w-md shadow-2xl">
                <h2 className="text-3xl font-display text-gold-gradient mb-6 text-center">Admin Login</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="hidden">
                        <label className="block text-gray-400 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-gold focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-gold focus:outline-none"
                        />
                    </div>
                    <button className="w-full bg-gold text-black font-bold py-3 hover:bg-white transition-colors uppercase tracking-widest">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
