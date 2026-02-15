
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store';
import { formatCurrency, timeAgo, checkDateFilter, getDateOnly, getTimeOnly } from '../../utils';
import { Order, User } from '../../types';
import { useToast } from '../../providers/ToastProvider';
import { XMarkIcon, TruckIcon, UserCircleIcon, PhoneIcon, ClipboardListIcon, CheckCircleIcon } from '../../components/ui/Icons';

// --- VISUALIZATION MAP COMPONENT ---
// Reusing logic from DeliveryDashboard for consistency
const MAP_STYLES = {
    water: '#aadaff',
    land: '#eef0f3',
    park: '#c5e8c5',
    building: '#e1e3e6',
    buildingStroke: '#d6d6d6',
    roadOutline: '#ffffff',
    roadFill: '#ffffff',
    mainRoadFill: '#f8c967'
};

const CityBlock = React.memo(({ x, y, width, height, type }: any) => {
    const isPark = type === 'park';
    const fill = isPark ? MAP_STYLES.park : MAP_STYLES.building;
    const stroke = isPark ? 'none' : MAP_STYLES.buildingStroke;
    const depth = isPark ? 0 : (width * 0.05);

    return (
        <g>
            {!isPark && depth > 0 && (
                <path d={`M ${x} ${y+height} L ${x+width} ${y+height} L ${x+width} ${y+height+depth} L ${x} ${y+height+depth} Z`} fill="#c8c8c8" />
            )}
            <rect x={x} y={y} width={width} height={height} rx={isPark ? 2 : 0.5} fill={fill} stroke={stroke} strokeWidth={isPark ? 0 : 0.2} />
        </g>
    );
});

const TrackingMap = ({ order, deliveryPartner }: { order: Order, deliveryPartner?: User }) => {
    // Generate deterministic layout based on pincode
    const seed = order.deliveryAddress.pincode.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
    
    const { blocks, roads } = useMemo(() => {
        let s = seed;
        const rng = () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
        
        const b = [];
        const r = [];
        const cols = 5, rows = 5, gap = 8;
        const cw = (100 - (cols+1)*gap)/cols;
        const ch = (100 - (rows+1)*gap)/rows;

        // Blocks
        for(let c=0; c<cols; c++) {
            for(let row=0; row<rows; row++) {
                if (rng() > 0.1) {
                    b.push({ x: gap + c*(cw+gap), y: gap + row*(ch+gap), w: cw, h: ch, type: rng() > 0.8 ? 'park' : 'bld' });
                }
            }
        }
        
        // Roads
        for(let row=0; row<=rows; row++) {
            const isMain = row === Math.floor(rows/2);
            r.push({ x1: 0, y1: row*(ch+gap) + gap/2, x2: 100, y2: row*(ch+gap) + gap/2, width: isMain ? gap * 1.2 : gap, isMain });
        }
        for(let c=0; c<=cols; c++) {
            const isMain = c === Math.floor(cols/2);
            r.push({ x1: c*(cw+gap) + gap/2, y1: 0, x2: c*(cw+gap) + gap/2, y2: 100, width: isMain ? gap * 1.2 : gap, isMain });
        }

        return { blocks: b, roads: r };
    }, [seed]);

    return (
        <div className="relative w-full h-full bg-[#f0f2f5] overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <rect x="0" y="0" width="100" height="100" fill={MAP_STYLES.land} />
                
                {/* Roads */}
                {roads.map((r, i) => (
                    <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={r.isMain ? MAP_STYLES.mainRoadFill : MAP_STYLES.roadFill} strokeWidth={r.width} strokeLinecap="square" />
                ))}

                {blocks.map((b, i) => <CityBlock key={i} {...b} />)}
                
                {/* Route Path */}
                <path d="M 20 20 Q 50 20 50 50 T 80 80" fill="none" stroke="rgba(66, 133, 244, 0.3)" strokeWidth="3" strokeLinecap="round" />
                <path d="M 20 20 Q 50 20 50 50 T 80 80" fill="none" stroke="#4285F4" strokeWidth="1" strokeDasharray="2" className="animate-[dash_2s_linear_infinite]" />
                <style>{`@keyframes dash { to { stroke-dashoffset: -4; } }`}</style>

                {/* Store Pin */}
                <g transform="translate(20, 20)">
                    <circle r="4" fill="#16a34a" stroke="white" strokeWidth="1" />
                    <text y="1" fontSize="3" textAnchor="middle" fill="white" fontWeight="bold">S</text>
                </g>
                
                {/* Home Pin */}
                <g transform="translate(80, 80)">
                    <circle r="4" fill="#dc2626" stroke="white" strokeWidth="1" />
                    <text y="1" fontSize="3" textAnchor="middle" fill="white" fontWeight="bold">H</text>
                </g>
            </svg>

            {/* Truck Animation */}
            <style>{`
                @keyframes moveTruck {
                    0% { left: 20%; top: 20%; transform: translate(-50%, -50%) rotate(0deg); }
                    25% { left: 50%; top: 20%; transform: translate(-50%, -50%) rotate(0deg); }
                    30% { left: 50%; top: 20%; transform: translate(-50%, -50%) rotate(90deg); }
                    50% { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
                    55% { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(0deg); }
                    100% { left: 80%; top: 80%; transform: translate(-50%, -50%) rotate(0deg); }
                }
            `}</style>
            <div 
                className="absolute z-10 p-1.5 bg-white rounded-full shadow-xl border-2 border-blue-600 text-blue-600"
                style={{ animation: 'moveTruck 10s linear infinite alternate' }}
            >
                <TruckIcon className="w-4 h-4" />
            </div>

            {/* Live Status Overlay */}
            <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none">
                <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm text-green-700 border border-green-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live Tracking
                </div>
                <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm text-gray-700 border border-gray-200">
                    ETA: 12 Mins
                </div>
            </div>
        </div>
    );
};

