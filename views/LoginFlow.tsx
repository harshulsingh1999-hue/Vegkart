
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useToast } from '../providers/ToastProvider';
import { User, Role } from '../types';
import { useGlobalSystem } from '../providers/GlobalSystemProvider';
import { GlobeAltIcon } from '../components/ui/Icons';
import { IAMService } from '../services/IAMService';

// Icons specific to Login Flow
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const ShopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const EmployeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const DeliveryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>;
const OfficeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;

const GoogleIcon = () => <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.01-.19.01-.38.01-.58z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
const AppleIcon = () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.23-.93.63 0 2.45.41 3.24 1.51-3.02 1.95-2.11 7.17 1.45 8.73-.78 1.5-1.54 2.5-2.3 3.12zM12.03 5.34c-1.36-.12-2.47-1.25-2.23-2.95 1.6-.13 2.81 1.1 2.23 2.95z"/></svg>;

const LoginFlow: React.FC = () => {
    // Flow States: PHONE -> OTP -> (User Exists? DASHBOARD_SELECT : ACCOUNT_TYPE)
    type LoginStep = 'PHONE' | 'OTP' | 'ACCOUNT_TYPE' | 'EMPLOYEE_SUB_TYPE' | 'DASHBOARD_SELECT';

    const [step, setStep] = useState<LoginStep>('PHONE');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [existingUser, setExistingUser] = useState<User | null>(null);
    const [isSSOLoading, setIsSSOLoading] = useState(false);

    const users = useStore(state => state.users);
    const login = useStore(state => state.login);
    const loginWithSSO = useStore(state => state.loginWithSSO);
    const updateUserProfile = useStore(state => state.updateUserProfile);
    const { showToast } = useToast();
    const { t, language, setLanguage } = useGlobalSystem(); 

    useEffect(() => {
        setStep('PHONE');
    }, []);

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length === 10 && /^\d+$/.test(phone)) {
            const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
            setGeneratedOtp(newOtp);
            setStep('OTP');
            showToast(`OTP Sent to ${phone}: ${newOtp}`, 'info');
            
            const user = users.find(u => u.phone === phone);
            setExistingUser(user || null);
        } else {
            showToast('Please enter a valid 10-digit phone number.', 'error');
        }
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp === generatedOtp || otp === '1234') {
            showToast('Mobile Verified Successfully', 'success');
            
            if (existingUser) {
                // User exists -> Go to Dashboard Selection
                setStep('DASHBOARD_SELECT');
            } else {
                // New User -> Go to Account Type Selection
                setStep('ACCOUNT_TYPE');
            }
        } else {
            showToast('Invalid OTP. Please try again.', 'error');
        }
    };

    const handleSSO = async (provider: 'google' | 'apple') => {
        setIsSSOLoading(true);
        try {
            const profile = await IAMService.mockSSOLogin(provider);
            loginWithSSO(profile);
            
            // Check if user has roles setup
            const user = users.find(u => u.email === profile.email);
            if (user && user.roles && user.roles.length > 0) {
                setExistingUser(user);
                setStep('DASHBOARD_SELECT');
                showToast(`Authenticated with ${provider}`, 'success');
            } else {
                // New user via SSO
                setStep('ACCOUNT_TYPE');
                showToast('Welcome! Please select your account type.', 'success');
            }
        } catch (e) {
            showToast('SSO Failed. Please try again.', 'error');
        } finally {
            setIsSSOLoading(false);
        }
    };

    const handleRoleSelection = (selectedRole: Role) => {
        // This function is only called when creating a NEW role/account
        const user = login(phone, selectedRole);
        
        if (user) {
            // Force Profile Setup for this new role
            updateUserProfile({ 
                role: selectedRole,
                isProfileComplete: false 
            }); 
        }
    };

    // Helper to check profile completeness before entering dashboard
    const checkProfileCompleteness = (user: User, role: Role): boolean => {
        if (!user.name) return false;
        switch (role) {
            case 'seller': return !!(user.businessName && user.gstin !== undefined);
            case 'delivery': return !!(user.vehicleDetails);
            case 'staff':
            case 'admin': return !!(user.employeeId);
            case 'customer': default: return true;
        }
    };

    const handleDashboardSelect = (role: Role) => {
        if (!existingUser) return;
        login(phone); // Restore session
        
        const isComplete = checkProfileCompleteness(existingUser, role);
        updateUserProfile({ 
            role,
            isProfileComplete: isComplete
        });
        
        showToast(`Entering ${role} dashboard...`, 'success');
    };

    const hasRole = (role: Role) => existingUser?.roles?.includes(role);

    const handleAddProfile = () => {
        setStep('ACCOUNT_TYPE');
    };

    // --- Components for Selection Cards ---
    const RoleCard = ({ icon: Icon, titleKey, onClick, colorClass }: any) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-6 bg-white border-2 border-transparent rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 group ${colorClass}`}
        >
            <div className="mb-3 text-gray-500 group-hover:scale-110 transition-transform duration-200">
                <Icon />
            </div>
            <span className="font-bold text-gray-800 text-center">{t(titleKey)}</span>
        </button>
    );

    const fillDemo = (number: string) => setPhone(number);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 font-sans p-4">
            {/* Global Language Switcher */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button 
                    onClick={() => setLanguage('en')} 
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'en' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 shadow-sm'}`}
                >
                    English
                </button>
                <button 
                    onClick={() => setLanguage('hi')} 
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'hi' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 shadow-sm'}`}
                >
                    हिंदी
                </button>
                <button 
                    onClick={() => setLanguage('es')} 
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'es' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 shadow-sm'}`}
                >
                    ES
                </button>
            </div>

            <div className="w-full max-w-md">
                
                {/* Header Logo */}
                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-3xl font-extrabold text-green-600 tracking-tight">Veggie-Verse</h1>
                    <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest">{t('app_tagline')}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 relative overflow-hidden">
                    {/* Decorative Blob */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-50 rounded-full blur-3xl"></div>

                    {/* STEP 1: PHONE NUMBER */}
                    {step === 'PHONE' && (
                        <div className="animate-fade-in relative z-10">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">{t('login_title')}</h2>
                            <form onSubmit={handleSendOtp}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('mobile_label')}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-gray-500 font-medium">+91</span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow outline-none"
                                        placeholder="Enter 10-digit number"
                                        maxLength={10}
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="w-full mt-6 py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-green-500 hover:to-green-600 transition-all transform active:scale-95">
                                    {t('get_otp')}
                                </button>
                            </form>

                            {/* SSO Options */}
                            <div className="mt-6">
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-gray-200"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Or Continue With</span>
                                    <div className="flex-grow border-t border-gray-200"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button 
                                        type="button"
                                        onClick={() => handleSSO('google')}
                                        disabled={isSSOLoading}
                                        className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold text-gray-600"
                                    >
                                        <GoogleIcon /> Google
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleSSO('apple')}
                                        disabled={isSSOLoading}
                                        className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold text-gray-600"
                                    >
                                        <AppleIcon /> Apple
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <p className="text-xs text-center text-gray-400 mb-3">{t('try_demo')}</p>
                                <div className="flex justify-center gap-2 flex-wrap">
                                    <button onClick={() => fillDemo('9876543210')} className="text-xs bg-green-50 border border-green-100 px-3 py-1.5 rounded-full hover:bg-green-100 text-green-700 font-bold transition">Cust</button>
                                    <button onClick={() => fillDemo('1234567890')} className="text-xs bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 text-blue-700 font-bold transition">Sell</button>
                                    <button onClick={() => fillDemo('5555555555')} className="text-xs bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full hover:bg-orange-100 text-orange-700 font-bold transition">Del</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: OTP VERIFICATION */}
                    {step === 'OTP' && (
                        <div className="animate-fade-in text-center relative z-10">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('verify_title')}</h2>
                            <p className="text-sm text-gray-500 mb-6">{t('enter_otp')} <span className="font-bold text-gray-800">+91 {phone}</span> <button onClick={() => setStep('PHONE')} className="text-green-600 underline ml-1">Edit</button></p>
                            
                            <form onSubmit={handleVerifyOtp}>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="block w-full text-center text-3xl tracking-[0.5em] py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-50 focus:border-green-500 outline-none transition-all font-mono"
                                    placeholder="0000"
                                    maxLength={4}
                                    autoFocus
                                />
                                <p className="text-xs text-gray-400 mt-4">Demo OTP: <span className="font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{generatedOtp}</span></p>
                                <button type="submit" className="w-full mt-6 py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-green-500 hover:to-green-600 transition-all transform active:scale-95">
                                    {t('verify_proceed')}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* STEP 3: ACCOUNT TYPE SELECTION (Icons) */}
                    {step === 'ACCOUNT_TYPE' && (
                        <div className="animate-fade-in relative z-10">
                            <h2 className="text-xl font-bold text-center text-gray-800 mb-6">{t('choose_account')}</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {!hasRole('customer') && (
                                    <RoleCard 
                                        icon={UserIcon} 
                                        titleKey="role_customer" 
                                        onClick={() => handleRoleSelection('customer')}
                                        colorClass="hover:border-green-500 hover:bg-green-50 text-green-600"
                                    />
                                )}
                                {!hasRole('seller') && (
                                    <RoleCard 
                                        icon={ShopIcon} 
                                        titleKey="role_seller" 
                                        onClick={() => handleRoleSelection('seller')}
                                        colorClass="hover:border-blue-500 hover:bg-blue-50 text-blue-600"
                                    />
                                )}
                                <div className="col-span-2">
                                    <RoleCard 
                                        icon={EmployeeIcon} 
                                        titleKey="role_employee" 
                                        onClick={() => setStep('EMPLOYEE_SUB_TYPE')}
                                        colorClass="hover:border-gray-500 hover:bg-gray-50 text-gray-600"
                                    />
                                </div>
                            </div>
                            {existingUser && (
                                <button onClick={() => setStep('DASHBOARD_SELECT')} className="mt-6 w-full py-2 text-sm text-gray-500 hover:text-gray-800 font-medium">
                                    {t('cancel_back')}
                                </button>
                            )}
                        </div>
                    )}

                    {/* STEP 4: EMPLOYEE SUB-SELECTION (Icons) */}
                    {step === 'EMPLOYEE_SUB_TYPE' && (
                        <div className="animate-fade-in relative z-10">
                            <div className="flex items-center mb-4">
                                <button onClick={() => setStep('ACCOUNT_TYPE')} className="text-gray-400 hover:text-gray-800 p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <h2 className="text-xl font-bold text-gray-800 ml-2">{t('select_role')}</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {!hasRole('delivery') && (
                                    <RoleCard 
                                        icon={DeliveryIcon} 
                                        titleKey="role_delivery" 
                                        onClick={() => handleRoleSelection('delivery')}
                                        colorClass="hover:border-orange-500 hover:bg-orange-50 text-orange-600 col-span-2"
                                    />
                                )}
                                {!hasRole('staff') && (
                                    <RoleCard 
                                        icon={OfficeIcon} 
                                        titleKey="role_office" 
                                        onClick={() => handleRoleSelection('staff')}
                                        colorClass="hover:border-purple-500 hover:bg-purple-50 text-purple-600"
                                    />
                                )}
                                {!hasRole('admin') && (
                                    <RoleCard 
                                        icon={AdminIcon} 
                                        titleKey="role_admin" 
                                        onClick={() => handleRoleSelection('admin')}
                                        colorClass="hover:border-red-500 hover:bg-red-50 text-red-600"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 5: EXISTING USER DASHBOARD SELECT */}
                    {step === 'DASHBOARD_SELECT' && existingUser && (
                        <div className="animate-fade-in relative z-10">
                            <div className="text-center mb-6">
                                <p className="text-gray-500 text-sm font-medium">{t('welcome_back')}</p>
                                <h2 className="text-2xl font-bold text-gray-800">{existingUser.name || 'User'}</h2>
                            </div>
                            
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('continue_as')}</p>
                            
                            <div className="space-y-3 mb-8">
                                {(existingUser.roles || [existingUser.role]).map(role => (
                                    <button
                                        key={role}
                                        onClick={() => handleDashboardSelect(role)}
                                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-green-100 transition-colors">
                                                {role === 'customer' && <svg className="w-6 h-6 text-gray-600 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                                {role === 'seller' && <svg className="w-6 h-6 text-gray-600 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                                                {role === 'delivery' && <svg className="w-6 h-6 text-gray-600 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>}
                                                {(role === 'staff' || role === 'admin') && <svg className="w-6 h-6 text-gray-600 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                                            </div>
                                            <span className="font-bold text-gray-700 capitalize">{role === 'staff' ? t('role_office') : t(`role_${role}` as any)}</span>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-300 group-hover:text-green-500 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={handleAddProfile} 
                                className="w-full py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-600 font-bold rounded-xl hover:shadow-md hover:from-gray-100 hover:to-gray-200 transition-all flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                {t('add_account')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginFlow;
