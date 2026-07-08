import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowRight, Activity, Phone } from 'lucide-react';
import useSEO from '../../hooks/useSEO';

const Login = () => {
    useSEO({
        title: 'Login to Logistics Scanner | Manage Your Freight Operations',
        description: 'Login to your Logistics Scanner account to manage your cargo shipping, track shipments, and compare freight rates from top logistics vendors.',
        keywords: 'logistics scanner, freight rate comparison, shipping rates online, logistics platform India, freight forwarding services'
    });

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, verifyOtp, resendOtp, forgotPassword, resetPassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState(location.state?.error || '');
    const [loading, setLoading] = useState(false);

    // OTP states
    const [otpStep, setOtpStep] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState('');
    const [resendLoading, setResendLoading] = useState(false);

    // Forgot Password states
    const [forgotStep, setForgotStep] = useState(null); // null, 'request', 'reset'
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotPhone, setForgotPhone] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password, 'customer');

        if (result.success) {
            const redirectPath = from === '/' ? '/customer' : from;
            navigate(redirectPath, { replace: true });
        } else {
            setError(result.message);
            if (result.isVerified === false) {
                setOtpStep(true);
                setOtpSuccess('Please enter the OTP sent to your email to verify your account.');
            }
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setOtpError('');
        setOtpSuccess('');
        setLoading(true);

        const result = await verifyOtp(email, otpCode);
        if (result.success) {
            const redirectPath = from === '/' ? '/customer' : from;
            navigate(redirectPath, { replace: true });
        } else {
            setOtpError(result.message || 'Verification failed. Please try again.');
        }
        setLoading(false);
    };

    const handleResendOtp = async () => {
        setOtpError('');
        setOtpSuccess('');
        setResendLoading(true);

        const result = await resendOtp(email);
        if (result.success) {
            setOtpSuccess(result.message || 'OTP resent successfully!');
        } else {
            setOtpError(result.message || 'Failed to resend OTP.');
        }
        setResendLoading(false);
    };

    const handleForgotPasswordRequest = async (e) => {
        e.preventDefault();
        setError('');
        setOtpSuccess('');
        setLoading(true);

        const result = await forgotPassword(forgotEmail, forgotPhone);
        if (result.success) {
            setOtpSuccess(result.message || 'OTP sent successfully!');
            setForgotStep('reset');
        } else {
            setError(result.message || 'Failed to send OTP.');
        }
        setLoading(false);
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setOtpSuccess('');

        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match!');
            return;
        }

        setLoading(true);
        const result = await resetPassword(forgotEmail, forgotOtp, newPassword);
        if (result.success) {
            setForgotStep(null);
            setEmail(forgotEmail);
            setForgotEmail('');
            setForgotPhone('');
            setForgotOtp('');
            setNewPassword('');
            setConfirmNewPassword('');
            setOtpSuccess('Password reset successful. Please sign in with your new password.');
        } else {
            setError(result.message || 'Failed to reset password.');
        }
        setLoading(false);
    };

    return (
        <div className="w-full min-h-screen bg-[#f8f9fa] flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-6xl w-full bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col md:flex-row overflow-hidden border border-gray-100 min-h-[600px]">
                
                {/* Left Column: Brand & Visuals */}
                <div className="w-full md:w-5/12 bg-gradient-to-tr from-orange-100/30 via-slate-50/50 to-orange-50/40 p-12 flex flex-col justify-between text-slate-900 relative overflow-hidden hidden md:flex border-r border-slate-100">
                    {/* Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <div className="absolute w-64 h-64 bg-orange-200 rounded-full blur-[80px] -top-20 -left-20 opacity-50"></div>
                        <div className="absolute w-64 h-64 bg-amber-100 rounded-full blur-[80px] -bottom-20 -right-20 opacity-40"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md mb-8 border border-slate-100">
                            <Activity className="text-orange-500 w-8 h-8" />
                        </div>
                        
                        <h2 className="text-4xl lg:text-5xl font-black leading-[1.1] mb-6 tracking-tight !text-slate-900">
                            Unlock Your <br/>
                            <span className="text-[#ff5500]">Shipping</span> Potential.
                        </h2>
                        <p className="!text-slate-800 text-lg max-w-sm leading-relaxed font-semibold">
                            Join the elite club of top shipping professionals. Access premium logistics tools and skyrocket your deliveries.
                        </p>
                    </div>

                    <div className="relative z-10 mt-16 bg-white/70 border border-slate-100/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold !text-slate-900 text-sm mb-1">Bank-Grade Security</h3>
                                <p className="text-xs !text-slate-800 leading-relaxed font-semibold">
                                    Your data is protected with state-of-the-art 256-bit encryption and rigorous security protocols.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Login Form */}
                <div className="w-full md:w-7/12 flex items-start justify-center p-8 md:p-16 lg:p-20 pt-12 md:pt-16 bg-white relative">
                    <div className="w-full max-w-md">
                        {otpStep ? (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="text-center md:text-left mb-6">
                                    <h2 className="text-3xl font-extrabold !text-slate-900 tracking-tight">Verify Your Account</h2>
                                    <p className="mt-2 text-slate-500 font-medium text-sm leading-relaxed">
                                        Please enter the 6-digit OTP verification code sent to <span className="font-bold text-slate-800">{email}</span>.
                                    </p>
                                </div>

                                {otpError && (
                                    <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-100 flex items-center gap-2 font-medium shadow-sm">
                                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">!</div>
                                        <span>{otpError}</span>
                                    </div>
                                )}

                                {otpSuccess && (
                                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-sm border border-emerald-100 flex items-center gap-2 font-medium shadow-sm">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">✓</div>
                                        <span>{otpSuccess}</span>
                                    </div>
                                )}

                                <div className="group">
                                    <label className="block text-xs font-bold !text-slate-900 mb-2">
                                        6-Digit OTP Code
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        required
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full text-center tracking-[1em] text-2xl font-black px-4 py-3 border border-slate-200 rounded-xl bg-white !text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-slate-300"
                                        placeholder="000000"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3.5 mt-6 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md cursor-pointer uppercase tracking-wider"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <span>Verify OTP</span>
                                    )}
                                </button>

                                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-6 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resendLoading}
                                        className="text-sm font-extrabold text-orange-600 hover:underline cursor-pointer disabled:opacity-50"
                                    >
                                        {resendLoading ? 'Resending...' : 'Resend OTP'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOtpStep(false)}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            </form>
                        ) : forgotStep === 'request' ? (
                            /* FORGOT PASSWORD REQUEST OTP FORM */
                            <form onSubmit={handleForgotPasswordRequest} className="space-y-6">
                                <div className="text-center md:text-left mb-6">
                                    <h2 className="text-3xl font-extrabold !text-slate-900 tracking-tight">Forgot Password</h2>
                                    <p className="mt-2 text-slate-500 font-medium text-sm leading-relaxed">
                                        Enter your registered email and mobile number to receive a 6-digit verification OTP.
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-100 flex items-center gap-2 font-medium shadow-sm">
                                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">!</div>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div className="group">
                                        <label className="block text-sm font-bold !text-slate-900 mb-2 transition-colors group-focus-within:text-orange-600">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-400"
                                                placeholder="Enter registered email"
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-bold !text-slate-900 mb-2 transition-colors group-focus-within:text-orange-600">
                                            Mobile Number
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                            </div>
                                            <input
                                                type="tel"
                                                required
                                                value={forgotPhone}
                                                onChange={(e) => setForgotPhone(e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-400"
                                                placeholder="Enter mobile (e.g. +91 9876543210)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3.5 mt-6 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md cursor-pointer uppercase tracking-wider"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <span>Send OTP</span>
                                    )}
                                </button>

                                <div className="text-center mt-6 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => { setForgotStep(null); setError(''); }}
                                        className="text-sm font-extrabold text-orange-600 hover:underline cursor-pointer"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            </form>
                        ) : forgotStep === 'reset' ? (
                            /* FORGOT PASSWORD RESET PASSWORD FORM */
                            <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
                                <div className="text-center md:text-left mb-6">
                                    <h2 className="text-3xl font-extrabold !text-slate-900 tracking-tight">Reset Password</h2>
                                    <p className="mt-2 text-slate-500 font-medium text-sm leading-relaxed">
                                        Enter the 6-digit OTP code sent to your mobile/email and set your new password.
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-100 flex items-center gap-2 font-medium shadow-sm">
                                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">!</div>
                                        <span>{error}</span>
                                    </div>
                                )}

                                {otpSuccess && (
                                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-sm border border-emerald-100 flex items-center gap-2 font-medium shadow-sm">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">✓</div>
                                        <span>{otpSuccess}</span>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div className="group">
                                        <label className="block text-xs font-bold !text-slate-900 mb-2">
                                            6-Digit OTP Code
                                        </label>
                                        <input
                                            type="text"
                                            maxLength="6"
                                            required
                                            value={forgotOtp}
                                            onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                                            className="block w-full text-center tracking-[1em] text-2xl font-black px-4 py-3 border border-slate-200 rounded-xl bg-white !text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-slate-300"
                                            placeholder="000000"
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-bold !text-slate-900 mb-2 transition-colors group-focus-within:text-orange-600">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                minLength="6"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-400"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-bold !text-slate-900 mb-2 transition-colors group-focus-within:text-orange-600">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                minLength="6"
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-400"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3.5 mt-6 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md cursor-pointer uppercase tracking-wider"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <span>Reset Password</span>
                                    )}
                                </button>

                                <div className="text-center mt-6 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => { setForgotStep(null); setError(''); }}
                                        className="text-sm font-extrabold text-orange-600 hover:underline cursor-pointer"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="text-center md:text-left mb-10">
                                    <h2 className="text-3xl lg:text-4xl font-extrabold !text-slate-900 tracking-tight">Welcome Back</h2>
                                    <p className="mt-3 !text-slate-900 font-semibold text-base">
                                        New to Logistics Scanner?{' '}
                                        <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700 transition-colors underline-offset-4 hover:underline">
                                            Create an account
                                        </Link>
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                                    {/* Dummy inputs to intercept and prevent browser autofill */}
                                    <input type="text" name="prevent_autofill_email" style={{ display: 'none' }} />
                                    <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} />
                                    
                                    {error && (
                                        <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-100 flex items-center gap-2 font-medium shadow-sm">
                                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">!</div>
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {otpSuccess && (
                                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-sm border border-emerald-100 flex items-center gap-2 font-medium shadow-sm">
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">✓</div>
                                            <span>{otpSuccess}</span>
                                        </div>
                                    )}

                                    <div className="space-y-5">
                                        <div className="group">
                                            <label className="block text-sm font-bold !text-slate-900 mb-2 transition-colors group-focus-within:text-orange-600">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                                </div>
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    autoComplete="off"
                                                    className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-400"
                                                    placeholder="Enter registered email"
                                                />
                                            </div>
                                        </div>

                                        <div className="group">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-bold !text-slate-900 transition-colors group-focus-within:text-orange-600">
                                                    Password
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setForgotStep('request');
                                                        setError('');
                                                        setOtpSuccess('');
                                                    }}
                                                    className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                                                >
                                                    Forgot password?
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                                </div>
                                                <input
                                                    type="password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    autoComplete="new-password"
                                                    className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-400 tracking-wider"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full flex justify-center items-center gap-3 py-4 mt-8 rounded-2xl text-base font-black text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_10px_25px_-5px_rgba(234,88,12,0.4)] hover:shadow-[0_15px_35px_-10px_rgba(234,88,12,0.6)] hover:-translate-y-1 cursor-pointer"
                                    >
                                        {loading ? (
                                            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                            <>
                                                <span className="relative z-10 text-white tracking-widest uppercase">Secure Sign In</span>
                                                <ArrowRight className="w-5 h-5 relative z-10 text-white group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
