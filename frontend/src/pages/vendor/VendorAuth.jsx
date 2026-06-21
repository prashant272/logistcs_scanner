import React, { useState } from 'react';
import { Truck, Lock, User, Mail, Phone, ShieldCheck, Activity, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import CountrySelect from '../../components/common/CountrySelect';

const VendorAuth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register, verifyOtp, resendOtp, forgotPassword, resetPassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState(location.state?.error || '');
    const [loading, setLoading] = useState(false);

    // Forgot Password states
    const [forgotStep, setForgotStep] = useState(null); // null, 'request', 'reset'
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotPhoneCode, setForgotPhoneCode] = useState('+91');
    const [forgotPhone, setForgotPhone] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneCode: '+91',
        phone: '',
        company: '',
        password: '',
        confirmPassword: '',
        country: '',
        state: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // OTP verification states
    const [otpStep, setOtpStep] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState('');
    const [resendLoading, setResendLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                const result = await login(formData.email, formData.password, 'vendor');
                if (result.success) {
                    navigate('/vendor/dashboard');
                } else {
                    if (result.isVerified === false) {
                        setFormData(prev => ({ ...prev, email: result.email }));
                        setOtpStep(true);
                        setOtpSuccess('Your account is not verified. Please enter the OTP sent to your email/mobile.');
                    } else {
                        setError(result.message || "Invalid credentials");
                    }
                }
            } else {
                const fullName = `${formData.firstName} ${formData.lastName}`.trim();
                const fullPhone = `${formData.phoneCode} ${formData.phone}`.trim();

                const result = await register({
                    name: fullName,
                    email: formData.email,
                    phone: fullPhone,
                    company: formData.company,
                    password: formData.password,
                    address: `${formData.state}, ${formData.country}`,
                    role: 'vendor'
                });
                if (result.success) {
                    if (result.needsVerification) {
                        setOtpStep(true);
                        setOtpSuccess('OTP has been successfully sent!');
                    } else {
                        navigate('/vendor/dashboard');
                    }
                } else {
                    setError(result.message || "Registration failed");
                }
            }
        } catch (err) {
            setError("An error occurred during authentication.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setOtpError('');
        setOtpSuccess('');
        setLoading(true);

        const result = await verifyOtp(formData.email, otpCode);
        if (result.success) {
            navigate('/vendor/dashboard');
        } else {
            setOtpError(result.message || 'Verification failed. Please try again.');
        }
        setLoading(false);
    };

    const handleResendOtp = async () => {
        setOtpError('');
        setOtpSuccess('');
        setResendLoading(true);

        const result = await resendOtp(formData.email);
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

        const fullPhone = `${forgotPhoneCode} ${forgotPhone}`.trim();
        const result = await forgotPassword(forgotEmail, fullPhone);
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
            setFormData(prev => ({ ...prev, email: forgotEmail }));
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
        <div className="w-full min-h-screen bg-[#f4f7fc] flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-6xl w-full bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(11,30,67,0.06)] flex flex-col md:flex-row overflow-hidden border border-slate-100 min-h-[650px]">
                
                {/* Left Column: Quotes & Info Card (Was Right Column) */}
                <div className="w-full md:w-5/12 bg-slate-50 p-8 flex flex-col justify-start pt-16 lg:pt-20 relative overflow-hidden hidden md:flex border-r border-slate-100">
                    {/* Background Soft Glow Elements */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <div className="absolute w-64 h-64 bg-[#00b2fe]/10 rounded-full blur-[80px] -top-20 -left-20 opacity-40"></div>
                        <div className="absolute w-64 h-64 bg-sky-100 rounded-full blur-[80px] -bottom-20 -right-20 opacity-30"></div>
                    </div>

                    <div className="w-full max-w-sm mx-auto space-y-10 z-10">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-black leading-tight !text-slate-900 mb-6">
                                {isLogin ? (
                                    <>
                                        Access your <br/>
                                        Logistics Scanner <br/>
                                        Vendor Portal.
                                    </>
                                ) : (
                                    <>
                                        Access your <br/>
                                        Logistics Scanner <br/>
                                        Vendor Portal by <br/>
                                        creating your account.
                                    </>
                                )}
                            </h2>
                        </div>

                        {/* Testimonial Card / Toggle Prompt */}
                        <div className="bg-gradient-to-br from-[#00b2fe] to-[#0092d0] p-8 rounded-2xl text-white shadow-[0_10px_25px_rgba(0,178,254,0.25)] relative group hover:scale-[1.02] transition-all hover:shadow-[0_15px_30px_rgba(0,178,254,0.35)]">
                            <h4 className="font-extrabold text-xl text-white mb-4">
                                {isLogin ? 'Not in our Vendor Network?' : 'In our Vendor Network?'}
                            </h4>
                            <p className="text-sm text-white/95 leading-relaxed font-semibold mb-6">
                                {isLogin 
                                    ? 'Join our premium cargo and carrier team to access elite transport tools.' 
                                    : 'Sign in to access your dashboard, fleet tracker, and dispatch panel.'
                                }
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                    setOtpSuccess('');
                                }}
                                className="w-full bg-white hover:bg-slate-50 text-[#00b2fe] font-black py-3 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-sm"
                            >
                                {isLogin ? 'Register here' : 'Sign In here'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Forms (Was Left Column) */}
                <div className="w-full md:w-7/12 flex items-start justify-center p-8 md:p-12 lg:p-16 pt-10 bg-white relative">
                    <div className="w-full max-w-lg">
                        
                        {otpStep ? (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="text-center md:text-left mb-6">
                                    <h2 className="text-3xl font-extrabold !text-slate-900 tracking-tight">Verify Your Account</h2>
                                    <p className="mt-2 text-slate-500 font-medium text-sm leading-relaxed">
                                        We have sent a 6-digit OTP verification code to <span className="font-bold text-slate-800">{formData.email}</span>. Please enter it below.
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
                                        className="block w-full text-center tracking-[1em] text-2xl font-black px-4 py-3 border border-slate-200 rounded-xl bg-white !text-slate-900 focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-300"
                                        placeholder="000000"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3.5 mt-6 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#0066FF] to-[#00b2fe] hover:opacity-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#0066FF]/15 cursor-pointer uppercase tracking-wider"
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
                                        className="text-sm font-extrabold text-[#00b2fe] hover:underline cursor-pointer disabled:opacity-50"
                                    >
                                        {resendLoading ? 'Resending...' : 'Resend OTP'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOtpStep(false)}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                                    >
                                        Change Info / Go Back
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
                                        <label className="block text-sm font-bold !text-slate-900 mb-2 transition-colors group-focus-within:text-[#00b2fe]">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#00b2fe] transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#00b2fe] focus:ring-4 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400"
                                                placeholder="Enter registered email"
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-bold !text-slate-900 mb-1">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                name="phoneCode"
                                                value={forgotPhoneCode}
                                                onChange={(e) => setForgotPhoneCode(e.target.value)}
                                                className="w-24 px-3 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all text-sm"
                                            >
                                                <option value="+91">+91 (IN)</option>
                                                <option value="+1">+1 (US)</option>
                                                <option value="+44">+44 (UK)</option>
                                                <option value="+61">+61 (AU)</option>
                                            </select>
                                            <input
                                                type="tel"
                                                required
                                                value={forgotPhone}
                                                onChange={(e) => setForgotPhone(e.target.value)}
                                                className="block flex-grow px-4 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 text-sm"
                                                placeholder="Phone number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3.5 mt-6 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#0066FF] to-[#00b2fe] hover:opacity-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#0066FF]/15 cursor-pointer uppercase tracking-wider"
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
                                        className="text-sm font-extrabold text-[#00b2fe] hover:underline cursor-pointer"
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
                                            className="block w-full text-center tracking-[1em] text-2xl font-black px-4 py-3 border border-slate-200 rounded-xl bg-white !text-slate-900 focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-300"
                                            placeholder="000000"
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-bold !text-slate-900 mb-2 transition-colors group-focus-within:text-[#00b2fe]">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#00b2fe] transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                minLength="6"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#00b2fe] focus:ring-4 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-bold !text-slate-900 mb-2 transition-colors group-focus-within:text-[#00b2fe]">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#00b2fe] transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                minLength="6"
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#00b2fe] focus:ring-4 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3.5 mt-6 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#0066FF] to-[#00b2fe] hover:opacity-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#0066FF]/15 cursor-pointer uppercase tracking-wider"
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
                                        className="text-sm font-extrabold text-[#00b2fe] hover:underline cursor-pointer"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="text-center md:text-left mb-6">
                                    <h2 className="text-3xl font-extrabold !text-slate-900 tracking-tight">
                                        {isLogin ? 'Vendor Portal' : 'Vendor Sign Up'}
                                    </h2>
                                    <p className="mt-1 text-slate-500 font-medium text-sm">
                                        {isLogin ? 'Sign In to manage fleet and deliveries' : 'Make your booking experience excellent'}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
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

                                    {isLogin ? (
                                        /* VENDOR LOGIN FORM */
                                        <div className="space-y-5">
                                            <div className="group">
                                                <label className="block text-sm font-bold !text-slate-900 mb-2 transition-colors group-focus-within:text-[#00b2fe]">
                                                    Email Address
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#00b2fe] transition-colors" />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        autoComplete="off"
                                                        className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#00b2fe] focus:ring-4 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400"
                                                        placeholder="vendor@company.com"
                                                    />
                                                </div>
                                            </div>

                                            <div className="group">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-bold !text-slate-900 transition-colors group-focus-within:text-[#00b2fe]">
                                                        Password
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setForgotStep('request');
                                                            setError('');
                                                            setOtpSuccess('');
                                                        }}
                                                        className="text-sm font-bold text-[#00b2fe] hover:text-[#009bdc] transition-colors cursor-pointer"
                                                    >
                                                        Forgot password?
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#00b2fe] transition-colors" />
                                                    </div>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        required
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        autoComplete="new-password"
                                                        className="block w-full pl-12 pr-10 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 !text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#00b2fe] focus:ring-4 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 tracking-wider"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 !text-black hover:opacity-80 focus:outline-none cursor-pointer"
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* VENDOR REGISTER FORM */
                                        <div className="space-y-4">
                                            {/* Name Fields (Side by Side) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="group">
                                                    <label className="block text-xs font-bold !text-slate-900 mb-1">
                                                        First Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="firstName"
                                                        required
                                                        value={formData.firstName}
                                                        onChange={handleChange}
                                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 text-sm"
                                                        placeholder="First name"
                                                    />
                                                </div>
                                                <div className="group">
                                                    <label className="block text-xs font-bold !text-slate-900 mb-1">
                                                        Last Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="lastName"
                                                        required
                                                        value={formData.lastName}
                                                        onChange={handleChange}
                                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 text-sm"
                                                        placeholder="Last name"
                                                    />
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div className="group">
                                                <label className="block text-xs font-bold !text-slate-900 mb-1">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    autoComplete="off"
                                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 text-sm"
                                                    placeholder="Email Address"
                                                />
                                            </div>

                                            {/* Password Fields (Side by Side) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="group">
                                                    <label className="block text-xs font-bold !text-slate-900 mb-1">
                                                        Password <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="password"
                                                            required
                                                            minLength="6"
                                                            value={formData.password}
                                                            onChange={handleChange}
                                                            autoComplete="new-password"
                                                            className="block w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 text-sm"
                                                            placeholder="Password"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 !text-black hover:opacity-80 focus:outline-none cursor-pointer"
                                                        >
                                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="block text-xs font-bold !text-slate-900 mb-1">
                                                        Confirm Password <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            name="confirmPassword"
                                                            required
                                                            minLength="6"
                                                            value={formData.confirmPassword}
                                                            onChange={handleChange}
                                                            className="block w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 text-sm"
                                                            placeholder="Confirm Password"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 !text-black hover:opacity-80 focus:outline-none cursor-pointer"
                                                        >
                                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Organization Name */}
                                            <div className="group">
                                                <label className="block text-xs font-bold !text-slate-900 mb-1">
                                                    Organization Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="company"
                                                    required
                                                    value={formData.company}
                                                    onChange={handleChange}
                                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 text-sm"
                                                    placeholder="Organization Name"
                                                />
                                            </div>

                                            {/* Country Select Component */}
                                            <CountrySelect
                                                selectedCountry={formData.country}
                                                selectedPhoneCode={formData.phoneCode}
                                                onChange={({ country, phoneCode }) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        country,
                                                        phoneCode
                                                    }));
                                                }}
                                            />

                                            {/* State Field */}
                                            <div className="group">
                                                <label className="block text-xs font-bold !text-slate-900 mb-1">
                                                    State <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    required
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 text-sm"
                                                    placeholder="State Name"
                                                />
                                            </div>

                                            {/* Phone Number Input (with read-only phone code badge) */}
                                            <div className="group">
                                                <label className="block text-xs font-bold !text-slate-900 mb-1">
                                                    Phone Number <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="flex items-center px-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-extrabold text-xs select-none">
                                                        {formData.phoneCode || '+91'}
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        required
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        className="block flex-grow px-4 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 text-sm"
                                                        placeholder="Phone number"
                                                    />
                                                </div>
                                            </div>

                                            {/* Mock Captcha Box */}
                                            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between max-w-sm mt-4">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" required className="w-5 h-5 rounded cursor-pointer accent-[#00b2fe]" id="captcha" />
                                                    <label htmlFor="captcha" className="text-sm font-semibold !text-slate-700 cursor-pointer">I'm not a robot</label>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="recaptcha" className="w-8 h-8" />
                                                    <span className="text-[8px] text-slate-400 font-bold mt-1">reCAPTCHA</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-3.5 mt-6 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#0066FF] to-[#00b2fe] hover:opacity-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#0066FF]/15 cursor-pointer uppercase tracking-wider"
                                    >
                                        {loading ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                            <span>{isLogin ? 'Secure Sign In' : 'Create Account'}</span>
                                        )}
                                    </button>

                                    <div className="text-center text-xs text-slate-500 my-2">Or login with</div>

                                    {/* Google Sign In Button */}
                                    <button
                                        type="button"
                                        className="w-full flex justify-center items-center gap-3 py-3 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 transition-all font-bold text-sm shadow-sm cursor-pointer"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        <span>Google</span>
                                    </button>

                                    {/* Back to Sign In / Sign Up Link for Mobile */}
                                    <div className="text-center mt-4 text-xs font-semibold !text-slate-700 md:hidden">
                                        {isLogin ? "Not in our Vendor Network? " : "Already registered? "}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsLogin(!isLogin);
                                                setError('');
                                                setOtpSuccess('');
                                            }}
                                            className="text-[#00b2fe] hover:underline font-extrabold"
                                        >
                                            {isLogin ? 'Register here' : 'Sign In here'}
                                        </button>
                                    </div>
                                    
                                </form>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VendorAuth;
