
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { useToast } from '../providers/ToastProvider';
import { formatCurrency, optimizeRoute } from '../utils';
import { Order, User } from '../types';
import { 
    XMarkIcon, PhoneIcon, UserCircleIcon, LocationMarkerIcon, TruckIcon, 
    ClipboardListIcon, ArrowPathIcon, CurrencyRupeeIcon, CheckCircleIcon,
    MapIcon, ChartBarIcon
} from '../components/ui/Icons';
import { MAP_STYLES, CityBlock, generateCityLayout } from '../components/MapShared';

const RouteMap: React.FC<{ orders: Order[], pincode: string, users: User[] }> = ({ orders, pincode, users }) => {
    const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
    // Standard layout for delivery view
    const { blocks, roads } = useMemo(() => generateCityLayout(pincode, { cols: 5, rows: 5, gap: 8 }), [pincode]);
    const safeOrders = useMemo(() => orders.filter(o => o && o.deliveryAddress), [orders]);

    if (safeOrders.length === 0) return <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400">No Orders</div>;

    const coords = safeOrders.map(o => o.deliveryAddress.coordinates || { lat: 0, lng: 0 });
    const minLat = Math.min(...coords.map(c => c.lat));
    const maxLat = Math.max(...coords.map(c => c.lat));
    const minLng = Math.min(...coords.map(c => c.lng));
    const maxLng = Math.max(...coords.map(c => c.lng));

    const normalize = (val: number, min: number, max: number) => {
        if (max === min) return 50;
        return ((val - min) / (max - min)) * 60 + 20;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative group">
            <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-600" />
                <div><p className="text-[10px] font-bold text-gray-500 uppercase leading-none">Zone</p><p className="text-sm font-black text-gray-800 leading-none">{pincode}</p></div>
            </div>
            <div className="absolute top-4 right-4 z-20">
                <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse"><ArrowPathIcon className="w-3 h-3" /> Live</span>
            </div>
            
            <div className="relative h-[400px] w-full bg-[#eef0f3] overflow-hidden cursor-grab active:cursor-grabbing">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="100" fill={MAP_STYLES.land} />
                    {roads.map((r, i) => ( <line key={`o-${i}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#dadce0" strokeWidth={r.width + 0.5} /> ))}
                    {roads.map((r, i) => ( <line key={`f-${i}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={r.isMain ? MAP_STYLES.mainRoadFill : MAP_STYLES.roadFill} strokeWidth={r.width} /> ))}
                    {blocks.map((b, i) => ( <CityBlock key={i} x={b.x} y={b.y} width={b.w} height={b.h} type={b.type} label={b.label} /> ))}
                    <polyline 
                        points={safeOrders.map(o => {
                            const c = o.deliveryAddress.coordinates || { lat: 0, lng: 0 };
                            return `${normalize(c.lng, minLng, maxLng)},${100 - normalize(c.lat, minLat, maxLat)}`;
                        }).join(' ')}
                        fill="none" stroke={MAP_STYLES.routeLine} strokeWidth="1" strokeDasharray="2" className="animate-[dash_1s_linear_infinite]"
                    />
                    <style>{`@keyframes dash { to { stroke-dashoffset: -4; } }`}</style>
                </svg>

                {safeOrders.map((o, i) => {
                    const c = o.deliveryAddress.coordinates || { lat: 0, lng: 0 };
                    const left = normalize(c.lng, minLng, maxLng);
                    const top = 100 - normalize(c.lat, minLat, maxLat);
                    const customer = users.find(u => u.id === o.userId);
                    const isSelected = selectedFeature?.id === o.id;

                    return (
                        <div key={o.id} className="absolute transform -translate-x-1/2 -translate-y-full z-30" style={{ left: `${left}%`, top: `${top}%`, zIndex: isSelected ? 50 : 30 }} onClick={(e) => { e.stopPropagation(); setSelectedFeature({ id: o.id, name: `Delivery #${i + 1}`, address: o.deliveryAddress.details, amount: formatCurrency(o.total), phone: customer?.phone, customerName: customer?.name, payment: o.paymentMethod }); }}>
                            <div className={`relative flex flex-col items-center group cursor-pointer ${isSelected ? 'scale-125' : 'hover:scale-110'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white ${isSelected ? 'bg-gray-900 text-white' : i === 0 ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>{i + 1}</div>
                                <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-0.5 ${isSelected ? 'border-t-gray-900' : i === 0 ? 'border-t-green-600' : 'border-t-red-500'}`}></div>
                            </div>
                        </div>
                    );
                })}

                {selectedFeature && (
                    <div className="absolute bottom-4 left-4 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 border border-gray-200 animate-fade-in">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedFeature(null); }} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><XMarkIcon className="w-5 h-5" /></button>
                        <div className="flex gap-4 items-start">
                            <div className="bg-blue-50 p-2.5 rounded-full text-blue-600"><UserCircleIcon className="w-8 h-8" /></div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-gray-900 text-base">{selectedFeature.customerName}</h4>
                                <p className="text-xs text-gray-500 font-medium mb-2">{selectedFeature.address}</p>
                                <div className="flex flex-wrap gap-2 mb-3"><span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100">{selectedFeature.amount}</span><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">{selectedFeature.payment}</span></div>
                                {selectedFeature.phone && (<a href={`tel:${selectedFeature.phone}`} className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold transition-colors shadow-sm active:scale-95"><PhoneIcon className="w-3 h-3" /> Call Customer</a>)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD ---
const DeliveryDashboard: React.FC = () => {
    const { currentUser, users, orders, updateOrderStatus, reconcileAllData, logout } = useStore();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'delivery' | 'history'>('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [viewPincodeMap, setViewPincodeMap] = useState<string | null>(null);
    const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, Order[]>>({});

    const activeDeliveries = useMemo(() => orders.filter(o => o.status === 'Out for Delivery' && o.deliveryAgentId === currentUser?.id), [orders, currentUser]);
    const completedDeliveries = useMemo(() => orders.filter(o => o.status === 'Delivered' && o.deliveryAgentId === currentUser?.id), [orders, currentUser]);
    const activePincodes = useMemo(() => Array.from(new Set(activeDeliveries.map(o => o.deliveryAddress.pincode))) as string[], [activeDeliveries]);

    useEffect(() => {
        const newRoutes: Record<string, Order[]> = {};
        activePincodes.forEach(pin => {
            const ordersForPin = activeDeliveries.filter(o => o.deliveryAddress.pincode === pin);
            if (ordersForPin.length > 0) newRoutes[pin] = optimizeRoute(ordersForPin);
        });
        setOptimizedRoutes(newRoutes);
        if (activeTab === 'delivery' && activePincodes.length > 0 && !viewPincodeMap) setViewPincodeMap(activePincodes[0]);
    }, [activeDeliveries, activePincodes, activeTab]);

    const handleRefresh = () => { setIsRefreshing(true); reconcileAllData(); setTimeout(() => { setIsRefreshing(false); showToast('Synced.', 'success'); }, 800); };
    const completeDelivery = (orderId: string) => { updateOrderStatus(orderId, 'Delivered'); showToast('Delivered!', 'success'); };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-xl shadow-lg"><TruckIcon className="w-6 h-6 text-white" /></div>
                    <div><h1 className="text-lg font-black text-gray-800 tracking-tight">Delivery<span className="text-blue-600">Hub</span></h1><div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span><span className={`text-[10px] font-bold uppercase ${isOnline ? 'text-green-600' : 'text-red-500'}`}>{isOnline ? 'Online' : 'Offline'}</span></div></div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsOnline(!isOnline)} className={`p-2 rounded-xl transition-all ${isOnline ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}><div className={`w-10 h-5 rounded-full relative transition-colors ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${isOnline ? 'translate-x-5' : ''}`}></div></div></button>
                    <button onClick={handleRefresh} className="bg-gray-100 p-2.5 rounded-xl hover:bg-gray-200 transition-colors active:scale-95"><ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
                    <button onClick={logout} className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors">Logout</button>
                </div>
            </header>

            <div className="bg-white border-b sticky top-[68px] z-40 shadow-sm overflow-x-auto scrollbar-hide">
                <div className="flex px-4 gap-6">{['overview', 'delivery', 'history'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-3 text-sm font-bold border-b-2 transition-all capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{tab}</button>))}</div>
            </div>

            <main className="p-4 flex-grow max-w-3xl mx-auto w-full animate-fade-in">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between bg-white hover:shadow-md transition-all"><div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stops Remaining</p><h3 className="text-3xl font-black text-gray-800 mt-1">{activeDeliveries.length}</h3></div><div className="p-4 rounded-xl bg-orange-500 text-white shadow-lg"><LocationMarkerIcon className="w-6 h-6" /></div></div>
                            <div className="p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between bg-white hover:shadow-md transition-all"><div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Earnings Today</p><h3 className="text-3xl font-black text-gray-800 mt-1">{formatCurrency(activeDeliveries.length * 35)}</h3></div><div className="p-4 rounded-xl bg-green-600 text-white shadow-lg"><CurrencyRupeeIcon className="w-6 h-6" /></div></div>
                        </div>

                        {/* --- PERFORMANCE SECTION --- */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-blue-600" /> Performance Summary
                            </h3>
                            <div className="grid grid-cols-3 gap-6 text-center divide-x divide-gray-100">
                                <div className="px-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Delivered</p>
                                    <p className="text-2xl font-black text-gray-800">{completedDeliveries.length}</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Time</p>
                                    <p className="text-2xl font-black text-gray-800">{completedDeliveries.length > 0 ? '28m' : '--'}</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rating</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <p className="text-2xl font-black text-yellow-500">{completedDeliveries.length > 0 ? '4.8' : '--'}</p>
                                        <span className="text-sm text-gray-300 font-bold">★</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'delivery' && (
                    <div className="space-y-6 pb-20">
                        {activePincodes.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-center"><div className="bg-gray-100 p-6 rounded-full mb-4"><TruckIcon className="w-12 h-12 text-gray-400" /></div><h3 className="text-gray-800 font-bold text-lg">No Active Deliveries</h3><p className="text-gray-500 text-sm mt-1">Wait for orders to be assigned.</p></div>) : (
                            <>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{activePincodes.map(pin => (<button key={pin} onClick={() => setViewPincodeMap(pin)} className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm border transition-all ${viewPincodeMap === pin ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' : 'bg-white text-gray-600 border-gray-200'}`}>PIN: {pin}</button>))}</div>
                                {viewPincodeMap && optimizedRoutes[viewPincodeMap] && (
                                    <div className="space-y-6">
                                        <RouteMap orders={optimizedRoutes[viewPincodeMap]} pincode={viewPincodeMap} users={users} />
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><ClipboardListIcon className="w-5 h-5 text-gray-500" /> Stop List ({optimizedRoutes[viewPincodeMap].length})</h3>
                                            {optimizedRoutes[viewPincodeMap].map((order, idx) => (
                                                <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4 relative overflow-hidden group">
                                                    {idx !== optimizedRoutes[viewPincodeMap].length - 1 && (<div className="absolute left-[29px] top-12 bottom-[-20px] w-0.5 bg-gray-200 z-0"></div>)}
                                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm z-10 shadow-sm border-2 border-white ${idx === 0 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{idx + 1}</div>
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-start mb-2"><div><h3 className="font-bold text-gray-800 text-base">Order #{order.id.split('-')[1]}</h3><p className="text-sm text-gray-600 leading-snug">{order.deliveryAddress.details}</p></div><div className="text-right"><a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress.details)}`} target="_blank" className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"><ArrowPathIcon className="w-3 h-3" /> Nav</a></div></div>
                                                        <div className="flex items-center gap-2 mb-3"><span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">{order.paymentMethod}</span><span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded">{formatCurrency(order.total)}</span></div>
                                                        <button onClick={() => completeDelivery(order.id)} className="w-full bg-gray-900 text-white text-xs font-bold py-3 rounded-xl shadow-lg hover:bg-green-600 hover:shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Mark as Delivered</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'history' && <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300"><ClipboardListIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>Delivery history will appear here after completion.</p></div>}
            </main>
        </div>
    );
};

export default DeliveryDashboard;
