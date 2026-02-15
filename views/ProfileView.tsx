
import React, { useState, useEffect } from 'react';
import { useStore, verifyDeviceLock } from '../../store';
import { useToast } from '../../providers/ToastProvider';
import { Address } from '../../types';
import { 
    UserCircleIcon, 
    PhoneIcon, 
    LocationMarkerIcon, 
    PencilIcon, 
    TrashIcon, 
    PlusIcon, 
    GlobeAltIcon, 
    CheckCircleIcon,
    XMarkIcon,
    CogIcon,
    WrenchScrewdriverIcon,
    FingerPrintIcon,
    LockClosedIcon,
    LockOpenIcon
} from '../../components/ui/Icons';

const ProfileView: React.FC = () => {
    const currentUser = useStore(state => state.currentUser);
    const logout = useStore(state => state.logout);
    const updateUserProfile = useStore(state => state.updateUserProfile);
    const addAddress = useStore(state => state.addAddress);
    const updateAddress = useStore(state => state.updateAddress);
    const deleteAddress = useStore(state => state.deleteAddress);
    const performSafeCleanup = useStore(state => state.performSafeCleanup);
    
    // Biometric Actions
    const isBiometricEnabled = useStore(state => state.isBiometricEnabled);
    const enableBiometricLock = useStore(state => state.enableBiometricLock);
    const disableBiometricLock = useStore(state => state.disableBiometricLock);
    const setAppPin = useStore(state => state.setAppPin);
    
    const { showToast } = useToast();

    // --- State: Personal Details Editing ---
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');

    // --- State: Language Settings ---
    const [language, setLanguage] = useState('English');
    const languages = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil'];

    // --- State: Address Management ---
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    
    // Address Form State
    const [addrLabel, setAddrLabel] = useState('Home');
    const [addrDetails, setAddrDetails] = useState('');
    const [addrCity, setAddrCity] = useState('');
    const [addrPincode, setAddrPincode] = useState('');
    const [addrState, setAddrState] = useState('');

    // PIN change state
    const [isChangingPin, setIsChangingPin] = useState(false);
    const [newPin, setNewPin] = useState('');

    // Initialize state from current user
    useEffect(() => {
        if (currentUser) {
            setEditName(currentUser.name);
            setEditPhone(currentUser.phone);
            setLanguage(currentUser.language || 'English');
        }
    }, [currentUser]);

    // --- Handlers: Personal Details ---
    const handleSaveProfile = () => {
        if (editName.trim() === '' || editPhone.trim().length !== 10) {
            showToast('Please enter valid name and 10-digit phone.', 'error');
            return;
        }
        updateUserProfile({ name: editName, phone: editPhone });
        setIsEditingProfile(false);
        showToast('Profile updated successfully!', 'success');
    };

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        updateUserProfile({ language: lang });
        showToast(`Language set to ${lang}`, 'success');
    };

    const handleSafeCleanup = () => {
        const msg = performSafeCleanup();
        showToast(msg, 'success');
    };

    const toggleBiometric = async () => {
        if (isBiometricEnabled) {
            // Disabling needs verification
            const success = await verifyDeviceLock();
            if (success) {
                disableBiometricLock();
                showToast('Device Lock disabled.', 'info');
            } else {
                showToast('Verification failed. Cannot disable lock.', 'error');
            }
        } else {
            // Enabling needs verification
            const success = await verifyDeviceLock();
            if (success) {
                enableBiometricLock();
                showToast('Device Lock Security Enabled!', 'success');
            } else {
                showToast('Failed to setup device lock. Please ensure your device has a PIN or Biometric set up.', 'error');
            }
        }
    };

    const handlePinChange = () => {
        if (newPin.length < 4) {
            showToast('PIN must be at least 4 digits.', 'error');
            return;
        }
        setAppPin(newPin);
        setIsChangingPin(false);
        setNewPin('');
        showToast('App Encryption PIN Updated. Data re-encrypted.', 'success');
    };

    // --- Handlers: Address Management ---
    const openAddAddressModal = () => {
        setEditingAddressId(null);
        setAddrLabel('Home');
        setAddrDetails('');
        setAddrCity('');
        setAddrPincode('');
        setAddrState('');
        setIsAddressModalOpen(true);
    };

    const openEditAddressModal = (addr: Address) => {
        setEditingAddressId(addr.id);
        setAddrLabel(addr.label);
        setAddrDetails(addr.details);
        setAddrCity(addr.city);
        setAddrPincode(addr.pincode);
        setAddrState(addr.state);
        setIsAddressModalOpen(true);
    };

    const handleSaveAddress = (e: React.FormEvent) => {
        e.preventDefault();
        if (!addrDetails || !addrCity || !addrPincode || !addrState) {
            showToast('Please fill all address fields.', 'error');
            return;
        }

        const addressData = {
            label: addrLabel,
            details: addrDetails,
            city: addrCity,
            pincode: addrPincode,
            state: addrState
        };

        if (editingAddressId) {
            // Update existing
            updateAddress({ ...addressData, id: editingAddressId });
            showToast('Address updated!', 'success');
        } else {
            // Add new
            addAddress(addressData);
            showToast('New address added!', 'success');
        }
        setIsAddressModalOpen(false);
    };

    const handleDeleteAddress = (id: string) => {
        if (confirm('Are you sure you want to delete this address?')) {
            deleteAddress(id);
            showToast('Address deleted.', 'info');
        }
    };

    if (!currentUser) return null;

    return (
        <div className="pb-20 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 shadow-sm mb-4">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-full">
                        <UserCircleIcon className="w-10 h-10 text-green-700" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
                        <p className="text-sm text-gray-500">{currentUser.phone}</p>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-4">
                
                {/* 1. PERSONAL DETAILS CARD */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <UserCircleIcon className="w-5 h-5 text-gray-500" />
                            Personal Details
                        </h2>
                        {!isEditingProfile ? (
                            <button onClick={() => setIsEditingProfile(true)} className="bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1 hover:bg-green-200 px-3 py-1.5 rounded-full transition-colors">
                                <PencilIcon className="w-3 h-3" /> Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditingProfile(false)} className="text-gray-500 text-xs font-bold hover:bg-gray-200 px-3 py-1.5 rounded-full">Cancel</button>
                                <button onClick={handleSaveProfile} className="bg-green-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-green-700 px-3 py-1.5 rounded-full shadow-md">
                                    <CheckCircleIcon className="w-3 h-3" /> Save
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                            {isEditingProfile ? (
                                <input 
                                    type="text" 
                                    value={editName} 
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full border-b-2 border-green-500 bg-green-50 px-2 py-1 outline-none text-gray-800 font-medium"
                                />
                            ) : (
                                <p className="text-gray-800 font-medium text-lg">{currentUser.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mobile Number</label>
                            {isEditingProfile ? (
                                <div className="flex items-center">
                                    <span className="text-gray-500 mr-2">+91</span>
                                    <input 
                                        type="tel" 
                                        maxLength={10}
                                        value={editPhone} 
                                        onChange={e => setEditPhone(e.target.value.replace(/\D/g, ''))}
                                        className="w-full border-b-2 border-green-500 bg-green-50 px-2 py-1 outline-none text-gray-800 font-medium font-mono"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                                    <p className="text-gray-800 font-mono tracking-wide">+91 {currentUser.phone}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. APP SETTINGS (Maintenance Tool) */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <CogIcon className="w-5 h-5 text-gray-500" />
                            App Settings & Security
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        {/* Device Lock Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                    {isBiometricEnabled ? <LockClosedIcon className="w-4 h-4 text-green-600" /> : <LockOpenIcon className="w-4 h-4 text-gray-400" />}
                                    Device Lock Security
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Use your screen lock (PIN/Fingerprint) to encrypt and access the app.</p>
                            </div>
                            <button 
                                onClick={toggleBiometric}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${isBiometricEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${isBiometricEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Custom PIN Setting */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">App Encryption PIN</span>
                                <button onClick={() => setIsChangingPin(!isChangingPin)} className="text-xs text-green-600 font-bold hover:underline">
                                    {isChangingPin ? 'Cancel' : 'Change PIN'}
                                </button>
                            </div>
                            {isChangingPin ? (
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        value={newPin}
                                        onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="w-full text-center border rounded p-1 text-sm font-mono tracking-widest outline-none focus:ring-1 focus:ring-green-500"
                                        placeholder="Enter New PIN"
                                    />
                                    <button onClick={handlePinChange} className="bg-green-600 text-white px-3 rounded text-xs font-bold hover:bg-green-700">Save</button>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic">This PIN encrypts your local data. Default is set by system.</p>
                            )}
                        </div>

                        <hr className="border-gray-100" />

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">Safe Clean-up Tool</h3>
                                <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Clear temporary files and optimize app performance without deleting data.</p>
                            </div>
                            <button 
                                onClick={handleSafeCleanup}
                                className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-2 transition-all active:scale-95"
                            >
                                <WrenchScrewdriverIcon className="w-4 h-4" /> Run
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. LANGUAGE PREFERENCE */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <GlobeAltIcon className="w-5 h-5 text-gray-500" />
                            Language Preference
                        </h2>
                    </div>
                    <div className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {languages.map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => handleLanguageChange(lang)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all shadow-sm ${
                                        language === lang 
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-transparent' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:bg-green-50'
                                    }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. ADDRESS BOOK */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <LocationMarkerIcon className="w-5 h-5 text-gray-500" />
                            Saved Addresses
                        </h2>
                        <button 
                            onClick={openAddAddressModal}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 shadow hover:shadow-lg hover:from-green-500 hover:to-green-600 transition-all transform active:scale-95"
                        >
                            <PlusIcon className="w-3 h-3" /> Add New
                        </button>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {currentUser.addresses.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 italic">No addresses saved yet.</div>
                        ) : (
                            currentUser.addresses.map(addr => (
                                <div key={addr.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                            addr.label === 'Home' ? 'bg-blue-100 text-blue-700' :
                                            addr.label === 'Work' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-200 text-gray-700'
                                        }`}>{addr.label}</span>
                                        <div className="flex gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditAddressModal(addr)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full bg-blue-50">
                                                <PencilIcon className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full bg-red-50">
                                                <TrashIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-800 font-medium text-sm leading-snug mt-2">{addr.details}</p>
                                    <p className="text-gray-500 text-xs mt-1">{addr.city}, {addr.state} - {addr.pincode}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* LOGOUT */}
                <button
                    onClick={logout}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                    Log Out
                </button>
            </div>

            {/* --- ADDRESS MODAL (ADD / EDIT) --- */}
            {isAddressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                        <button 
                            onClick={() => setIsAddressModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <h3 className="text-lg font-bold text-gray-800 mb-6">
                            {editingAddressId ? 'Edit Address' : 'Add New Address'}
                        </h3>

                        <form onSubmit={handleSaveAddress} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Label</label>
                                <div className="flex gap-2">
                                    {['Home', 'Work', 'Other'].map(l => (
                                        <button
                                            key={l}
                                            type="button"
                                            onClick={() => setAddrLabel(l)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                                addrLabel === l 
                                                ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address Details</label>
                                <textarea 
                                    value={addrDetails}
                                    onChange={e => setAddrDetails(e.target.value)}
                                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Flat No, Building, Street Area"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                                    <input 
                                        type="text" 
                                        value={addrCity}
                                        onChange={e => setAddrCity(e.target.value)}
                                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Mumbai"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pincode</label>
                                    <input 
                                        type="text" 
                                        maxLength={6}
                                        value={addrPincode}
                                        onChange={e => setAddrPincode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="400001"
                                        required
                                    />
                                </div>
                            </div>

                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                                <input 
                                    type="text" 
                                    value={addrState}
                                    onChange={e => setAddrState(e.target.value)}
                                    className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Maharashtra"
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-green-500 hover:to-green-600 transition-all transform active:scale-95 mt-2"
                            >
                                Save Address
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileView;
