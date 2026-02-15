
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Address } from '../types';
import { useToast } from '../providers/ToastProvider';
import { LocationMarkerIcon, PlusIcon } from '../components/ui/Icons';

// --- VISUALIZATION HELPERS ---

const MAP_STYLES = {
    water: '#aadaff',
    land: '#eef0f3',
    park: '#c5e8c5', 
    building: '#e1e3e6',
    roadFill: '#ffffff',
    roadStroke: '#e0e0e0',
    textRoad: '#757575',
    textColony: '#9aa0a6'
};

const CityBlock = ({ x, y, width, height, type }: any) => {
    const isPark = type === 'park';
    const fill = isPark ? MAP_STYLES.park : MAP_STYLES.building;
    const stroke = isPark ? 'none' : '#d6d6d6';
    
    return (
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
    );
};

const VisualMapPlaceholder = ({ pincode, active }: { pincode: string, active: boolean }) => {
    // Deterministic Map Generation
    const seed = pincode.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
    const { blocks, horizontalRoads, verticalRoads } = useMemo(() => {
        const b = [];
        const cols = 6, rows = 3, gap = 8;
        const cw = (100 - (cols+1)*gap)/cols;
        const ch = (100 - (rows+1)*gap)/rows;
        let s = seed;
        const rng = () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };

        for(let c=0; c<cols; c++) {
            for(let r=0; r<rows; r++) {
                // Randomly skip some blocks
                if (rng() > 0.1) {
                    b.push({ x: gap + c*(cw+gap), y: gap + r*(ch+gap), w: cw, h: ch, type: rng() > 0.7 ? 'park' : 'bld' });
                }
            }
        }
        
        const hRoads = [];
        for(let r=0; r<=rows; r++) hRoads.push(r*(ch+gap) + gap/2);
        
        const vRoads = [];
        for(let c=0; c<=cols; c++) vRoads.push(c*(cw+gap) + gap/2);

        return { blocks: b, horizontalRoads: hRoads, verticalRoads: vRoads };
    }, [seed]);

    return (
        <div className={`w-full h-32 bg-[#eef0f3] rounded-xl overflow-hidden relative border-2 transition-all ${active ? 'border-green-500 opacity-100 shadow-md' : 'border-transparent opacity-60'}`}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                {/* Background */}
                <rect x="0" y="0" width="100" height="50" fill={MAP_STYLES.land} />
                
                {/* Buildings/Parks */}
                {blocks.map((b, i) => <CityBlock key={i} {...b} />)}
                
                {/* Roads: Outline First */}
                {horizontalRoads.map((y, i) => <line key={`h-out-${i}`} x1="0" y1={y} x2="100" y2={y} stroke={MAP_STYLES.roadStroke} strokeWidth="6" />)}
                {verticalRoads.map((x, i) => <line key={`v-out-${i}`} x1={x} y1="0" x2={x} y2="50" stroke={MAP_STYLES.roadStroke} strokeWidth="6" />)}
                
                {/* Roads: Fill Second */}
                {horizontalRoads.map((y, i) => <line key={`h-fill-${i}`} x1="0" y1={y} x2="100" y2={y} stroke={MAP_STYLES.roadFill} strokeWidth="4" />)}
                {verticalRoads.map((x, i) => <line key={`v-fill-${i}`} x1={x} y1="0" x2={x} y2="50" stroke={MAP_STYLES.roadFill} strokeWidth="4" />)}
                
                {/* Minimal Street Name Labels */}
                {horizontalRoads.map((y, i) => (
                    i % 2 !== 0 && 
                    <text 
                        key={`t-h-${i}`} 
                        x="50" 
                        y={y} 
                        fontSize="2.5" 
                        fill="#9aa0a6" 
                        textAnchor="middle" 
                        dominantBaseline="middle"
                        style={{ pointerEvents: 'none' }}
                    >
                        Road {i+1}
                    </text>
                ))}
            </svg>
            
            {/* Center Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full transform drop-shadow-xl filter">
                <div className={`relative ${active ? 'animate-bounce' : ''}`}>
                    <LocationMarkerIcon className={`w-8 h-8 ${active ? 'text-red-600' : 'text-gray-400'}`} />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 blur-sm rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

const LocationSelection: React.FC = () => {
    const currentUser = useStore(state => state.currentUser);
    const setSelectedAddress = useStore(state => state.setSelectedAddress);
    const addAddress = useStore(state => state.addAddress);

    const { showToast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    
    // Form State
    const [label, setLabel] = useState('Home');
    const [details, setDetails] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [state, setState] = useState('');
    const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | undefined>(undefined);

    const handleAddAddress = (e: React.FormEvent) => {
        e.preventDefault();
        if (label && details && city && pincode && state) {
            addAddress({ label, details, city, pincode, state, coordinates });
            showToast('Address added successfully!', 'success');
            setIsAdding(false);
        } else {
            showToast('Please fill all fields.', 'error');
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser.', 'error');
            return;
        }

        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoordinates({ lat: latitude, lng: longitude });

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    
                    if (data && data.address) {
                        const addr = data.address;
                        setCity(addr.city || addr.town || addr.village || '');
                        setState(addr.state || '');
                        setPincode(addr.postcode || '');
                        
                        const streetParts = [addr.house_number, addr.building, addr.road, addr.suburb].filter(Boolean);
                        setDetails(streetParts.join(', ') || 'Detected Location');
                        
                        showToast('Location detected successfully!', 'success');
                    } else {
                        showToast('Could not fetch address details.', 'info');
                    }
                } catch (error) {
                    console.error('Geocoding error:', error);
                    showToast('Failed to fetch address details. Please enter manually.', 'error');
                } finally {
                    setIsLoadingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                showToast('Unable to retrieve location.', 'error');
                setIsLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    if (!currentUser) return null;

    if (currentUser.addresses.length === 0 || isAdding) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
                    <h2 className="text-xl font-bold mb-4">{isAdding ? 'Add New Address' : 'Welcome! Please add an address.'}</h2>
                    
                    <div className="mb-6">
                        <VisualMapPlaceholder pincode={pincode || '000000'} active={true} />
                    </div>

                    <button 
                        type="button"
                        onClick={detectLocation}
                        disabled={isLoadingLocation}
                        className="w-full mb-6 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all transform active:scale-95"
                    >
                        {isLoadingLocation ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <LocationMarkerIcon className="w-5 h-5" />
                        )}
                        {isLoadingLocation ? 'Detecting...' : 'Use Current Location'}
                    </button>

                    <div className="relative flex py-2 items-center mb-4">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Or enter manually</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <form onSubmit={handleAddAddress} className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase">Label</label>
                            <div className="flex gap-2">
                                {['Home', 'Work', 'Other'].map(l => (
                                    <button key={l} type="button" onClick={() => setLabel(l)} className={`flex-1 py-2 text-sm font-bold border rounded-lg transition-colors ${label === l ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600'}`}>{l}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase">Details</label>
                            <input type="text" value={details} onChange={e => setDetails(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Flat / Building / Street" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase">City</label>
                                <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="City" required />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase">Pincode</label>
                                <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Pincode" maxLength={6} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase">State</label>
                            <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="State" required />
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                             {currentUser.addresses.length > 0 && (
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-xl hover:bg-gray-200 font-bold transition-colors">Cancel</button>
                             )}
                            <button type="submit" className="flex-1 bg-green-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all transform active:scale-95">Save & Continue</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Select Delivery Location</h2>
            <div className="space-y-4">
                {currentUser.addresses.map((address: Address) => (
                    <button 
                        key={address.id} 
                        onClick={() => setSelectedAddress(address)}
                        className="w-full text-left p-0 border rounded-xl hover:border-green-500 transition-all shadow-sm bg-white group hover:shadow-md overflow-hidden relative"
                    >
                        {/* Map Preview Background */}
                        <div className="absolute top-0 right-0 w-28 h-full opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none border-l border-gray-100">
                            <VisualMapPlaceholder pincode={address.pincode} active={false} />
                        </div>

                        <div className="p-4 relative z-10 pr-32">
                            <div className="flex justify-between items-center mb-1">
                                 <span className={`font-bold text-[10px] px-2 py-0.5 rounded uppercase ${address.label === 'Home' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{address.label}</span>
                            </div>
                            <p className="text-gray-900 font-bold truncate">{address.details}</p>
                            <p className="text-gray-500 text-xs">{address.city}, {address.state} - {address.pincode}</p>
                        </div>
                    </button>
                ))}
                
                <button 
                    onClick={() => {
                        setIsAdding(true);
                        setDetails(''); setCity(''); setState(''); setPincode(''); setCoordinates(undefined);
                    }}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-600 hover:bg-green-50 font-bold transition-all flex items-center justify-center gap-2"
                >
                    <PlusIcon className="h-5 w-5" />
                    Add New Address
                </button>
            </div>
        </div>
    );
};

export default LocationSelection;
