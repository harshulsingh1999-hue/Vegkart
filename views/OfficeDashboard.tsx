
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { formatCurrency, getDateOnly } from '../utils';
import { 
    ClipboardListIcon, 
    CheckCircleIcon, 
    TruckIcon, 
    UserCircleIcon, 
    BriefcaseIcon, 
    ShopIcon, 
    ExclamationCircleIcon, 
    ClockIcon, 
    ArrowPathIcon, 
    ShieldCheckIcon, 
    InformationCircleIcon, 
    XMarkIcon, 
    BadgeCheckIcon, 
    PhoneIcon,
    CogIcon,
    WrenchScrewdriverIcon,
    ScaleIcon,
    CurrencyRupeeIcon,
    GlobeAltIcon,
    DocumentTextIcon
} from '../components/ui/Icons';
import { useToast } from '../providers/ToastProvider';
import { Order } from '../types';
import ExportMenu from '../components/ExportMenu';

const OrderProgressBar = ({ status }: { status: string }) => {
    // 0: Placed, 1: Preparing/Ready, 2: Out for Delivery, 3: Delivered
    let currentStep = 0;
    let isCancelled = false;
    let isReturned = false;

    switch (status) {
        case 'Placed': currentStep = 0; break;
        case 'Preparing': currentStep = 1; break;
        case 'Ready for Pickup': currentStep = 1; break;
        case 'Out for Delivery': currentStep = 2; break;
        case 'Delivered': currentStep = 3; break;
        case 'Cancelled': isCancelled = true; break;
        case 'Returned': isReturned = true; break;
        default: currentStep = 0;
    }

    if (isCancelled) {
        return (
            <div className="mt-2 w-full max-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Cancelled</span>
                </div>
                <div className="h-1.5 w-full bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-full"></div>
                </div>
            </div>
        );
    }

    if (isReturned) {
        return (
            <div className="mt-2 w-full max-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Returned</span>
                </div>
                <div className="h-1.5 w-full bg-orange-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[160px] mt-3">
            <div className="flex justify-between mb-1 text-[9px] font-bold text-gray-400">
                <span className={currentStep >= 0 ? 'text-green-600' : ''}>Placed</span>
                <span className={currentStep >= 1 ? 'text-green-600' : ''}>Packed</span>
                <span className={currentStep >= 2 ? 'text-green-600' : ''}>Route</span>
                <span className={currentStep >= 3 ? 'text-green-600' : ''}>Done</span>
            </div>
            <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2 rounded"></div>
                
                {/* Active Line Progress */}
                <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-green-500 -z-10 -translate-y-1/2 transition-all duration-700 ease-in-out"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>

                {[0, 1, 2, 3].map((step) => {
                    const isCompleted = step <= currentStep;
                    const isCurrent = step === currentStep;
                    
                    return (
                        <div key={step} className="relative group">
                            <div 
                                className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${
                                    isCurrent ? 'bg-white border-green-600 scale-125 ring-2 ring-green-100' : 
                                    isCompleted ? 'bg-green-600 border-green-600' : 
                                    'bg-white border-gray-300'
                                }`}
                            >
                                {isCurrent && <div className="w-1 h-1 bg-green-600 rounded-full animate-ping" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const OrderDetailsModal = ({ order, isOpen, onClose }: { order: Order | null, isOpen: boolean, onClose: () => void }) => {
    const users = useStore(state => state.users);
    const products = useStore(state => state.products);

    if (!isOpen || !order) return null;

    // Resolve Delivery Partner
    const deliveryPartner = users.find(u => u.id === order.deliveryAgentId);

    // Resolve Customer
    const customer = users.find(u => u.id === order.userId);

    // Resolve Sellers (Office/Source)
    const itemSellerIds = order.items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        return prod?.sellerId;
    }).filter(id => !!id);
    const uniqueSellerIds = Array.from(new Set(itemSellerIds));
    const sellers = users.filter(u => uniqueSellerIds.includes(u.id));

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            Order Context Details
                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">#{order.id.split('-')[1]}</span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Customer Section */}
                    <div className="bg-green-50 rounded-xl p-5 border border-green-100 shadow-sm">
                        <h4 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <UserCircleIcon className="w-5 h-5" /> Customer Detail
                        </h4>
                        {customer ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="bg-white p-3 rounded-full shadow-sm text-green-600 border border-green-100">
                                    <UserCircleIcon className="w-10 h-10" />
                                </div>
                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Customer Name</p>
                                        <p className="font-bold text-gray-900 text-lg">{customer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Address</p>
                                        <p className="text-sm text-gray-700 leading-snug">{order.deliveryAddress.details}, {order.deliveryAddress.city}</p>
                                    </div>
                                    <div className="sm:col-span-2 mt-2">
                                        <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-md active:scale-95">
                                            <PhoneIcon className="w-4 h-4" />
                                            Call Customer (+91 {customer.phone})
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500 italic">Unknown Customer ID: {order.userId}</div>
                        )}
                    </div>

                    {/* Delivery Partner Section */}
                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 shadow-sm">
                        <h4 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <TruckIcon className="w-5 h-5" /> Delivery Partner Detail
                        </h4>
                        {deliveryPartner ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="bg-white p-3 rounded-full shadow-sm text-orange-600 border border-orange-100">
                                    <UserCircleIcon className="w-10 h-10" />
                                </div>
                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Partner Name</p>
                                        <p className="font-bold text-gray-900 text-lg">{deliveryPartner.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Vehicle</p>
                                        <p className="font-bold text-gray-700">{deliveryPartner.vehicleDetails || 'N/A'}</p>
                                    </div>
                                    <div className="sm:col-span-2 mt-2">
                                        <a href={`tel:${deliveryPartner.phone}`} className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors shadow-md active:scale-95">
                                            <PhoneIcon className="w-4 h-4" />
                                            Call Partner (+91 {deliveryPartner.phone})
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-orange-400 italic bg-white/50 p-4 rounded-lg border border-orange-100 border-dashed">
                                <ExclamationCircleIcon className="w-6 h-6" />
                                <span>No delivery partner assigned yet. Status is {order.status}.</span>
                            </div>
                        )}
                    </div>

                    {/* Office / Seller Section */}
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 shadow-sm">
                        <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShopIcon className="w-5 h-5" /> Office / Seller Detail
                        </h4>
                        {sellers.length > 0 ? (
                            <div className="space-y-4">
                                {sellers.map(seller => (
                                    <div key={seller.id} className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-5">
                                            <ShopIcon className="w-24 h-24" />
                                        </div>
                                        <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-gray-800 text-lg">{seller.businessName || seller.name}</p>
                                                    <BadgeCheckIcon className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Seller ID: {seller.id}</p>
                                                
                                                <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                    <span className="flex items-center gap-2">
                                                        <UserCircleIcon className="w-4 h-4 text-gray-400" /> 
                                                        Owner: {seller.name}
                                                    </span>
                                                </div>
                                                
                                                <div className="mt-3">
                                                    <a href={`tel:${seller.phone}`} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors shadow-sm">
                                                        <PhoneIcon className="w-3 h-3" />
                                                        Call {seller.phone}
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="sm:text-right mt-4 sm:mt-0">
                                                <div className="bg-blue-50 p-2 rounded-lg inline-block text-left sm:text-right">
                                                    <p className="text-xs font-bold text-gray-400 uppercase">Warehouse / Office Location</p>
                                                    {seller.addresses && seller.addresses.length > 0 ? (
                                                        <>
                                                            <p className="font-bold text-gray-800 text-sm">{seller.addresses[0].city}, {seller.addresses[0].state}</p>
                                                            <p className="text-xs text-gray-600 font-mono">{seller.addresses[0].pincode}</p>
                                                        </>
                                                    ) : (
                                                        <p className="italic text-gray-400 text-xs">Location not updated</p>
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    <span className="text-xs text-gray-400 font-bold">GSTIN: </span>
                                                    <span className="font-mono text-xs text-gray-600 bg-gray-100 px-1 rounded">{seller.gstin || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic bg-white/50 p-4 rounded-lg border border-blue-100 border-dashed">
                                No specific seller information available for items in this order.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const OfficeDashboard: React.FC = () => {
    const logout = useStore(state => state.logout);
    const currentUser = useStore(state => state.currentUser);
    const products = useStore(state => state.products);
    const upsertProduct = useStore(state => state.upsertProduct);
    const users = useStore(state => state.users);
    const orders = useStore(state => state.orders);
    const updateOrderStatus = useStore(state => state.updateOrderStatus);
    const markOrdersAsDeposited = useStore(state => state.markOrdersAsDeposited);
    const reconcileAllData = useStore(state => state.reconcileAllData);
    const performSafeCleanup = useStore(state => state.performSafeCleanup);
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'orders' | 'returns' | 'cash' | 'master_orders' | 'settings'>('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Master Order View State
    const [orderFilter, setOrderFilter] = useState('All');
    const [orderSearch, setOrderSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // --- DATA HARDENING & SANITIZATION ---
    const { lowStockItems, pendingOrders, returnRequests, totalRevenue, operationalAlerts } = useMemo(() => {
        // 1. Sanitize Products: Ensure variants exist and are arrays
        const safeProducts = products.filter(p => p && Array.isArray(p.variants) && p.variants.length > 0);
        
        // Filter: Low Stock (Stock < 10)
        const lowStock = safeProducts.filter(p => p.variants.some(v => (v.stock || 0) < 10));

        // 2. Sanitize Orders: Ensure critical fields exist
        const safeOrders = orders.filter(o => o && o.items && o.deliveryAddress && !isNaN(o.total));
        
        // Filter: Pending (Placed or Preparing)
        const pending = safeOrders.filter(o => ['Placed', 'Preparing'].includes(o.status));
        
        // Filter: Returns Requested
        const returns = safeOrders.filter(o => o.returnStatus === 'Requested');
        
        // Calc: Total Revenue
        const revenue = safeOrders.reduce((acc, o) => acc + (o.total || 0), 0);

        // --- OPERATIONAL ALERTS (Co-operation Error Detection) ---
        const alerts: { title: string; count: number; type: 'critical' | 'warning' }[] = [];
        const now = Date.now();
        
        // Stale Deliveries: > 24 Hours Out for Delivery
        const staleDeliveries = safeOrders.filter(o => 
            o.status === 'Out for Delivery' && 
            (now - new Date(o.date).getTime()) > 24 * 60 * 60 * 1000
        ).length;
        if (staleDeliveries > 0) alerts.push({ title: 'Stale Deliveries (>24h)', count: staleDeliveries, type: 'critical' });

        // Neglected Orders: > 24 Hours in 'Placed'
        const neglectedOrders = safeOrders.filter(o => 
            o.status === 'Placed' && 
            (now - new Date(o.date).getTime()) > 24 * 60 * 60 * 1000
        ).length;
        if (neglectedOrders > 0) alerts.push({ title: 'Neglected Orders (>24h)', count: neglectedOrders, type: 'warning' });

        // Returns Alert
        if (returns.length > 0) alerts.push({ title: 'Return Requests', count: returns.length, type: 'warning' });

        return { lowStockItems: lowStock, pendingOrders: pending, returnRequests: returns, totalRevenue: revenue, operationalAlerts: alerts };
    }, [products, orders]);

    // --- FILTERED ORDERS FOR MASTER VIEW ---
    const filteredMasterOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesFilter = orderFilter === 'All' ? true :
                orderFilter === 'Active' ? ['Placed', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(o.status) :
                orderFilter === 'Delivered' ? o.status === 'Delivered' :
                orderFilter === 'Cancelled' ? o.status === 'Cancelled' : true;
            
            const customer = users.find(u => u.id === o.userId);
            const searchLower = orderSearch.toLowerCase();
            const matchesSearch = 
                o.id.toLowerCase().includes(searchLower) ||
                (customer?.name || '').toLowerCase().includes(searchLower) ||
                (customer?.phone || '').includes(searchLower);

            return matchesFilter && matchesSearch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, users, orderFilter, orderSearch]);

    // --- CASH COLLECTION LOGIC (Updated to use isDeposited) ---
    const cashCollections = useMemo(() => {
        const partners: Record<string, { name: string, amount: number, orderCount: number, orderIds: string[] }> = {};
        
        orders.forEach(o => {
            // Include delivered orders that are COD and NOT yet deposited
            if (o.status === 'Delivered' && o.paymentMethod === 'COD' && o.deliveryAgentId && !o.isDeposited) {
                if (!partners[o.deliveryAgentId]) {
                    const agent = users.find(u => u.id === o.deliveryAgentId);
                    partners[o.deliveryAgentId] = { name: agent?.name || 'Unknown', amount: 0, orderCount: 0, orderIds: [] };
                }
                partners[o.deliveryAgentId].amount += o.total;
                partners[o.deliveryAgentId].orderCount += 1;
                partners[o.deliveryAgentId].orderIds.push(o.id);
            }
        });
        return Object.entries(partners).map(([id, data]) => ({ id, ...data }));
    }, [orders, users]);

    const handleVerifyDeposit = (partnerId: string) => {
        const data = cashCollections.find(c => c.id === partnerId);
        if (data && data.orderIds.length > 0) {
            markOrdersAsDeposited(data.orderIds);
            showToast(`Deposited ${formatCurrency(data.amount)} from ${data.name}. Verification Complete.`, 'success');
        }
    };

    // --- SAFE ACTION HANDLERS ---

    const handleProcessOrder = (orderId: string) => {
        // 1. Concurrency Check: Does order still exist?
        const currentOrder = orders.find(o => o.id === orderId);
        
        if (!currentOrder) {
            showToast('Error: Order no longer exists.', 'error');
            reconcileAllData(); // Auto-fix state
            return;
        }

        // 2. State Check: Was it cancelled?
        if (currentOrder.status === 'Cancelled') {
            showToast('Order was just cancelled by customer.', 'error');
            return;
        }

        updateOrderStatus(orderId, 'Ready for Pickup');
        showToast(`Order #${orderId.split('-')[1]} marked ready for pickup.`, 'success');
    };

    const handleReturnAction = (orderId: string, action: 'Approved' | 'Rejected') => {
        updateOrderStatus(orderId, action === 'Approved' ? 'Returned' : 'Delivered', { returnStatus: action });
        showToast(`Return Request ${action}.`, action === 'Approved' ? 'success' : 'info');
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        reconcileAllData(); // Trigger data fix/sync
        setTimeout(() => {
            setIsRefreshing(false);
            showToast('Dashboard Refreshed. Data Synced.', 'success');
        }, 800);
    };

    const handleRecovery = () => {
        setIsRefreshing(true);
        const logs = reconcileAllData();
        setTimeout(() => {
            setIsRefreshing(false);
            const fixedCount = logs.filter(l => l.includes('Fixed')).length;
            showToast(fixedCount > 0 ? `Fixed ${fixedCount} data mismatches.` : 'No issues found.', fixedCount > 0 ? 'success' : 'info');
        }, 800);
    };

    const handleUpdateStock = (productId: string, variantId: string, newStock: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const updatedVariants = product.variants.map(v => 
            v.id === variantId ? { ...v, stock: Math.max(0, newStock) } : v
        );

        upsertProduct({ ...product, variants: updatedVariants });
        showToast('Stock updated successfully', 'success');
    };

    const handleSafeCleanup = () => {
        const msg = performSafeCleanup();
        showToast(msg, 'success');
    };

    const StatCard = ({ title, value, sub, colorClass, icon: Icon }: any) => (
        <div className={`p-6 rounded-2xl shadow-lg text-white ${colorClass} relative overflow-hidden group transition-all hover:shadow-xl hover:scale-[1.02]`}>
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-wider">{title}</p>
                        <h3 className="text-4xl font-extrabold mt-1">{value}</h3>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                        <Icon className="w-8 h-8 text-white" />
                    </div>
                </div>
                <p className="mt-4 text-xs font-medium bg-black/10 inline-block px-3 py-1 rounded-full backdrop-blur-md">{sub}</p>
            </div>
            {/* Decorative Circle */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500 blur-2xl"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-3 rounded-2xl shadow-lg text-white transform rotate-3">
                        <BriefcaseIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-800 leading-tight tracking-tight">OFFICE PORTAL</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                            {currentUser?.name || 'Staff'} • <span className="text-purple-600">{currentUser?.department || 'Operations'}</span> • {currentUser?.employeeId || 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* RECOVER DATA BUTTON */}
                    <button 
                        onClick={handleRecovery}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                        title="Fix Mismatches & Recover Missing Data"
                    >
                        <ShieldCheckIcon className={`w-4 h-4 ${isRefreshing ? 'animate-pulse' : ''}`} />
                        Recover Data
                    </button>

                    {/* REFRESH BUTTON */}
                    <button 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2.5 rounded-xl transition-all shadow-sm border border-gray-200"
                        title="Refresh & Sync Data"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>

                    <div className="h-8 w-px bg-gray-300 mx-2"></div>

                    <button 
                        onClick={logout} 
                        className="text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 px-5 py-2.5 rounded-xl transition-all border border-red-100 hover:border-red-600 shadow-sm"
                    >
                        Sign Out
                    </button>
                </div>
            </header>
            
            {/* Navigation */}
            <div className="px-6 py-4 flex gap-4 overflow-x-auto scrollbar-hide bg-white/50 backdrop-blur-sm sticky top-[76px] z-20">
                {[
                    { id: 'overview', label: 'Overview', icon: BriefcaseIcon },
                    { id: 'inventory', label: 'Inventory Control', icon: ShopIcon },
                    { id: 'orders', label: 'Processing Queue', icon: ClockIcon },
                    { id: 'returns', label: 'Returns Manager', icon: ScaleIcon },
                    { id: 'cash', label: 'Cash Verification', icon: CurrencyRupeeIcon }, // Added
                    { id: 'master_orders', label: 'Order Platform', icon: ClipboardListIcon },
                    { id: 'settings', label: 'Settings', icon: CogIcon },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm transform active:scale-95 whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-200 ring-2 ring-purple-100 scale-105' 
                            : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <main className="flex-grow p-6 max-w-7xl mx-auto w-full animate-fade-in">
                
                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Operational Alerts - Co-operation Errors */}
                        {operationalAlerts.length > 0 && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-100 p-2 rounded-full text-red-600">
                                        <ExclamationCircleIcon className="w-6 h-6 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-red-800 font-bold text-sm">Operational Anomalies Detected</h3>
                                        <p className="text-red-600 text-xs">Attention needed for smooth operation.</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {operationalAlerts.map((alert, idx) => (
                                        <span key={idx} className={`px-3 py-1 rounded-full text-xs font-bold border ${alert.type === 'critical' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200'}`}>
                                            {alert.count} {alert.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard 
                                title="Pending Orders" 
                                value={pendingOrders.length} 
                                sub="Requires Processing" 
                                colorClass="bg-gradient-to-br from-orange-500 to-red-500" 
                                icon={ClockIcon}
                            />
                            <StatCard 
                                title="Low Stock Alerts" 
                                value={lowStockItems.length} 
                                sub="Re-order Needed" 
                                colorClass="bg-gradient-to-br from-red-500 to-pink-600" 
                                icon={ExclamationCircleIcon}
                            />
                            <StatCard 
                                title="Total Revenue" 
                                value={formatCurrency(totalRevenue)}
                                sub="Gross Sales" 
                                colorClass="bg-gradient-to-br from-blue-500 to-cyan-500" 
                                icon={ShopIcon}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                                        Critical Stock Alerts
                                    </h3>
                                    <button onClick={() => setActiveTab('inventory')} className="text-xs font-bold text-purple-600 hover:underline">View All</button>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {lowStockItems.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400">Inventory levels are healthy.</div>
                                    ) : (
                                        lowStockItems.slice(0, 5).map(p => (
                                            <div key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={p.imageUrls?.[0] || 'https://via.placeholder.com/100?text=No+Img'} 
                                                        className="w-10 h-10 rounded-lg object-cover bg-gray-200" 
                                                        alt="" 
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{p.name}</p>
                                                        <p className="text-xs text-gray-500">{p.seller || 'Unknown Seller'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                                        {p.variants[0]?.stock ?? 0} Left
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-5 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                        System Health
                                    </h3>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                        <p className="text-xs text-green-600 font-bold uppercase">Server Status</p>
                                        <p className="text-lg font-black text-green-800 mt-1">Operational</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-xs text-blue-600 font-bold uppercase">Database</p>
                                        <p className="text-lg font-black text-blue-800 mt-1">Connected</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 col-span-2">
                                        <p className="text-xs text-purple-600 font-bold uppercase">Last Sync</p>
                                        <p className="text-sm font-medium text-purple-800 mt-1">{new Date().toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- INVENTORY TAB --- */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800">Global Inventory Control</h2>
                            <div className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                                {products.length} Products Found
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map(product => {
                                // Safe calculation for total stock
                                const totalStock = (product.variants || []).reduce((a, b) => a + (b.stock || 0), 0);
                                const hasGeoRules = product.inventoryRules && product.inventoryRules.length > 0;

                                return (
                                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                        <div className="h-32 bg-gray-100 relative">
                                            <img 
                                                src={product.imageUrls?.[0] || 'https://via.placeholder.com/300?text=No+Image'} 
                                                alt={product.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                {hasGeoRules && (
                                                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm bg-blue-600 text-white flex items-center gap-1">
                                                        <GlobeAltIcon className="w-3 h-3" /> {product.inventoryRules?.length} Rules
                                                    </span>
                                                )}
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm ${totalStock < 10 ? 'bg-red-600 text-white' : 'bg-green-500 text-white'}`}>
                                                    {totalStock < 10 ? 'Low Stock' : 'Good'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-800 line-clamp-1">{product.name}</h3>
                                                <span className="text-xs text-gray-400 font-mono">{product.id.split('-')[1]}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3">{product.seller || 'Unknown Seller'}</p>
                                            
                                            <div className="space-y-2 bg-gray-50 p-2 rounded-lg">
                                                {(product.variants || []).map(v => (
                                                    <div key={v.id} className="flex justify-between text-xs items-center gap-2">
                                                        <span className="font-medium text-gray-700 w-12">{v.weight}</span>
                                                        <span className="text-gray-500">{formatCurrency(v.price || 0)}</span>
                                                        
                                                        {/* INLINE STOCK EDITOR */}
                                                        <div className="flex items-center ml-auto bg-white rounded border border-gray-200">
                                                            <button 
                                                                onClick={() => handleUpdateStock(product.id, v.id, v.stock - 1)}
                                                                className="px-2 hover:bg-gray-100 text-gray-600 font-bold"
                                                            >-</button>
                                                            <span className={`px-2 font-bold w-8 text-center ${v.stock < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                                                                {v.stock}
                                                            </span>
                                                            <button 
                                                                onClick={() => handleUpdateStock(product.id, v.id, v.stock + 1)}
                                                                className="px-2 hover:bg-gray-100 text-gray-600 font-bold"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- ORDER PROCESSING QUEUE TAB --- */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Processing Queue</h2>
                                <p className="text-xs text-gray-500">Dispatch pending orders to delivery partners.</p>
                            </div>
                            <span className="text-2xl font-black text-orange-500">{pendingOrders.length}</span>
                        </div>

                        {pendingOrders.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                    <CheckCircleIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-gray-800 font-bold">All Caught Up!</h3>
                                <p className="text-gray-500 text-sm">No pending orders to process.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {pendingOrders.map(order => (
                                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col md:flex-row gap-6 hover:shadow-lg transition-shadow">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                                    {order.status}
                                                </span>
                                                <span className="text-xs text-gray-400 font-mono">#{order.id.split('-')[1]}</span>
                                                <span className="text-xs text-gray-400">• {new Date(order.date).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Items</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(order.items || []).map((item, i) => (
                                                        <span key={i} className="text-sm bg-gray-50 px-2 py-1 rounded border border-gray-100 text-gray-700">
                                                            {item.quantity}x {item.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <TruckIcon className="w-4 h-4 text-gray-400" />
                                                    {order.deliveryAddress?.pincode || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <UserCircleIcon className="w-4 h-4 text-gray-400" />
                                                    Customer
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col justify-between items-end border-l pl-6 border-gray-100 min-w-[200px]">
                                            <div className="text-right mb-4">
                                                <p className="text-xs text-gray-400 font-bold uppercase">Total Value</p>
                                                <p className="text-2xl font-black text-gray-800">{formatCurrency(order.total || 0)}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleProcessOrder(order.id)}
                                                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircleIcon className="w-5 h-5" />
                                                Mark Ready
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- RETURNS MANAGEMENT TAB --- */}
                {activeTab === 'returns' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Return Requests</h2>
                                <p className="text-xs text-gray-500">Review and approve customer returns.</p>
                            </div>
                            <span className="text-2xl font-black text-yellow-500">{returnRequests.length}</span>
                        </div>

                        {returnRequests.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-400">No active return requests.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {returnRequests.map(order => (
                                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800 text-lg">Order #{order.id.split('-')[1]}</span>
                                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-bold uppercase">Requested</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">Reason: <span className="font-bold">{order.returnReason}</span></p>
                                            </div>
                                            <p className="font-black text-gray-800 text-xl">{formatCurrency(order.total)}</p>
                                        </div>
                                        <div className="flex gap-3 justify-end border-t pt-4">
                                            <button 
                                                onClick={() => handleReturnAction(order.id, 'Rejected')}
                                                className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                Reject Return
                                            </button>
                                            <button 
                                                onClick={() => handleReturnAction(order.id, 'Approved')}
                                                className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow transition-colors"
                                            >
                                                Approve Refund
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- CASH MANAGEMENT TAB (UPDATED) --- */}
                {activeTab === 'cash' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Cash Verification</h2>
                                <p className="text-xs text-gray-500">Verify and collect cash deposits from Delivery Partners.</p>
                            </div>
                            <span className="text-2xl font-black text-green-600">{formatCurrency(cashCollections.reduce((sum, c) => sum + c.amount, 0))}</span>
                        </div>

                        {cashCollections.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-400">No pending cash deposits.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {cashCollections.map(collection => (
                                    <div key={collection.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                                <UserCircleIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{collection.name}</h4>
                                                <p className="text-xs text-gray-500">{collection.orderCount} Orders • ID: {collection.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-xl text-gray-800 mb-2">{formatCurrency(collection.amount)}</p>
                                            <button 
                                                onClick={() => handleVerifyDeposit(collection.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-2 ml-auto"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Verify & Collect
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- MASTER ORDER PLATFORM TAB --- */}
                {activeTab === 'master_orders' && (
                    <div className="space-y-6">
                        <OrderDetailsModal 
                            isOpen={!!selectedOrder} 
                            order={selectedOrder} 
                            onClose={() => setSelectedOrder(null)} 
                        />

                        {/* Header Controls */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
                            <div className="relative flex-grow">
                                <input 
                                    type="text" 
                                    placeholder="Search by ID, Customer Name or Phone..." 
                                    value={orderSearch}
                                    onChange={e => setOrderSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-gray-50 focus:bg-white"
                                />
                                <div className="absolute left-3 top-3.5 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {['All', 'Active', 'Delivered', 'Cancelled'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setOrderFilter(f)}
                                            className={`px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                                                orderFilter === f 
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' 
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                                <ExportMenu data={filteredMasterOrders} filename="master_order_db" title="Master Order Database" />
                            </div>
                        </div>

                        {/* Order Table */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="p-5 font-bold text-gray-500 uppercase text-xs">Order ID</th>
                                            <th className="p-5 font-bold text-gray-500 uppercase text-xs">Customer</th>
                                            <th className="p-5 font-bold text-gray-500 uppercase text-xs">Items</th>
                                            <th className="p-5 font-bold text-gray-500 uppercase text-xs w-48">Status & Progress</th>
                                            <th className="p-5 font-bold text-gray-500 uppercase text-xs text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredMasterOrders.length === 0 ? (
                                            <tr><td colSpan={5} className="p-12 text-center text-gray-400">No orders found.</td></tr>
                                        ) : (
                                            filteredMasterOrders.map(order => {
                                                const customer = users.find(u => u.id === order.userId);
                                                return (
                                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                                                        <td className="p-5 align-top">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="font-bold text-gray-800 text-sm">#{order.id.split('-')[1]}</div>
                                                                <button 
                                                                    onClick={() => setSelectedOrder(order)}
                                                                    className="text-gray-400 hover:text-purple-600 transition-colors p-1 hover:bg-purple-50 rounded-full"
                                                                    title="View Details"
                                                                >
                                                                    <InformationCircleIcon className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">{getDateOnly(order.date)}</div>
                                                        </td>
                                                        <td className="p-5 align-top">
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-purple-50 p-1.5 rounded-full text-purple-600"><UserCircleIcon className="w-4 h-4" /></div>
                                                                <div>
                                                                    <div className="font-bold text-gray-800 text-sm">{customer?.name || 'Unknown'}</div>
                                                                    <div className="text-xs text-gray-500 font-mono">+91 {customer?.phone}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-5 align-top">
                                                            <div className="space-y-1">
                                                                {order.items.slice(0, 2).map((item, idx) => (
                                                                    <div key={idx} className="text-xs text-gray-700">
                                                                        <span className="font-bold">{item.quantity}x</span> {item.name}
                                                                    </div>
                                                                ))}
                                                                {order.items.length > 2 && (
                                                                    <div className="text-xs text-purple-600 font-bold">+{order.items.length - 2} more</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-5 align-top">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                                                order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                                order.status === 'Out for Delivery' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                            
                                                            {/* VISUAL PROGRESS BAR */}
                                                            <OrderProgressBar status={order.status} />
                                                        </td>
                                                        <td className="p-5 align-top text-right">
                                                            <div className="font-bold text-gray-800">{formatCurrency(order.total)}</div>
                                                            <div className="text-xs text-gray-400 mt-1">{order.paymentMethod}</div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <CogIcon className="w-5 h-5 text-gray-500" />
                                App Maintenance & Settings
                            </h2>
                            
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm">Safe Clean-up Tool</h3>
                                    <p className="text-xs text-gray-500 mt-1 max-w-md">
                                        Use this tool to clear temporary cache, fix sync issues, and optimize local storage performance. 
                                        This action is <strong>non-destructive</strong> and will not remove any important data like orders, products, or user accounts.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleSafeCleanup}
                                    className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
                                >
                                    <WrenchScrewdriverIcon className="w-4 h-4" /> 
                                    Run Safe Clean-up
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default OfficeDashboard;