const OrderProgressBar = ({ status }: { status: string }) => {
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

    if (isCancelled || isReturned) {
        return (
            <div className="mt-3 w-full bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-bold text-red-700 uppercase tracking-wide">{status}</span>
            </div>
        );
    }

    return (
        <div className="w-full mt-4">
            <div className="flex justify-between mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                <span className={currentStep >= 0 ? 'text-green-600' : ''}>Ordered</span>
                <span className={currentStep >= 1 ? 'text-green-600' : ''}>Packed</span>
                <span className={currentStep >= 2 ? 'text-green-600' : ''}>Route</span>
                <span className={currentStep >= 3 ? 'text-green-600' : ''}>Done</span>
            </div>
            <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2 rounded-full"></div>
                <div 
                    className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 transition-all duration-1000 ease-in-out rounded-full"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
                {[0, 1, 2, 3].map((step) => {
                    const isCurrent = step === currentStep;
                    const isCompleted = step <= currentStep;
                    return (
                        <div key={step} className="relative group">
                            <div 
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${
                                    isCurrent ? 'bg-white border-green-600 scale-125 ring-2 ring-green-200 shadow-sm' : 
                                    isCompleted ? 'bg-green-600 border-green-600' : 
                                    'bg-gray-50 border-gray-200'
                                }`}
                            >
                                {isCurrent && <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-ping" />}
                                {isCompleted && !isCurrent && <CheckCircleIcon className="w-3 h-3 text-green-600" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const OrderHistory: React.FC = () => {
    const orders = useStore(state => state.orders);
    const currentUser = useStore(state => state.currentUser);
    const users = useStore(state => state.users);
    const requestReturn = useStore(state => state.requestReturn);
    const { showToast } = useToast();
    
    const [filter, setFilter] = useState('All Time');
    const filterOptions = ['All Time', 'Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Last 1 Year'];

    // Return Modal State
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [returnReason, setReturnReason] = useState('');
    
    // Tracking Modal State
    const [trackModalOpen, setTrackModalOpen] = useState(false);

    const userOrders = orders
        .filter(o => o.userId === currentUser?.id)
        .filter(o => checkDateFilter(o.date, filter))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleReturnClick = (orderId: string) => {
        setSelectedOrderId(orderId);
        setReturnReason('');
        setReturnModalOpen(true);
    };

    const handleTrackOrder = (orderId: string) => {
        setSelectedOrderId(orderId);
        setTrackModalOpen(true);
    };

    const submitReturnRequest = () => {
        if (!selectedOrderId) return;
        if (!returnReason.trim()) {
            showToast('Please provide a reason for return.', 'error');
            return;
        }
        
        requestReturn(selectedOrderId, returnReason);
        showToast('Return requested successfully.', 'success');
        setReturnModalOpen(false);
        setSelectedOrderId(null);
    };

    const selectedOrderForTracking = orders.find(o => o.id === selectedOrderId);
    const selectedDriver = selectedOrderForTracking ? users.find(u => u.id === selectedOrderForTracking.deliveryAgentId) : undefined;

    if (orders.filter(o => o.userId === currentUser?.id).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 animate-fade-in">
                <div className="bg-green-50 p-6 rounded-full mb-4">
                    <ClipboardListIcon className="w-16 h-16 text-green-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h3>
                <p className="text-gray-500">Your order history will appear here.</p>
            </div>
        );
    }

    return (
        <div className="pb-24 animate-fade-in">
            <div className="sticky top-0 bg-gray-50 z-10 pb-4 pt-2">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-2xl font-extrabold text-gray-800">My Orders</h2>
                    <div className="relative">
                        <select 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            {filterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-5">
                {userOrders.map((order: Order) => (
                    <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                        #{order.id.split('-')[1]}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">{timeAgo(order.date)}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1 font-medium">{getDateOnly(order.date)} at {getTimeOnly(order.date)}</p>
                            </div>
                            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-blue-50 text-blue-600'
                            }`}>
                                {order.status}
                            </span>
                        </div>

                        {/* Item Summary */}
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex-shrink-0 relative">
                                    <img src={item.image} className="w-12 h-12 rounded-lg object-cover border border-gray-100" alt={item.name} />
                                    <span className="absolute -bottom-1 -right-1 bg-gray-900 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                        {item.quantity}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Progress */}
                        <OrderProgressBar status={order.status} />

                        {/* Live Actions */}
                        {(order.status === 'Out for Delivery' || order.status === 'Ready for Pickup') && (
                            <div className="mt-4 bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-xs text-blue-800 font-bold uppercase mb-0.5">ETA</p>
                                        <p className="text-lg font-black text-blue-900 leading-none">12 Mins</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-blue-800 font-bold uppercase mb-0.5">PIN</p>
                                        <p className="text-lg font-black text-blue-900 font-mono leading-none tracking-widest">{order.deliveryOtp}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleTrackOrder(order.id)}
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    <TruckIcon className="w-4 h-4" /> Track Driver
                                </button>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="border-t border-gray-100 pt-3 mt-4 flex justify-between items-center">
                            <div className="text-xs text-gray-500 font-medium">
                                Paid via {order.paymentMethod}
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-black text-gray-800 text-lg">{formatCurrency(order.total)}</span>
                                {order.status === 'Delivered' && !order.returnStatus && (
                                    <button 
                                        onClick={() => handleReturnClick(order.id)}
                                        className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors border border-red-100"
                                    >
                                        Return
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Return Modal */}
            {returnModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
                        <button onClick={() => setReturnModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><XMarkIcon className="w-5 h-5" /></button>
                        <h3 className="text-xl font-black text-gray-800 mb-4">Return Order</h3>
                        <select 
                            value={returnReason} 
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-3 mb-4 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        >
                            <option value="">Select Reason...</option>
                            <option value="Quality Issue">Quality Issue</option>
                            <option value="Wrong Item">Wrong Item</option>
                            <option value="Other">Other</option>
                        </select>
                        <button onClick={submitReturnRequest} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg">Submit Request</button>
                    </div>
                </div>
            )}

            {/* Tracking Modal */}
            {trackModalOpen && selectedOrderForTracking && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative h-[70vh] flex flex-col">
                        <div className="absolute top-4 right-4 z-20"><button onClick={() => setTrackModalOpen(false)} className="bg-white/80 p-2 rounded-full"><XMarkIcon className="w-5 h-5" /></button></div>
                        <div className="flex-grow relative bg-blue-50">
                            <TrackingMap order={selectedOrderForTracking} deliveryPartner={selectedDriver} />
                        </div>
                        <div className="p-5 bg-white border-t rounded-t-3xl -mt-4 relative z-10">
                            <div className="flex justify-between items-center mb-4">
                                <div><p className="text-xs text-gray-400 font-bold uppercase">Estimated Arrival</p><h2 className="text-2xl font-black text-gray-800">12 Mins</h2></div>
                                <div className="text-right"><p className="text-xs text-gray-400 font-bold uppercase">Driver</p><p className="text-lg font-bold text-gray-800">{selectedDriver?.name || 'Partner'}</p></div>
                            </div>
                            <a href={`tel:${selectedDriver?.phone}`} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"><PhoneIcon className="w-5 h-5" /> Call Driver</a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
