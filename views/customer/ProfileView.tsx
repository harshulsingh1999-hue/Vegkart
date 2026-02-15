
import React, { useState, useEffect, useRef } from 'react';
import { useStore, verifyDeviceLock } from '../../store';
import { useToast } from '../../providers/ToastProvider';
import { Address, View } from '../../types';
import { formatCurrency } from '../../utils';
import ProductCard from '../../components/ProductCard';
import { 
    UserCircleIcon, PhoneIcon, LocationMarkerIcon, PencilIcon, TrashIcon, 
    PlusIcon, GlobeAltIcon, CheckCircleIcon, XMarkIcon, CogIcon, 
    WrenchScrewdriverIcon, LockClosedIcon, LockOpenIcon,
    WalletIcon, HeartIcon, ChatBubbleLeftRightIcon, BellIcon, GiftIcon,
    ClipboardListIcon, ArrowPathIcon, TagIcon, BankIcon, CreditCardIcon
} from '../../components/ui/Icons';

// --- SUB-VIEW: WALLET ---
const WalletSection = ({ onBack }: { onBack: () => void }) => {
    const currentUser = useStore(state => state.currentUser);
    const balance = currentUser?.walletBalance || 0;
    
    // Mock transactions
    const transactions = [
        { id: 1, type: 'Credit', desc: 'Refund for Order #9823', amount: 150, date: '2 days ago' },
        { id: 2, type: 'Debit', desc: 'Payment for Order #9810', amount: -450, date: '5 days ago' },
        { id: 3, type: 'Credit', desc: 'Referral Bonus', amount: 50, date: '1 week ago' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="bg-white p-2 rounded-full shadow-sm text-gray-600 hover:text-gray-900 border border-gray-100">
                    <ArrowPathIcon className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-xl font-bold text-gray-800">My Wallet</h2>
            </div>
            
            {/* Digital Card UI */}
            <div className="relative h-56 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl overflow-hidden p-6 flex flex-col justify-between text-white group transform transition-transform hover:scale-[1.01]">
                {/* Decorative Patterns */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
                
                {/* Top Row */}
                <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                            <WalletIcon className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="font-bold tracking-wider text-sm opacity-80">VEGGIE PAY</span>
                    </div>
                    <span className="font-mono text-sm opacity-60 tracking-widest">**** 8842</span>
                </div>

                {/* Balance Row */}
                <div className="relative z-10">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Available Balance</p>
                    <h3 className="text-4xl font-black tracking-tight flex items-baseline gap-1">
                        <span className="text-2xl opacity-50">₹</span>
                        {balance.toLocaleString('en-IN')}
                    </h3>
                </div>

                {/* Bottom Actions */}
                <div className="flex gap-3 relative z-10">
                    <button className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-green-900/20">
                        + Add Money
                    </button>
                    <button className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold border border-white/10 transition-colors">
                        History
                    </button>
                </div>
            </div>

            {/* Transactions List */}
            <div>
                <h3 className="font-bold text-gray-800 mb-4 px-1">Recent Activity</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                    {transactions.map(tx => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {tx.amount > 0 ? <BankIcon className="w-5 h-5" /> : <CreditCardIcon className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{tx.desc}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{tx.date}</p>
                                </div>
                            </div>
                            <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- SUB-VIEW: WISHLIST ---
const WishlistSection = ({ onBack }: { onBack: () => void }) => {
    const currentUser = useStore(state => state.currentUser);
    const products = useStore(state => state.products);
    const wishlistIds = currentUser?.wishlist || [];
    const wishlistItems = products.filter(p => wishlistIds.includes(p.id));

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="bg-white p-2 rounded-full shadow-sm text-gray-600 hover:text-gray-900 border border-gray-100">
                    <ArrowPathIcon className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-xl font-bold text-gray-800">My Wishlist</h2>
                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full ml-auto">{wishlistItems.length} Items</span>
            </div>
            
            {wishlistItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="bg-red-50 p-4 rounded-full mb-4">
                        <HeartIcon className="w-10 h-10 text-red-300" />
                    </div>
                    <h3 className="font-bold text-gray-800">Your wishlist is empty</h3>
                    <p className="text-gray-500 text-sm mt-1">Save items you want to buy later!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {wishlistItems.map(p => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- SUB-VIEW: NOTIFICATIONS ---
const NotificationsSection = ({ onBack }: { onBack: () => void }) => {
    const notifs = [
        { id: 1, title: 'Order Delivered', desc: 'Your order #ORD-8821 has been delivered.', time: '2h ago', icon: CheckCircleIcon, color: 'text-green-600 bg-green-100' },
        { id: 2, title: 'Flash Sale Alert!', desc: '50% Off on Exotic Fruits today only.', time: '5h ago', icon: GiftIcon, color: 'text-purple-600 bg-purple-100' },
        { id: 3, title: 'Refund Processed', desc: '₹150 has been credited to your wallet.', time: '1d ago', icon: WalletIcon, color: 'text-blue-600 bg-blue-100' },
    ];

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="bg-white p-2 rounded-full shadow-sm text-gray-600 hover:text-gray-900 border border-gray-100">
                    <ArrowPathIcon className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
            </div>
            <div className="space-y-3">
                {notifs.map(n => (
                    <div key={n.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow">
                        <div className={`p-3 rounded-xl h-fit ${n.color}`}>
                            <n.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">{n.title}</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.desc}</p>
                            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wide">{n.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SUB-VIEW: SUPPORT CHAT ---
const SupportSection = ({ onBack }: { onBack: () => void }) => {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! How can we help you today?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        setMessages(prev => [...prev, { id: Date.now(), text: input, sender: 'user' }]);
        setInput('');
        
        // Mock Reply
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Thanks for reaching out. An agent will verify your query shortly.", sender: 'bot' }]);
        }, 1000);
    };

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
                <button onClick={onBack} className="text-gray-500 hover:text-gray-800 p-1 bg-white rounded-full shadow-sm"><ArrowPathIcon className="w-5 h-5 rotate-180" /></button>
                <div>
                    <h2 className="text-sm font-bold text-gray-800">Customer Support</h2>
                    <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 uppercase tracking-wide"><span className="w-1.5 h-1.5 bg-green-50 rounded-full animate-pulse"></span> Online Now</p>
                </div>
            </div>
            
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50" ref={scrollRef}>
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2">
                <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    placeholder="Type your message..." 
                    className="flex-grow bg-gray-100 border-0 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button type="submit" className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-transform active:scale-95 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

// --- SUB-VIEW: REFER & EARN ---
const ReferralSection = ({ onBack }: { onBack: () => void }) => {
    const { showToast } = useToast();
    const referralCode = "VEGGIE2024";

    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode);
        showToast('Referral code copied to clipboard!', 'success');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
                <button onClick={onBack} className="bg-white p-2 rounded-full shadow-sm text-gray-600 hover:text-gray-900 border border-gray-100">
                    <ArrowPathIcon className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-xl font-bold text-gray-800">Refer & Earn</h2>
            </div>
            
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-8 text-center text-white shadow-xl shadow-rose-200 relative overflow-hidden transform hover:scale-[1.01] transition-transform">
                <GiftIcon className="w-32 h-32 absolute -top-6 -left-6 text-white/10 rotate-12" />
                <GiftIcon className="w-24 h-24 absolute -bottom-6 -right-6 text-white/10 -rotate-12" />
                
                <h3 className="text-3xl font-black mb-2 relative z-10 leading-tight">Invite & Earn ₹50</h3>
                <p className="text-pink-100 text-sm mb-8 relative z-10 px-4">Share your code with friends. When they place their first order, you both get a reward!</p>
                
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2.5 flex items-center justify-between border border-white/20 relative z-10 max-w-xs mx-auto">
                    <span className="font-mono font-bold text-xl px-4 tracking-widest text-white">{referralCode}</span>
                    <button onClick={handleCopy} className="bg-white text-rose-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors shadow-lg">
                        Copy
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h4 className="font-bold text-gray-800 mb-6 text-lg">How it works</h4>
                <div className="relative">
                    <div className="absolute top-4 bottom-4 left-4 w-0.5 bg-gray-100 -z-10"></div>
                    <div className="space-y-6">
                        <div className="flex gap-4 items-start">
                            <div className="bg-pink-50 text-pink-600 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm ring-2 ring-pink-100">1</div>
                            <div>
                                <h5 className="font-bold text-gray-800 text-sm">Share your code</h5>
                                <p className="text-sm text-gray-500 mt-0.5">Send your unique code to friends via WhatsApp or SMS.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="bg-pink-50 text-pink-600 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm ring-2 ring-pink-100">2</div>
                            <div>
                                <h5 className="font-bold text-gray-800 text-sm">Friend Signs Up</h5>
                                <p className="text-sm text-gray-500 mt-0.5">They use your code during registration.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="bg-pink-50 text-pink-600 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm ring-2 ring-pink-100">3</div>
                            <div>
                                <h5 className="font-bold text-gray-800 text-sm">You both earn ₹50</h5>
                                <p className="text-sm text-gray-500 mt-0.5">Rewards are credited instantly after their first delivery.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-VIEW: AVAILABLE COUPONS ---
const CouponsSection = ({ onBack }: { onBack: () => void }) => {
    const coupons = useStore(state => state.coupons);
    const { showToast } = useToast();

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        showToast(`Coupon ${code} copied!`, 'success');
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="bg-white p-2 rounded-full shadow-sm text-gray-600 hover:text-gray-900 border border-gray-100">
                    <ArrowPathIcon className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-xl font-bold text-gray-800">Available Offers</h2>
            </div>

            {coupons.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No coupons available right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {coupons.filter(c => c.isActive).map(coupon => (
                        <div key={coupon.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <TagIcon className="w-32 h-32 transform rotate-12" />
                            </div>
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <span className="inline-block bg-green-100 text-green-800 text-[9px] font-extrabold px-2 py-1 rounded uppercase tracking-wide mb-2 border border-green-200">
                                        {coupon.type === 'FLAT' ? 'FLAT SAVINGS' : 'PERCENTAGE OFF'}
                                    </span>
                                    <h4 className="text-2xl font-black text-gray-800 font-mono tracking-wide">{coupon.code}</h4>
                                    <p className="text-sm text-gray-600 mt-1 font-medium">{coupon.description}</p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="text-xs text-gray-500 font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            {coupon.type === 'FLAT' ? `Save ${formatCurrency(coupon.value)}` : `${coupon.value}% Discount`}
                                        </div>
                                        {coupon.minOrderValue && (
                                            <div className="text-xs text-gray-400 font-medium">
                                                Min Order: {formatCurrency(coupon.minOrderValue)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="border-l border-dashed border-gray-300 pl-5 ml-4">
                                    <button 
                                        onClick={() => handleCopy(coupon.code)}
                                        className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-green-600 transition-colors shadow-lg active:scale-95"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---
const ProfileView: React.FC = () => {
    const { currentUser, logout, updateUserProfile, addAddress, updateAddress, deleteAddress, performSafeCleanup, setView, currentView } = useStore();
    const { isBiometricEnabled, enableBiometricLock, disableBiometricLock, setAppPin } = useStore();
    const { showToast } = useToast();

    // --- State: Personal Details Editing ---
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');

    // --- State: Address Management ---
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [addrForm, setAddrForm] = useState({ label: 'Home', details: '', city: '', pincode: '', state: '' });

    // --- State: PIN ---
    const [isChangingPin, setIsChangingPin] = useState(false);
    const [newPin, setNewPin] = useState('');

    // --- State: Language Modal ---
    const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

    // --- Internal State for Sub-Views when using same component ---
    const [subSection, setSubSection] = useState<'NONE' | 'REFERRAL' | 'COUPONS' | 'LANGUAGE'>('NONE');

    useEffect(() => {
        if (currentUser) {
            setEditName(currentUser.name);
            setEditPhone(currentUser.phone);
        }
    }, [currentUser]);

    // --- Handlers ---
    const handleSaveProfile = () => {
        if (!editName || editPhone.length !== 10) return showToast('Invalid details', 'error');
        updateUserProfile({ name: editName, phone: editPhone });
        setIsEditingProfile(false);
        showToast('Profile updated', 'success');
    };

    const handleAddressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAddressId) updateAddress({ ...addrForm, id: editingAddressId });
        else addAddress(addrForm);
        setIsAddressModalOpen(false);
        showToast('Address saved', 'success');
    };

    const toggleBiometric = async () => {
        const success = await verifyDeviceLock();
        if (success) {
            if (isBiometricEnabled) { disableBiometricLock(); showToast('Locked Disabled', 'info'); }
            else { enableBiometricLock(); showToast('Lock Enabled', 'success'); }
        } else {
            showToast('Verification Failed', 'error');
        }
    };

    const handleLanguageSelect = (lang: string) => {
        updateUserProfile({ language: lang });
        setIsLanguageModalOpen(false);
        showToast(`Language changed to ${lang}`, 'success');
    };

    const StatCard = ({ label, value, icon: Icon, colorClass, onClick }: any) => (
        <button onClick={onClick} className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <div className={`p-2.5 rounded-full ${colorClass} mb-1 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">{value}</span>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">{label}</span>
        </button>
    );

    const MenuGridItem = ({ label, icon: Icon, color, onClick, badge }: any) => (
        <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95 relative group">
            <div className={`p-3.5 rounded-2xl mb-2 transition-transform ${color} group-hover:scale-110 duration-300 shadow-sm`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">{label}</span>
            {badge && <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{badge}</span>}
        </button>
    );

    // --- RENDER SUB-VIEWS ---
    if (currentView === View.WALLET) return <WalletSection onBack={() => setView(View.PROFILE)} />;
    if (currentView === View.WISHLIST) return <WishlistSection onBack={() => setView(View.PROFILE)} />;
    if (currentView === View.NOTIFICATIONS) return <NotificationsSection onBack={() => setView(View.PROFILE)} />;
    if (currentView === View.SUPPORT) return <SupportSection onBack={() => setView(View.PROFILE)} />;
    
    // Internal Sub-views
    if (subSection === 'REFERRAL') return <ReferralSection onBack={() => setSubSection('NONE')} />;
    if (subSection === 'COUPONS') return <CouponsSection onBack={() => setSubSection('NONE')} />;

    if (!currentUser) return null;

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Header / Identity */}
            <div className="bg-white p-6 shadow-sm mb-4 relative overflow-hidden rounded-b-3xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-50 rounded-full -mr-12 -mt-12 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full -ml-10 -mb-10 blur-3xl"></div>
                
                <div className="relative z-10 flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 p-0.5 shadow-lg">
                            <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                                <UserCircleIcon className="w-full h-full text-gray-300" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{currentUser.name || 'Welcome'}</h1>
                            <p className="text-xs font-bold text-gray-400 font-mono tracking-wide">+91 {currentUser.phone}</p>
                            <button onClick={() => setIsEditingProfile(true)} className="text-xs text-blue-600 font-bold mt-1.5 flex items-center gap-1 hover:underline bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                                <PencilIcon className="w-3 h-3" /> Edit Profile
                            </button>
                        </div>
                    </div>
                    <button onClick={logout} className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Editing Personal Info Overlay */}
            {isEditingProfile && (
                <div className="mx-4 mb-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-lg animate-fade-in relative z-20">
                    <h3 className="text-sm font-bold mb-3 text-gray-700 uppercase tracking-wide">Update Details</h3>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border rounded-xl p-3 text-sm mb-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name" />
                    <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border rounded-xl p-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone" />
                    <div className="flex gap-3">
                        <button onClick={handleSaveProfile} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition-colors">Save Changes</button>
                        <button onClick={() => setIsEditingProfile(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-bold transition-colors">Cancel</button>
                    </div>
                </div>
            )}

            <div className="px-4 space-y-6">
                
                {/* 1. MINI DASHBOARD STATS */}
                <div className="flex gap-3">
                    <StatCard 
                        label="Wallet" 
                        value={formatCurrency(currentUser.walletBalance || 0)} 
                        icon={WalletIcon} 
                        colorClass="bg-green-500" 
                        onClick={() => setView(View.WALLET)}
                    />
                    <StatCard 
                        label="Savings" 
                        value={formatCurrency(currentUser.totalSavings || 0)} 
                        icon={GiftIcon} 
                        colorClass="bg-purple-500" 
                    />
                    <StatCard 
                        label="Orders"
                        value={currentUser.wishlist?.length || "0"} // Logic reuse for orders count if needed or kept simple
                        icon={ClipboardListIcon}
                        colorClass="bg-blue-500"
                        onClick={() => setView(View.ORDERS)}
                    />
                </div>

                {/* 2. QUICK ACTIONS GRID */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Menu</h3>
                    <div className="grid grid-cols-4 gap-3">
                        <MenuGridItem label="Wishlist" icon={HeartIcon} color="bg-red-500" onClick={() => setView(View.WISHLIST)} badge={currentUser.wishlist?.length} />
                        <MenuGridItem label="Address" icon={LocationMarkerIcon} color="bg-orange-500" onClick={() => setIsAddressModalOpen(true)} />
                        <MenuGridItem label="Support" icon={ChatBubbleLeftRightIcon} color="bg-cyan-500" onClick={() => setView(View.SUPPORT)} />
                        <MenuGridItem label="Coupons" icon={TagIcon} color="bg-teal-500" onClick={() => setSubSection('COUPONS')} />
                        <MenuGridItem label="Refer" icon={GiftIcon} color="bg-pink-500" onClick={() => setSubSection('REFERRAL')} />
                        <MenuGridItem label="Alerts" icon={BellIcon} color="bg-indigo-500" onClick={() => setView(View.NOTIFICATIONS)} badge={3} />
                        <MenuGridItem label="Lang" icon={GlobeAltIcon} color="bg-lime-500" onClick={() => setIsLanguageModalOpen(true)} />
                        <MenuGridItem label="Clean" icon={WrenchScrewdriverIcon} color="bg-gray-600" onClick={() => { performSafeCleanup(); showToast('Cache Cleared', 'success'); }} />
                    </div>
                </div>

                {/* 3. ADDRESSES PREVIEW */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                            <LocationMarkerIcon className="w-4 h-4 text-gray-500" /> Saved Addresses
                        </h3>
                        <button onClick={() => { setEditingAddressId(null); setIsAddressModalOpen(true); }} className="text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">+ Add</button>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {currentUser.addresses.length === 0 ? <p className="p-6 text-xs text-gray-400 text-center italic">No addresses saved yet.</p> : 
                        currentUser.addresses.slice(0, 2).map(addr => (
                            <div key={addr.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                        addr.label === 'Home' ? 'bg-blue-100 text-blue-700' :
                                        addr.label === 'Work' ? 'bg-purple-100 text-purple-700' :
                                        'bg-gray-200 text-gray-700'
                                    }`}>{addr.label}</span>
                                    <div className="flex gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { 
                                            setAddrForm({ label: addr.label, details: addr.details, city: addr.city, pincode: addr.pincode, state: addr.state });
                                            setEditingAddressId(addr.id); 
                                            setIsAddressModalOpen(true); 
                                        }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full bg-blue-50 transition-colors">
                                            <PencilIcon className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => deleteAddress(addr.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full bg-red-50 transition-colors">
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-800 font-medium text-sm leading-snug mt-2 line-clamp-1">{addr.details}</p>
                                <p className="text-gray-500 text-xs mt-1 font-medium">{addr.city}, {addr.state} - {addr.pincode}</p>
                            </div>
                        ))}
                        {currentUser.addresses.length > 2 && <button onClick={() => setIsAddressModalOpen(true)} className="w-full py-3 text-xs text-gray-500 font-bold text-center hover:bg-gray-50 border-t border-gray-100">View All Addresses</button>}
                    </div>
                </div>

                {/* 4. SECURITY */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 mb-6">
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                {isBiometricEnabled ? <LockClosedIcon className="w-4 h-4 text-green-600" /> : <LockOpenIcon className="w-4 h-4 text-gray-400" />}
                                App Security
                            </h3>
                            <p className="text-[10px] text-gray-500 mt-0.5">Biometric / PIN Lock</p>
                        </div>
                        <button 
                            onClick={toggleBiometric}
                            className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none ${isBiometricEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
                        >
                            <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${isBiometricEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ADDRESS MODAL (ADD / EDIT) */}
            {isAddressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
                        <button 
                            onClick={() => setIsAddressModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                            <LocationMarkerIcon className="w-5 h-5 text-green-600" />
                            {editingAddressId ? 'Edit Address' : 'New Address'}
                        </h3>

                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Label</label>
                                <div className="flex gap-2">
                                    {['Home', 'Work', 'Other'].map(l => (
                                        <button
                                            key={l}
                                            type="button"
                                            onClick={() => setAddrForm({...addrForm, label: l})}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                                addrForm.label === l 
                                                ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105' 
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Details</label>
                                <textarea 
                                    value={addrForm.details}
                                    onChange={e => setAddrForm({...addrForm, details: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 min-h-[80px]"
                                    placeholder="Flat No, Building, Street Area"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">City</label>
                                    <input 
                                        value={addrForm.city} 
                                        onChange={e => setAddrForm({...addrForm, city: e.target.value})} 
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                                        placeholder="Mumbai"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pincode</label>
                                    <input 
                                        maxLength={6}
                                        value={addrForm.pincode} 
                                        onChange={e => setAddrForm({...addrForm, pincode: e.target.value.replace(/\D/g, '')})} 
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                                        placeholder="400001"
                                        required
                                    />
                                </div>
                            </div>

                             <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">State</label>
                                <input 
                                    value={addrForm.state} 
                                    onChange={e => setAddrForm({...addrForm, state: e.target.value})} 
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                                    placeholder="Maharashtra"
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-green-700 transition-all transform active:scale-95 mt-4"
                            >
                                Save Location
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* LANGUAGE MODAL */}
            {isLanguageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                        <button onClick={() => setIsLanguageModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><XMarkIcon className="w-5 h-5" /></button>
                        <h3 className="font-black text-xl mb-6 text-center text-gray-800">Select Language</h3>
                        <div className="space-y-3">
                            {['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil'].map(lang => (
                                <button 
                                    key={lang}
                                    onClick={() => handleLanguageSelect(lang)}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm border transition-all flex items-center justify-center relative ${
                                        currentUser.language === lang 
                                        ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {lang}
                                    {currentUser.language === lang && <CheckCircleIcon className="w-4 h-4 absolute right-4 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileView;
