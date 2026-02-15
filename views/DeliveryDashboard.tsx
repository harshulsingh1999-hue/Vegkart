
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { useToast } from '../providers/ToastProvider';
import { formatCurrency, optimizeRoute } from '../utils';
import { Order, User } from '../types';
import { 
    XMarkIcon, PhoneIcon, UserCircleIcon, LocationMarkerIcon, TruckIcon, 
    ClipboardListIcon, ArrowPathIcon, CurrencyRupeeIcon, CheckCircleIcon,
    MapIcon
} from '../components/ui/Icons';

// --- GOOGLE-MAPS STYLE CONSTANTS ---
const MAP_STYLES = {
    water: '#aadaff',
    land: '#eef0f3', // Very light gray-blueish
    park: '#c5e8c5', // Soft green
    building: '#e1e3e6', // Neutral gray building
    buildingStroke: '#d6d6d6',
    roadOutline: '#ffffff', // Roads are often white with gray borders or pale yellow
    roadFill: '#ffffff', 
    mainRoadFill: '#f8c967', // Pale yellow for main roads
    routeLine: '#4285F4',
    routeHalo: 'rgba(66, 133, 244, 0.25)',
    textRoad: '#5f6368',
    textLabel: '#202124',
    textColony: '#9aa0a6'
};

// --- MAP COMPONENTS ---

// Optimized: Memoized to prevent re-rendering all blocks on map interaction
const CityBlock = React.memo(({ x, y, width, height, type, label }: any) => {
    const isPark = type === 'park';
    const fill = isPark ? MAP_STYLES.park : MAP_STYLES.building;
    const stroke = isPark ? 'none' : MAP_STYLES.buildingStroke;
    
    // Random height for "3D" effect variation if it's a building
    const depth = isPark ? 0 : (width * 0.05); 

    return (
        <g>
            {!isPark && depth > 0 && (
                <path 
                    d={`M ${x} ${y+height} L ${x+width} ${y+height} L ${x+width} ${y+height+depth} L ${x} ${y+height+depth} Z`} 
                    fill="#c8c8c8" 
                />
            )}
            <rect 
                x={x} 
                y={y} 
                width={width} 
                height={height} 
                rx={isPark ? 2 : 0.5} 
                fill={fill} 
                stroke={stroke} 
                strokeWidth={isPark ? 0 : 0.2}
            />
            {label && !isPark && width > 10 && (
                <text 
                    x={x + width/2} 
                    y={y + height/2} 
                    fontSize="2.5" 
                    fill="#70757a" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    fontWeight="500"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    {label}
                </text>
            )}
            {isPark && width > 10 && (
                <g transform={`translate(${x + width/2}, ${y + height/2})`}>
                    <text 
                        fontSize="2.2" 
                        fill="#388e3c" 
                        textAnchor="middle" 
                        dominantBaseline="middle"
                        fontWeight="600"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                        PARK
                    </text>
                </g>
            )}
        </g>
    );
});

const generateCityLayout = (pincode: string) => {
    let seed = 0;
    for (let i = 0; i < pincode.length; i++) seed += pincode.charCodeAt(i);
    const rng = () => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); };

    const blocks = [];
    const roads = [];
    const labels = [];
    
    const roadNamesH = ["MG Road", "Station Rd", "Market St", "High St", "Link Rd", "Temple Ln"];
    const roadNamesV = ["1st Ave", "Park Ave", "Central Ave", "North Ave", "5th Cross", "Main St"];
    const colonyNames = ["Shanti Nagar", "Green Park", "Model Town", "Civil Lines", "Sector 7", "Vasant Vihar", "Lake View", "Tech Zone"];
    const bldNames = ["City Mall", "Hospital", "School", "Library", "Plaza"];

    // Create a grid layout
    const cols = 5;
    const rows = 5;
    const gap = 8; // Road width
    const cellW = (100 - (cols + 1) * gap) / cols;
    const cellH = (100 - (rows + 1) * gap) / rows;

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const x = gap + c * (cellW + gap);
            const y = gap + r * (cellH + gap);
            
            const isPark = rng() > 0.8;
            const type = isPark ? 'park' : 'building';
            
            // Randomly skip blocks for open space, but rarely
            if (rng() > 0.1) {
                let label = '';
                if (!isPark && rng() > 0.7) {
                    label = bldNames[Math.floor(rng() * bldNames.length)];
                }
                blocks.push({ id: `b-${c}-${r}`, x, y, w: cellW, h: cellH, type, label });
            }
            
            // Area Labels (Colony Names) - sparsely placed
            if (r % 2 === 0 && c % 2 === 0 && rng() > 0.5) {
                const name = colonyNames[Math.floor(rng() * colonyNames.length)];
                labels.push({ x: x + cellW/2, y: y + cellH + gap/2, text: name, type: 'area' });
            }
        }
    }
    
    // Horizontal Roads
    for(let r=0; r<=rows; r++) {
        const isMain = r === Math.floor(rows/2);
        const name = roadNamesH[r % roadNamesH.length];
        roads.push({ 
            x1: 0, y1: r*(cellH+gap) + gap/2, 
            x2: 100, y2: r*(cellH+gap) + gap/2, 
            width: isMain ? gap * 1.2 : gap, 
            isMain,
            name
        });
    }
    // Vertical Roads
    for(let c=0; c<=cols; c++) {
        const isMain = c === Math.floor(cols/2);
        const name = roadNamesV[c % roadNamesV.length];
        roads.push({ 
            x1: c*(cellW+gap) + gap/2, y1: 0, 
            x2: c*(cellW+gap) + gap/2, y2: 100, 
            width: isMain ? gap * 1.2 : gap, 
            isMain,
            name,
            isVertical: true
        });
    }

    return { blocks, roads, labels };
};

