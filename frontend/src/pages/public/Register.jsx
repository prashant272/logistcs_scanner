import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import CountrySelect from '../../components/common/CountrySelect';
import useSEO from '../../hooks/useSEO';

const Register = () => {
    useSEO({
        title: 'Register on Logistics Scanner | Join Our Logistics Marketplace',
        description: 'Create an account on Logistics Scanner to find reliable shipping partners, compare transport rates, and optimize your global logistics network.',
        keywords: 'logistics scanner, freight rate comparison, shipping rates online, logistics platform India, freight forwarding services'
    });

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        organizationName: '',
        country: '',
        phoneCode: '+91',
        phone: ''
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // OTP states
    const [otpStep, setOtpStep] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState('');
    const [resendLoading, setResendLoading] = useState(false);

    const { register, verifyOtp, resendOtp } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            setLoading(false);
            return;
        }

        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        const fullPhone = `${formData.phoneCode} ${formData.phone}`.trim();

        const result = await register({
            name: fullName,
            email: formData.email,
            password: formData.password,
            phone: fullPhone,
            company: formData.organizationName,
            address: formData.country,
            role: 'customer'
        });

        if (result.success) {
            if (result.needsVerification) {
                setOtpStep(true);
                setOtpSuccess('OTP has been successfully sent!');
            } else {
                navigate('/');
            }
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setOtpError('');
        setOtpSuccess('');
        setLoading(true);

        const result = await verifyOtp(formData.email, otpCode);
        if (result.success) {
            navigate('/');
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

    return (
        <div className="w-full min-h-screen bg-[#f8f9fa] flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-6xl w-full bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col md:flex-row overflow-hidden border border-gray-100 min-h-[650px]">
                
                {/* Left Column: Quotes & Testimonials */}
                <div className="w-full md:w-5/12 bg-slate-50 p-8 flex flex-col justify-start pt-16 lg:pt-20 relative overflow-hidden hidden md:flex border-r border-slate-100">
                    {/* Background Soft Glow Elements */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <div className="absolute w-64 h-64 bg-orange-100 rounded-full blur-[80px] -top-20 -left-20 opacity-40"></div>
                        <div className="absolute w-64 h-64 bg-sky-100 rounded-full blur-[80px] -bottom-20 -right-20 opacity-30"></div>
                    </div>

                    <div className="w-full max-w-sm mx-auto space-y-10 z-10">
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black leading-[1.1] !text-slate-900 mb-6 tracking-tight">
                                Find the best <br/>
                                freight quote
                            </h2>
                            <p className="!text-slate-700 text-base leading-relaxed font-semibold">
                                Welcome to Logistics Scanner! To get started, please fill out the form to create your account and begin using our services.
                            </p>
                        </div>

                        {/* Testimonial Card 1 (Blue gradient background) */}
                        <div className="bg-gradient-to-br from-[#00b2fe] to-[#0092d0] p-6 rounded-2xl text-white shadow-[0_10px_25px_rgba(0,178,254,0.25)] relative group hover:scale-[1.02] transition-all hover:shadow-[0_15px_30px_rgba(0,178,254,0.35)]">
                            <h4 className="font-extrabold text-lg text-white mb-2">Stefan Rogovskiy</h4>
                            <p className="text-sm text-white/95 leading-relaxed font-semibold">
                                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text."
                            </p>
                        </div>

                        {/* Testimonial Card 2 (White premium background) */}
                        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl text-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-slate-100 relative group hover:scale-[1.02] transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)]">
                            <h4 className="font-extrabold text-lg !text-slate-900 mb-2">George Smith</h4>
                            <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Register Form */}
                <div className="w-full md:w-7/12 flex items-start justify-center p-8 md:p-12 lg:p-16 pt-10 bg-white relative">
                    <div className="w-full max-w-lg">
                        
                        <div className="text-center md:text-left mb-6">
                            <h2 className="text-3xl font-extrabold !text-slate-900 tracking-tight">Customer Sign Up</h2>
                            <p className="mt-1 text-slate-500 font-medium text-sm">
                                Make your booking experience excellent
                            </p>
                        </div>

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
                                    className="w-full flex justify-center items-center py-3.5 mt-6 rounded-xl text-sm font-extrabold text-white bg-[#00b2fe] hover:bg-[#009bdc] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md cursor-pointer uppercase tracking-wider"
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
                                        Change Registration Info
                                    </button>
                                </div>
                            </form>
                        ) : (
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

                                {/* Name Fields (Side by Side) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-xs font-bold !text-slate-900 mb-1">
                                            First name <span className="text-red-500">*</span>
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
                                            Last name <span className="text-red-500">*</span>
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
                                        name="organizationName"
                                        required
                                        value={formData.organizationName}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white !text-slate-900 font-medium focus:outline-none focus:border-[#00b2fe] focus:ring-2 focus:ring-[#00b2fe]/10 transition-all placeholder:text-slate-400 text-sm"
                                        placeholder="Organization name"
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

                                {/* Create Account Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3.5 mt-6 rounded-xl text-sm font-extrabold text-white bg-[#00b2fe] hover:bg-[#009bdc] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md cursor-pointer uppercase tracking-wider"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <span>Create account</span>
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

                                {/* Back to Sign In */}
                                <div className="text-center mt-4 text-xs font-semibold !text-slate-700">
                                    Back to{' '}
                                    <Link to="/login" className="text-[#00b2fe] hover:underline font-extrabold">
                                        Sign In
                                    </Link>
                                </div>
                            </form>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Register;
