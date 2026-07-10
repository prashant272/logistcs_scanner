import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

const RMLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            setError('Email and Password are required');
            return;
        }
        
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/rm/login`, { email, password });
            
            // We use the same 'adminToken' so that the admin dashboard layout works seamlessly
            sessionStorage.setItem('adminToken', data.token);
            sessionStorage.setItem('adminRole', data.role);
            sessionStorage.setItem('adminPermissions', JSON.stringify(data.permissions || []));
            sessionStorage.setItem('adminName', data.name);
            
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900">
            <div className="bg-dark-800 p-8 rounded-lg border border-white/10 w-full max-w-md shadow-2xl">
                <h2 className="text-3xl font-display text-gold-gradient mb-6 text-center">RM Login</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <div className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-gold focus:outline-none"
                            autoComplete="off"
                            placeholder="Enter your RM email"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-3 pr-10 text-white focus:border-gold focus:outline-none"
                                autoComplete="new-password"
                                placeholder="Enter password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button onClick={handleLogin} className="w-full bg-gold text-black font-bold py-3 hover:bg-white transition-colors uppercase tracking-widest">
                        Login as RM
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RMLogin;