const RouteMap: React.FC<{ orders: Order[], pincode: string, users: User[] }> = ({ orders, pincode, users }) => {
    const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
    const { blocks, roads, labels } = useMemo(() => generateCityLayout(pincode), [pincode]);
    
    const safeOrders = useMemo(() => orders.filter(o => o && o.deliveryAddress), [orders]);

    if (safeOrders.length === 0) return <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400">No Orders</div>;

    // Coordinate Normalization
    const coords = safeOrders.map(o => o.deliveryAddress.coordinates || { lat: 0, lng: 0 });
    const minLat = Math.min(...coords.map(c => c.lat));
    const maxLat = Math.max(...coords.map(c => c.lat));
    const minLng = Math.min(...coords.map(c => c.lng));
    const maxLng = Math.max(...coords.map(c => c.lng));

    const normalize = (val: number, min: number, max: number) => {
        if (max === min) return 50;
        return ((val - min) / (max - min)) * 60 + 20; // Keep within 20-80% to center in map
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative group">
            {/* Map Header */}
            <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-600" />
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase leading-none">Zone</p>
                    <p className="text-sm font-black text-gray-800 leading-none">{pincode}</p>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-20">
                <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                    <ArrowPathIcon className="w-3 h-3" /> Live
                </span>
            </div>
            
            {/* SVG MAP */}
            <div className="relative h-[400px] w-full bg-[#eef0f3] overflow-hidden cursor-grab active:cursor-grabbing">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" floodColor="#000000" floodOpacity="0.1"/>
                        </filter>
                    </defs>

                    {/* 1. Land Background */}
                    <rect x="0" y="0" width="100" height="100" fill={MAP_STYLES.land} />

                    {/* 2. Water Feature (Static for aesthetics) */}
                    <path d="M -10 85 Q 30 75 50 85 T 110 90 V 110 H -10 Z" fill={MAP_STYLES.water} />

                    {/* 3. Roads Layer */}
                    <g>
                        {/* Outlines */}
                        {roads.map((r, i) => (
                            <line key={`outline-${i}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#dadce0" strokeWidth={r.width + 0.5} strokeLinecap="square" />
                        ))}
                        {/* Fills */}
                        {roads.map((r, i) => (
                            <line key={`fill-${i}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={r.isMain ? MAP_STYLES.mainRoadFill : MAP_STYLES.roadFill} strokeWidth={r.width} strokeLinecap="square" />
                        ))}
                        
                        {/* Road Names */}
                        {roads.map((r, i) => (
                            <text 
                                key={`label-${i}`} 
                                x={(r.x1 + r.x2)/2} 
                                y={(r.y1 + r.y2)/2 + (r.isVertical ? 0 : 0.5)} 
                                fontSize="2" 
                                fill={MAP_STYLES.textRoad} 
                                textAnchor="middle" 
                                dominantBaseline="middle"
                                transform={r.isVertical ? `rotate(90, ${(r.x1 + r.x2)/2}, ${(r.y1 + r.y2)/2})` : ''}
                                style={{ pointerEvents: 'none', userSelect: 'none' }}
                            >
                                {r.name}
                            </text>
                        ))}
                    </g>

                    {/* 4. Blocks (Buildings/Parks) */}
                    {blocks.map(b => (
                        <CityBlock key={b.id} x={b.x} y={b.y} width={b.w} height={b.h} type={b.type} label={b.label} />
                    ))}

                    {/* 5. Area Labels (Colony Names) */}
                    {labels.map((l, i) => (
                        <text 
                            key={`area-${i}`} 
                            x={l.x} 
                            y={l.y} 
                            fontSize="3" 
                            fill={MAP_STYLES.textColony} 
                            textAnchor="middle" 
                            fontWeight="bold"
                            style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0px 0px 2px white' }}
                        >
                            {l.text.toUpperCase()}
                        </text>
                    ))}

                    {/* 6. Route Line */}
                    <g filter="url(#shadow)">
                        <polyline 
                            points={safeOrders.map(o => {
                                const c = o.deliveryAddress.coordinates || { lat: 0, lng: 0 };
                                return `${normalize(c.lng, minLng, maxLng)},${100 - normalize(c.lat, minLat, maxLat)}`;
                            }).join(' ')}
                            fill="none" 
                            stroke={MAP_STYLES.routeHalo} 
                            strokeWidth="3" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <polyline 
                            points={safeOrders.map(o => {
                                const c = o.deliveryAddress.coordinates || { lat: 0, lng: 0 };
                                return `${normalize(c.lng, minLng, maxLng)},${100 - normalize(c.lat, minLat, maxLat)}`;
                            }).join(' ')}
                            fill="none" 
                            stroke={MAP_STYLES.routeLine} 
                            strokeWidth="1" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="2"
                            className="animate-[dash_1s_linear_infinite]"
                        />
                        <style>{`@keyframes dash { to { stroke-dashoffset: -4; } }`}</style>
                    </g>
                </svg>

                {/* Markers Overlay */}
                {safeOrders.map((o, i) => {
                    const c = o.deliveryAddress.coordinates || { lat: 0, lng: 0 };
                    const left = normalize(c.lng, minLng, maxLng);
                    const top = 100 - normalize(c.lat, minLat, maxLat);
                    const customer = users.find(u => u.id === o.userId);
                    const isSelected = selectedFeature?.id === o.id;

                    return (
                        <div 
                            key={o.id}
                            className="absolute transform -translate-x-1/2 -translate-y-full z-30 transition-all duration-300"
                            style={{ left: `${left}%`, top: `${top}%`, zIndex: isSelected ? 50 : 30 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFeature({
                                    id: o.id, name: `Delivery #${i + 1}`,
                                    address: o.deliveryAddress.details, 
                                    amount: formatCurrency(o.total),
                                    phone: customer?.phone, customerName: customer?.name,
                                    payment: o.paymentMethod
                                });
                            }}
                        >
                            {/* Pin Shape */}
                            <div className={`relative flex flex-col items-center group cursor-pointer ${isSelected ? 'scale-125' : 'hover:scale-110'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white transition-colors ${
                                    isSelected ? 'bg-gray-900 text-white' : 
                                    i === 0 ? 'bg-green-600 text-white' : 
                                    'bg-red-500 text-white'
                                }`}>
                                    {i + 1}
                                </div>
                                <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-0.5 drop-shadow-sm ${
                                    isSelected ? 'border-t-gray-900' : 
                                    i === 0 ? 'border-t-green-600' : 
                                    'border-t-red-500'
                                }`}></div>
                                <div className="w-6 h-1.5 bg-black/20 blur-[2px] rounded-full mt-0.5"></div>
                            </div>
                        </div>
                    );
                })}

                {/* Info Window */}
                {selectedFeature && (
                    <div className="absolute bottom-4 left-4 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 border border-gray-200 animate-fade-in">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedFeature(null); }} 
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="flex gap-4 items-start">
                            <div className="bg-blue-50 p-2.5 rounded-full text-blue-600">
                                <UserCircleIcon className="w-8 h-8" />
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-gray-900 text-base">{selectedFeature.customerName}</h4>
                                <p className="text-xs text-gray-500 font-medium mb-2">{selectedFeature.address}</p>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100">
                                        {selectedFeature.amount}
                                    </span>
                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">
                                        {selectedFeature.payment}
                                    </span>
                                </div>

                                {selectedFeature.phone && (
                                    <a href={`tel:${selectedFeature.phone}`} className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold transition-colors shadow-sm active:scale-95">
                                        <PhoneIcon className="w-3 h-3" /> Call Customer
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const DeliveryDashboard: React.FC = () => {
    const currentUser = useStore(state => state.currentUser);
    const users = useStore(state => state.users);
    const orders: Order[] = useStore(state => state.orders);
    const updateOrderStatus = useStore(state => state.updateOrderStatus);
    const reconcileAllData = useStore(state => state.reconcileAllData);
    const logout = useStore(state => state.logout);
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'overview' | 'delivery' | 'history'>('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [viewPincodeMap, setViewPincodeMap] = useState<string | null>(null);
    const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, Order[]>>({});

    // Filter active deliveries
    const activeDeliveries = useMemo(() => orders.filter(o => 
        o.status === 'Out for Delivery' && o.deliveryAgentId === currentUser?.id
    ), [orders, currentUser]);

    const activePincodes = useMemo(() => Array.from(new Set(activeDeliveries.map(o => o.deliveryAddress.pincode))), [activeDeliveries]);

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

    const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
        <div className="p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between bg-white hover:shadow-md transition-all">
            <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p><h3 className="text-3xl font-black text-gray-800 mt-1">{value}</h3></div>
            <div className={`p-4 rounded-xl ${colorClass} text-white shadow-lg`}><Icon className="w-6 h-6" /></div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-xl shadow-lg"><TruckIcon className="w-6 h-6 text-white" /></div>
                    <div>
                        <h1 className="text-lg font-black text-gray-800 tracking-tight">Delivery<span className="text-blue-600">Hub</span></h1>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span className={`text-[10px] font-bold uppercase ${isOnline ? 'text-green-600' : 'text-red-500'}`}>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsOnline(!isOnline)} className={`p-2 rounded-xl transition-all ${isOnline ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${isOnline ? 'translate-x-5' : ''}`}></div>
                        </div>
                    </button>
                    <button onClick={handleRefresh} className="bg-gray-100 p-2.5 rounded-xl hover:bg-gray-200 transition-colors active:scale-95"><ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
                    <button onClick={logout} className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors">Logout</button>
                </div>
            </header>

            <div className="bg-white border-b sticky top-[68px] z-40 shadow-sm overflow-x-auto scrollbar-hide">
                <div className="flex px-4 gap-6">
                    {['overview', 'delivery', 'history'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-3 text-sm font-bold border-b-2 transition-all capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{tab}</button>
                    ))}
                </div>
            </div>

            <main className="p-4 flex-grow max-w-3xl mx-auto w-full animate-fade-in">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatCard title="Stops Remaining" value={activeDeliveries.length} icon={LocationMarkerIcon} colorClass="bg-orange-500" />
                            <StatCard title="Today's Earnings" value={formatCurrency(activeDeliveries.length * 35)} icon={CurrencyRupeeIcon} colorClass="bg-green-600" />
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-blue-900">Vehicle Check</h3>
                                <p className="text-xs text-blue-700 mt-1">Ensure your vehicle is ready for the route.</p>
                            </div>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-blue-700">Submit Log</button>
                        </div>
                    </div>
                )}

                {activeTab === 'delivery' && (
                    <div className="space-y-6 pb-20">
                        {activePincodes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-gray-100 p-6 rounded-full mb-4">
                                    <TruckIcon className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-gray-800 font-bold text-lg">No Active Deliveries</h3>
                                <p className="text-gray-500 text-sm mt-1">Wait for orders to be assigned.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {activePincodes.map(pin => (
                                        <button key={pin} onClick={() => setViewPincodeMap(pin)} className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm border transition-all ${viewPincodeMap === pin ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' : 'bg-white text-gray-600 border-gray-200'}`}>PIN: {pin}</button>
                                    ))}
                                </div>
                                {viewPincodeMap && optimizedRoutes[viewPincodeMap] && (
                                    <div className="space-y-6">
                                        <RouteMap orders={optimizedRoutes[viewPincodeMap]} pincode={viewPincodeMap} users={users} />
                                        
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                <ClipboardListIcon className="w-5 h-5 text-gray-500" />
                                                Stop List ({optimizedRoutes[viewPincodeMap].length})
                                            </h3>
                                            
                                            {optimizedRoutes[viewPincodeMap].map((order, idx) => (
                                                <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4 relative overflow-hidden group">
                                                    {/* Connector Line */}
                                                    {idx !== optimizedRoutes[viewPincodeMap].length - 1 && (
                                                        <div className="absolute left-[29px] top-12 bottom-[-20px] w-0.5 bg-gray-200 z-0"></div>
                                                    )}
                                                    
                                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm z-10 shadow-sm border-2 border-white ${idx === 0 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{idx + 1}</div>
                                                    
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="font-bold text-gray-800 text-base">Order #{order.id.split('-')[1]}</h3>
                                                                <p className="text-sm text-gray-600 leading-snug">{order.deliveryAddress.details}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <a 
                                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress.details)}`} 
                                                                    target="_blank" 
                                                                    className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                                                >
                                                                    <ArrowPathIcon className="w-3 h-3" /> Nav
                                                                </a>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">{order.paymentMethod}</span>
                                                            <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded">{formatCurrency(order.total)}</span>
                                                        </div>

                                                        <button 
                                                            onClick={() => completeDelivery(order.id)} 
                                                            className="w-full bg-gray-900 text-white text-xs font-bold py-3 rounded-xl shadow-lg hover:bg-green-600 hover:shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                        >
                                                            <CheckCircleIcon className="w-4 h-4" /> Mark as Delivered
                                                        </button>
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
                
                {activeTab === 'history' && (
                    <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                        <ClipboardListIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Delivery history will appear here after completion.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DeliveryDashboard;
