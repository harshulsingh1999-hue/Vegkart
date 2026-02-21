
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { Product, ProductVariant, Order, InventoryRule } from '../types';
import { useToast } from '../providers/ToastProvider';
import { formatCurrency, timeAgo, checkDateFilter, getDateOnly, getTimeOnly, isVideo } from '../utils';
import { locationDB } from '../data/locations';
import { 
    PencilIcon, TrashIcon, PlusIcon, CheckCircleIcon, XMarkIcon, ShopIcon,
    TruckIcon, ClipboardListIcon, UserCircleIcon, CogIcon, BadgeCheckIcon,
    ArrowPathIcon, InformationCircleIcon, DevicePhoneMobileIcon, ExclamationCircleIcon,
    WrenchScrewdriverIcon, CurrencyRupeeIcon, BriefcaseIcon, ClockIcon, TagIcon,
    ChatBubbleLeftRightIcon, CloudArrowUpIcon, MagicWandIcon, GlobeAltIcon, DuplicateIcon
} from '../components/ui/Icons';
import ExportMenu from '../components/ExportMenu';
import ImportButton from '../components/ImportButton';

// --- DEFINITIONS & HELPERS ---

interface ProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    editProduct: Product | null;
    isCloneMode?: boolean;
}

// --- SUB-COMPONENTS ---

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
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2 rounded"></div>
                <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-green-500 -z-10 -translate-y-1/2 transition-all duration-700 ease-in-out"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
                {[0, 1, 2, 3].map((step) => {
                    const isCurrent = step === currentStep;
                    const isCompleted = step <= currentStep;
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

const SalesChart = ({ orders }: { orders: Order[] }) => {
    const data = useMemo(() => {
        const days = [];
        const today = new Date();
        let maxVal = 0;
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            
            const dailyTotal = orders
                .filter(o => o.status !== 'Cancelled' && new Date(o.date).toDateString() === d.toDateString())
                .reduce((acc, o) => acc + (o.total || 0), 0);
            
            if (dailyTotal > maxVal) maxVal = dailyTotal;
            days.push({ day: dateStr, value: dailyTotal });
        }
        return { days, maxVal: maxVal || 1 };
    }, [orders]);

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CurrencyRupeeIcon className="w-5 h-5 text-green-600" /> Weekly Revenue
            </h3>
            <div className="flex items-end justify-between h-32 gap-2">
                {data.days.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div 
                            className="w-full bg-green-100 rounded-t-md relative group-hover:bg-green-200 transition-all duration-500"
                            style={{ height: `${(item.value / data.maxVal) * 100}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {formatCurrency(item.value)}
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold">{item.day}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const OrderDetailsModal = ({ order, isOpen, onClose }: { order: Order | null, isOpen: boolean, onClose: () => void }) => {
    const users = useStore(state => state.users);
    
    if (!isOpen || !order) return null;

    const deliveryPartner = users.find(u => u.id === order.deliveryAgentId);
    const customer = users.find(u => u.id === order.userId);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        Order #{order.id.split('-')[1]} Details
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-green-50 rounded-xl p-5 border border-green-100 shadow-sm">
                        <h4 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <UserCircleIcon className="w-5 h-5" /> Customer Info
                        </h4>
                        <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-full shadow-sm text-green-600 border border-green-100">
                                <UserCircleIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{customer?.name || 'Unknown User'}</p>
                                <p className="font-mono text-gray-600 text-sm mb-1">+91 {customer?.phone}</p>
                                <div className="text-xs text-gray-500 bg-white/50 p-2 rounded border border-green-100 mt-2">
                                    <p className="font-bold uppercase text-[10px] text-gray-400 mb-0.5">Shipping Address</p>
                                    <p>{order.deliveryAddress.details}</p>
                                    <p>{order.deliveryAddress.city} - {order.deliveryAddress.pincode}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 shadow-sm">
                        <h4 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <TruckIcon className="w-5 h-5" /> Delivery Partner
                        </h4>
                        {deliveryPartner ? (
                            <div className="flex items-start gap-4">
                                <div className="bg-white p-3 rounded-full shadow-sm text-orange-600 border border-orange-100">
                                    <TruckIcon className="w-8 h-8" />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-bold text-gray-900">{deliveryPartner.name}</p>
                                    <p className="font-mono text-gray-700 text-sm flex items-center gap-1">
                                        <DevicePhoneMobileIcon className="w-3 h-3"/> +91 {deliveryPartner.phone}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 font-bold">Vehicle: {deliveryPartner.vehicleDetails}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-orange-400 italic bg-white/50 p-3 rounded-lg border border-orange-100 border-dashed text-sm">
                                <ExclamationCircleIcon className="w-5 h-5" />
                                <span>Pending assignment. Waiting for pickup.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RichTextEditor = ({ value, onChange }: { value: string, onChange: (html: string) => void }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            if (!editorRef.current.innerText.trim() && !editorRef.current.querySelector('img')) {
                 editorRef.current.innerHTML = value;
            } else if (value !== editorRef.current.innerHTML) {
                 editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const exec = (command: string, value: string | undefined = undefined) => {
        try {
            document.execCommand(command, false, value);
            if (editorRef.current) {
                onChange(editorRef.current.innerHTML);
            }
        } catch (e) {
            console.error("RichTextEditor Error:", e);
        }
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const html = e.currentTarget.innerHTML;
        if (html !== value) {
            onChange(html);
        }
    };

    return (
        <div className="border rounded-lg overflow-hidden border-gray-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
            <div className="bg-gray-50 p-2 flex gap-2 border-b border-gray-200 flex-wrap items-center">
                <div className="flex bg-white rounded border border-gray-200 divide-x divide-gray-200 shadow-sm">
                    <button type="button" onClick={() => exec('bold')} className="px-3 py-1 font-bold hover:bg-gray-50 text-gray-700" title="Bold">B</button>
                    <button type="button" onClick={() => exec('italic')} className="px-3 py-1 italic hover:bg-gray-50 text-gray-700" title="Italic">I</button>
                    <button type="button" onClick={() => exec('underline')} className="px-3 py-1 underline hover:bg-gray-50 text-gray-700" title="Underline">U</button>
                </div>
                
                 <div className="flex gap-1 items-center bg-white rounded border border-gray-200 px-2 py-1 shadow-sm">
                    <span className="text-xs text-gray-500 font-bold">Color:</span>
                    <input type="color" onChange={(e) => exec('foreColor', e.target.value)} className="w-5 h-5 border-none cursor-pointer p-0 rounded-full" title="Text Color" />
                </div>

                <div className="flex bg-white rounded border border-gray-200 divide-x divide-gray-200 shadow-sm ml-auto">
                    <button type="button" onClick={() => exec('justifyLeft')} className="px-2 py-1 hover:bg-gray-50 text-gray-600">L</button>
                    <button type="button" onClick={() => exec('justifyCenter')} className="px-2 py-1 hover:bg-gray-50 text-gray-600">C</button>
                </div>
            </div>
            <div 
                ref={editorRef}
                className="p-4 min-h-[150px] outline-none max-h-[300px] overflow-y-auto prose prose-sm max-w-none" 
                contentEditable 
                onInput={handleInput}
            />
        </div>
    );
};

// --- ADVANCED PRODUCT FORM MODAL ---
const ProductFormModal: React.FC<ProductFormProps> = ({ isOpen, onClose, editProduct, isCloneMode }) => {
    const currentUser = useStore(state => state.currentUser);
    const upsertProduct = useStore(state => state.upsertProduct);
    const { showToast } = useToast();

    // Tab State for Modal
    const [modalTab, setModalTab] = useState<'DETAILS' | 'INVENTORY'>('DETAILS');

    // --- Basic Details State ---
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Vegetables');
    const [description, setDescription] = useState('');
    const [richDescription, setRichDescription] = useState('<ul><li>Freshly harvested</li></ul>');
    const [mediaInput, setMediaInput] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    
    // Variant Inputs
    const [vWeight, setVWeight] = useState('');
    const [vPrice, setVPrice] = useState('');
    const [vStock, setVStock] = useState('');
    const [vDiscount, setVDiscount] = useState('0');

    // Inventory Rules
    const [inventoryRules, setInventoryRules] = useState<InventoryRule[]>([]);
    const [targetVariant, setTargetVariant] = useState<string>('');
    const [scope, setScope] = useState<'STATE' | 'CITY' | 'PINCODE'>('STATE');
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [selectedPincodes, setSelectedPincodes] = useState<string[]>([]);
    const [rulePrice, setRulePrice] = useState('');
    const [ruleStock, setRuleStock] = useState('');
    const [ruleDiscount, setRuleDiscount] = useState('0');
    const [pincodes, setPincodes] = useState('');

    useEffect(() => {
        if (editProduct) {
            if (isCloneMode) {
                // CLONE MODE: Copy data but new IDs
                setName(`${editProduct.name} (Copy)`);
                setCategory(editProduct.category);
                setDescription(editProduct.description);
                setRichDescription(editProduct.richDescription || '');
                setMediaUrls([...editProduct.imageUrls]);
                setPincodes(editProduct.availablePincodes.join(', '));
                
                const clonedVariants = editProduct.variants.map(v => ({
                    ...v,
                    id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                }));
                setVariants(clonedVariants);
                setInventoryRules([]); 
                setModalTab('DETAILS');
            } else {
                // EDIT MODE
                setName(editProduct.name);
                setCategory(editProduct.category);
                setDescription(editProduct.description);
                setRichDescription(editProduct.richDescription || '');
                setMediaUrls(editProduct.imageUrls);
                setVariants(editProduct.variants);
                setInventoryRules(editProduct.inventoryRules || []);
                setPincodes(editProduct.availablePincodes.join(', '));
                setModalTab('DETAILS');
            }
        } else {
            // CREATE MODE
            setName('');
            setCategory('Vegetables');
            setDescription('');
            setRichDescription('<ul><li>Freshly harvested</li></ul>');
            setMediaUrls([]);
            setVariants([]);
            setInventoryRules([]);
            setPincodes('');
            setModalTab('DETAILS');
        }
    }, [editProduct, isOpen, isCloneMode]);

    const handleAddVariant = () => {
        const price = parseFloat(vPrice);
        const stock = parseInt(vStock);
        const discount = parseFloat(vDiscount);

        if (!vWeight.trim() || isNaN(price) || isNaN(stock)) return showToast('Invalid variant data', 'error');

        const newVariant: ProductVariant = { 
            id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            weight: vWeight.trim(), 
            price, 
            stock,
            discount: isNaN(discount) ? 0 : discount
        };
        setVariants([...variants, newVariant]);
        setVWeight(''); setVPrice(''); setVStock(''); setVDiscount('0');
        if (modalTab === 'INVENTORY') setTargetVariant(newVariant.id);
    };

    const removeVariant = (id: string) => {
        setVariants(variants.filter(v => v.id !== id));
        setInventoryRules(inventoryRules.filter(r => r.variantId !== id));
    };

    const handleAddMedia = () => {
        if (mediaInput.trim()) {
            setMediaUrls([...mediaUrls, mediaInput.trim()]);
            setMediaInput('');
        }
    };

    const removeMedia = (index: number) => {
        setMediaUrls(mediaUrls.filter((_, i) => i !== index));
    };

    const availableStates = Object.keys(locationDB);
    const availableCities = useMemo(() => {
        if (selectedStates.length === 0) return [];
        let cities: string[] = [];
        selectedStates.forEach(s => {
            if (locationDB[s]) cities = [...cities, ...Object.keys(locationDB[s])];
        });
        return cities;
    }, [selectedStates]);

    const availablePincodes = useMemo(() => {
        if (selectedCities.length === 0) return [];
        let pins: string[] = [];
        selectedStates.forEach(s => {
            selectedCities.forEach(c => {
                if (locationDB[s] && locationDB[s][c]) {
                    pins = [...pins, ...locationDB[s][c]];
                }
            });
        });
        return pins;
    }, [selectedCities, selectedStates]);

    const handleAddRule = () => {
        if (!targetVariant) return showToast('Select a variant first', 'error');
        const price = parseFloat(rulePrice);
        const stock = parseInt(ruleStock);
        const discount = parseFloat(ruleDiscount);

        if (isNaN(price) || isNaN(stock)) return showToast('Price and Stock are required', 'error');

        let newRules: InventoryRule[] = [];

        if (selectedPincodes.length > 0) {
            newRules = selectedPincodes.map(pin => ({
                id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                variantId: targetVariant,
                scope: 'PINCODE',
                locationName: pin,
                price, stock, discount: isNaN(discount) ? 0 : discount
            }));
        } else if (selectedCities.length > 0) {
            newRules = selectedCities.map(city => ({
                id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                variantId: targetVariant,
                scope: 'CITY',
                locationName: city,
                price, stock, discount: isNaN(discount) ? 0 : discount
            }));
        } else if (selectedStates.length > 0) {
            newRules = selectedStates.map(state => ({
                id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                variantId: targetVariant,
                scope: 'STATE',
                locationName: state,
                price, stock, discount: isNaN(discount) ? 0 : discount
            }));
        } else {
            return showToast('Select at least one State, City or Pincode', 'error');
        }

        setInventoryRules([...inventoryRules, ...newRules]);
        showToast(`Added ${newRules.length} pricing rules`, 'success');
        setSelectedPincodes([]);
    };

    const deleteRule = (id: string) => {
        setInventoryRules(inventoryRules.filter(r => r.id !== id));
    };

    const handleQuickFill = () => {
        setName('Organic Red Onions');
        setCategory('Vegetables');
        setDescription('Farm fresh red onions from Nashik.');
        setRichDescription('<ul><li>Direct from farms</li><li>No pesticides</li></ul>');
        setVariants([
            { id: `v-${Date.now()}-1`, weight: '1kg', price: 40, stock: 100, discount: 0 },
            { id: `v-${Date.now()}-2`, weight: '5kg', price: 180, stock: 20, discount: 5 }
        ]);
        setMediaUrls(['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=500']);
        showToast('Sample data filled!', 'info');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        if (variants.length === 0) {
            showToast('Add at least one variant', 'error');
            return;
        }

        const rulePincodes = inventoryRules.filter(r => r.scope === 'PINCODE').map(r => r.locationName);
        const manualPincodes = pincodes.split(',').map(s => s.trim()).filter(Boolean);
        const finalPincodes = Array.from(new Set([...manualPincodes, ...rulePincodes]));
        const finalMedia = mediaUrls.length > 0 ? mediaUrls : ['https://via.placeholder.com/300?text=No+Image'];
        const productId = (editProduct && !isCloneMode) ? editProduct.id : `prod-${Date.now()}`;

        const payload: Product = {
            id: productId,
            name: name.trim(),
            category,
            description: description.trim(),
            richDescription,
            imageUrls: finalMedia,
            variants: variants,
            inventoryRules: inventoryRules,
            rating: (editProduct && !isCloneMode) ? editProduct.rating : 0,
            reviews: (editProduct && !isCloneMode) ? editProduct.reviews : [],
            seller: currentUser.businessName || currentUser.name,
            sellerId: currentUser.id,
            availablePincodes: finalPincodes.length > 0 ? finalPincodes : ['All India']
        };

        upsertProduct(payload);
        showToast(isCloneMode ? 'New Variant Product Created' : editProduct ? 'Product Updated' : 'Product Created', 'success');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">
                            {isCloneMode ? 'Duplicate & Edit Product' : editProduct ? 'Manage Product' : 'New Product Wizard'}
                        </h3>
                        {isCloneMode && <p className="text-xs text-blue-600 font-bold">Creating copy of {editProduct?.name}</p>}
                    </div>
                    <div className="flex gap-2">
                        {!editProduct && modalTab === 'DETAILS' && (
                            <button onClick={handleQuickFill} type="button" className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-purple-200">
                                <MagicWandIcon className="w-3 h-3" /> Quick Fill
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 rounded-full">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex border-b bg-white">
                    <button onClick={() => setModalTab('DETAILS')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'DETAILS' ? 'border-green-600 text-green-600 bg-green-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>1. Product Details & Media</button>
                    <button onClick={() => setModalTab('INVENTORY')} disabled={variants.length === 0} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'INVENTORY' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : variants.length === 0 ? 'text-gray-300 cursor-not-allowed' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>2. Inventory & Geo-Pricing</button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 scrollbar-hide bg-gray-50/30">
                    <form id="productForm" onSubmit={handleSubmit}>
                        {modalTab === 'DETAILS' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label><input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. Fresh Tomatoes" /></div>
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">Category <span className="text-red-500">*</span></label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-green-500 outline-none"><option>Vegetables</option><option>Fruits</option><option>Leafy Greens</option><option>Exotic</option></select></div>
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">Short Description</label><textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" rows={3} placeholder="Brief summary..." /></div>
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">General Service Pincodes</label><input type="text" value={pincodes} onChange={e => setPincodes(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none font-mono text-xs" placeholder="400001, 400002" /></div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700">Media Gallery</label>
                                        <div className="flex gap-2"><input type="text" value={mediaInput} onChange={e => setMediaInput(e.target.value)} className="flex-grow border rounded-lg p-2.5 text-sm" placeholder="Image URL" /><button type="button" onClick={handleAddMedia} className="bg-gray-100 px-4 rounded-lg font-bold hover:bg-gray-200">Add</button></div>
                                        <div className="flex flex-wrap gap-2">{mediaUrls.map((url, i) => (<div key={i} className="relative w-16 h-16 rounded border bg-gray-100 group"><img src={url} className="w-full h-full object-cover rounded" alt="" /><button type="button" onClick={() => removeMedia(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><XMarkIcon className="w-3 h-3" /></button></div>))}</div>
                                        <div className="mt-4"><label className="block text-sm font-bold text-gray-700 mb-1">Rich Description</label><RichTextEditor value={richDescription} onChange={setRichDescription} /></div>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShopIcon className="w-5 h-5 text-green-600" /> Base Variants (Default Pricing)</h4>
                                    <div className="grid grid-cols-5 gap-3 mb-4">
                                        <input type="text" value={vWeight} onChange={e => setVWeight(e.target.value)} placeholder="Weight (1kg)" className="border rounded p-2 text-sm" />
                                        <input type="number" value={vPrice} onChange={e => setVPrice(e.target.value)} placeholder="Base Price (₹)" className="border rounded p-2 text-sm" />
                                        <input type="number" value={vStock} onChange={e => setVStock(e.target.value)} placeholder="Def. Stock" className="border rounded p-2 text-sm" />
                                        <input type="number" value={vDiscount} onChange={e => setVDiscount(e.target.value)} placeholder="Disc %" className="border rounded p-2 text-sm" />
                                        <button type="button" onClick={handleAddVariant} className="bg-green-600 text-white rounded font-bold text-sm hover:bg-green-700">+ Add</button>
                                    </div>
                                    <table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="px-4 py-2">Weight</th><th className="px-4 py-2">Price</th><th className="px-4 py-2">Stock</th><th className="px-4 py-2">Disc %</th><th className="px-4 py-2"></th></tr></thead><tbody className="divide-y divide-gray-100">{variants.map((v) => (<tr key={v.id}><td className="px-4 py-2 font-bold">{v.weight}</td><td className="px-4 py-2">{formatCurrency(v.price)}</td><td className="px-4 py-2">{v.stock}</td><td className="px-4 py-2 text-green-600 font-bold">{v.discount || 0}%</td><td className="px-4 py-2 text-right"><button type="button" onClick={() => removeVariant(v.id)} className="text-red-500"><TrashIcon className="w-4 h-4" /></button></td></tr>))}{variants.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">Add at least one variant to proceed.</td></tr>}</tbody></table>
                                </div>
                            </div>
                        )}
                        {modalTab === 'INVENTORY' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-sm text-blue-800 flex gap-3"><InformationCircleIcon className="w-6 h-6 flex-shrink-0" /><p>Define specific prices, stock and discounts for different locations. 1. Select Scope (State/City/Pincode) -> 2. Select Locations -> 3. Set Values.</p></div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-fit">
                                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><GlobeAltIcon className="w-5 h-5 text-blue-600" /> Geo-Price Builder</h4>
                                        <div className="space-y-4">
                                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Variant</label><select value={targetVariant} onChange={e => setTargetVariant(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-gray-50 font-medium"><option value="">-- Choose Variant --</option>{variants.map(v => <option key={v.id} value={v.id}>{v.weight} (Base: {formatCurrency(v.price)})</option>)}</select></div>
                                            <div className="flex bg-gray-100 rounded-lg p-1">{['STATE', 'CITY', 'PINCODE'].map((s) => (<button key={s} type="button" onClick={() => setScope(s as any)} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${scope === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>))}</div>
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                                                <div><label className="block text-xs font-bold text-gray-500 mb-1">States</label><select multiple className="w-full border rounded p-2 text-sm h-24 focus:ring-1 focus:ring-blue-500" value={selectedStates} onChange={e => setSelectedStates(Array.from(e.target.selectedOptions, (o: HTMLOptionElement) => o.value))}>{availableStates.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                                {(scope === 'CITY' || scope === 'PINCODE') && (<div><label className="block text-xs font-bold text-gray-500 mb-1">Cities</label><select multiple className="w-full border rounded p-2 text-sm h-24 focus:ring-1 focus:ring-blue-500" value={selectedCities} onChange={e => setSelectedCities(Array.from(e.target.selectedOptions, (o: HTMLOptionElement) => o.value))}>{availableCities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>)}
                                                {scope === 'PINCODE' && (<div><label className="block text-xs font-bold text-gray-500 mb-1">Pincodes</label><select multiple className="w-full border rounded p-2 text-sm h-24 focus:ring-1 focus:ring-blue-500" value={selectedPincodes} onChange={e => setSelectedPincodes(Array.from(e.target.selectedOptions, (o: HTMLOptionElement) => o.value))}>{availablePincodes.map(p => <option key={p} value={p}>{p}</option>)}</select></div>)}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2"><div><label className="block text-[10px] font-bold text-gray-500 uppercase">Price</label><input type="number" value={rulePrice} onChange={e => setRulePrice(e.target.value)} className="w-full border rounded p-1.5 text-sm" placeholder="₹" /></div><div><label className="block text-[10px] font-bold text-gray-500 uppercase">Stock</label><input type="number" value={ruleStock} onChange={e => setRuleStock(e.target.value)} className="w-full border rounded p-1.5 text-sm" placeholder="Qty" /></div><div><label className="block text-[10px] font-bold text-gray-500 uppercase">Disc %</label><input type="number" value={ruleDiscount} onChange={e => setRuleDiscount(e.target.value)} className="w-full border rounded p-1.5 text-sm" placeholder="%" /></div></div>
                                            <button type="button" onClick={handleAddRule} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 shadow-md transition-transform active:scale-95">Apply to Selection</button>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                                        <div className="px-5 py-3 border-b bg-gray-50 flex justify-between items-center"><h4 className="font-bold text-gray-800">Active Inventory Rules</h4><span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{inventoryRules.length} Rules</span></div>
                                        <div className="overflow-y-auto flex-grow p-0 h-[500px]"><table className="w-full text-left text-sm"><thead className="bg-white text-gray-500 border-b sticky top-0 z-10"><tr><th className="px-4 py-2 font-medium">Variant</th><th className="px-4 py-2 font-medium">Scope</th><th className="px-4 py-2 font-medium">Location</th><th className="px-4 py-2 font-medium">Override</th><th className="px-4 py-2 text-right"></th></tr></thead><tbody className="divide-y divide-gray-100">{inventoryRules.map(rule => { const v = variants.find(vr => vr.id === rule.variantId); return (<tr key={rule.id} className="hover:bg-gray-50"><td className="px-4 py-2 font-bold text-gray-800">{v?.weight || 'Unknown'}</td><td className="px-4 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{rule.scope}</span></td><td className="px-4 py-2 text-blue-600 font-medium">{rule.locationName}</td><td className="px-4 py-2"><div className="flex flex-col text-xs"><span className="text-green-700 font-bold">{formatCurrency(rule.price)}</span><span className="text-gray-500">Stock: {rule.stock}</span>{rule.discount > 0 && <span className="text-orange-500">-{rule.discount}%</span>}</div></td><td className="px-4 py-2 text-right"><button type="button" onClick={() => deleteRule(rule.id)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button></td></tr>); })}{inventoryRules.length === 0 && (<tr><td colSpan={5} className="p-8 text-center text-gray-400">No location specific rules added. Default pricing applies everywhere.</td></tr>)}</tbody></table></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
                <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
                    <p className="text-xs text-gray-400 italic">{modalTab === 'DETAILS' ? 'Next: Add regional pricing' : 'Review rules before saving'}</p>
                    <div className="flex gap-3">
                        {modalTab === 'INVENTORY' && (<button type="button" onClick={() => setModalTab('DETAILS')} className="px-4 py-2 rounded-lg text-gray-600 font-bold hover:bg-gray-200">Back</button>)}
                        {modalTab === 'DETAILS' ? (<button type="button" onClick={() => setModalTab('INVENTORY')} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md">Next: Inventory</button>) : (<button type="submit" form="productForm" className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-md flex items-center gap-2"><CheckCircleIcon className="w-5 h-5" /> {isCloneMode ? 'Duplicate Product' : editProduct ? 'Update Product' : 'Create Product'}</button>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PROFILE SECTION ---
const ProfileSection = () => {
    const currentUser = useStore(state => state.currentUser);
    const updateUserProfile = useStore(state => state.updateUserProfile);
    const performSafeCleanup = useStore(state => state.performSafeCleanup);
    const { showToast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [businessName, setBusinessName] = useState(currentUser?.businessName || '');
    const [gstin, setGstin] = useState(currentUser?.gstin || '');
    const [name, setName] = useState(currentUser?.name || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateUserProfile({ name, phone, businessName, gstin });
        setIsEditing(false);
        showToast('Seller profile updated successfully', 'success');
    };

    const handleSafeCleanup = () => {
        const msg = performSafeCleanup();
        showToast(msg, 'success');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-end">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg text-blue-600"><ShopIcon className="w-10 h-10" /></div>
                        <div><h2 className="text-2xl font-bold text-white">{currentUser?.businessName || 'Business Name'}</h2><p className="text-blue-100 flex items-center gap-1"><BadgeCheckIcon className="w-4 h-4" /> Verified Seller</p></div>
                    </div>
                    {!isEditing && (<button onClick={() => setIsEditing(true)} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm font-bold text-sm flex items-center gap-2 transition"><PencilIcon className="w-4 h-4" /> Edit Profile</button>)}
                </div>
                <div className="p-8">
                    {isEditing ? (
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Name</label><input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">GSTIN</label><input type="text" value={gstin} onChange={e => setGstin(e.target.value)} className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Phone</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t"><button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-lg border border-gray-300 font-bold text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md">Save Changes</button></div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div><h3 className="text-gray-400 text-xs font-bold uppercase mb-1">Business Details</h3><div className="space-y-3"><div className="flex justify-between border-b pb-2"><span className="text-gray-600">Name</span><span className="font-bold text-gray-800">{currentUser?.businessName}</span></div><div className="flex justify-between border-b pb-2"><span className="text-gray-600">GSTIN</span><span className="font-mono font-bold text-gray-800">{currentUser?.gstin}</span></div><div className="flex justify-between border-b pb-2"><span className="text-gray-600">Status</span><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold uppercase">Active</span></div></div></div>
                            <div><h3 className="text-gray-400 text-xs font-bold uppercase mb-1">Contact Info</h3><div className="space-y-3"><div className="flex justify-between border-b pb-2"><span className="text-gray-600">Owner</span><span className="font-bold text-gray-800">{currentUser?.name}</span></div><div className="flex justify-between border-b pb-2"><span className="text-gray-600">Phone</span><span className="font-mono font-bold text-gray-800">+91 {currentUser?.phone}</span></div></div></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"><h3 className="text-gray-700 font-bold text-sm mb-4 flex items-center gap-2"><CogIcon className="w-5 h-5 text-gray-500" /> System Tools</h3><div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200"><div><h4 className="font-bold text-gray-800 text-sm">Safe Clean-up Tool</h4><p className="text-xs text-gray-500 mt-1">Clears cache and resolves sync issues without data loss.</p></div><button onClick={handleSafeCleanup} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"><WrenchScrewdriverIcon className="w-4 h-4" /> Run Clean-up</button></div></div>
        </div>
    );
}

// --- MAIN SELLER DASHBOARD ---
const SellerDashboard: React.FC = () => {
    const currentUser = useStore(state => state.currentUser);
    const products = useStore(state => state.products);
    const orders = useStore(state => state.orders);
    const deleteProduct = useStore(state => state.deleteProduct);
    const upsertProduct = useStore(state => state.upsertProduct);
    const updateOrderStatus = useStore(state => state.updateOrderStatus);
    const reconcileAllData = useStore(state => state.reconcileAllData);
    const bulkImportProducts = useStore(state => state.bulkImportProducts);
    const logout = useStore(state => state.logout);
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'history' | 'profile'>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isCloneMode, setIsCloneMode] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

    const myProducts = useMemo(() => {
        return products.filter(p => (p.sellerId && p.sellerId === currentUser?.id) || (!p.sellerId && (p.seller === currentUser?.businessName || p.seller === currentUser?.name))).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, currentUser, searchTerm]);

    const myProductIds = useMemo(() => new Set(myProducts.map(p => p.id)), [myProducts]);
    const allMyOrders = useMemo(() => {
        return orders.filter(o => o.items && o.items.some(item => myProductIds.has(item.productId))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, myProductIds]);

    const incomingOrders = allMyOrders.filter(o => ['Placed', 'Preparing', 'Ready for Pickup'].includes(o.status));
    const historyOrders = allMyOrders.filter(o => ['Out for Delivery', 'Delivered', 'Cancelled', 'Returned'].includes(o.status));

    const totalOrdersToday = allMyOrders.filter(o => checkDateFilter(o.date, 'Today')).length;
    const totalRevenueToday = allMyOrders.filter(o => checkDateFilter(o.date, 'Today') && o.status !== 'Cancelled').reduce((sum, o) => sum + (o.total || 0), 0);
    const lowStockCount = myProducts.reduce((acc, p) => acc + (p.variants.some(v => v.stock < 10) ? 1 : 0), 0);
    const stockValue = myProducts.reduce((acc, p) => acc + p.variants.reduce((s, v) => s + (v.price * v.stock), 0), 0);
    const averageRating = useMemo(() => {
        const ratedProducts = myProducts.filter(p => p.rating > 0);
        if (ratedProducts.length === 0) return 0;
        return (ratedProducts.reduce((sum, p) => sum + p.rating, 0) / ratedProducts.length).toFixed(1);
    }, [myProducts]);

    const handleRefresh = () => { setIsRefreshing(true); reconcileAllData(); setTimeout(() => { setIsRefreshing(false); showToast('Catalog & Orders Synced.', 'success'); }, 800); };
    const handleUpdateStock = (productId: string, variantId: string, newStock: number) => { const product = products.find(p => p.id === productId); if (!product) return; const updatedVariants = product.variants.map(v => v.id === variantId ? { ...v, stock: Math.max(0, newStock) } : v); upsertProduct({ ...product, variants: updatedVariants }); };
    
    const openCreateModal = () => { setEditingProduct(null); setIsCloneMode(false); setIsModalOpen(true); };
    const openEditModal = (product: Product) => { setEditingProduct(product); setIsCloneMode(false); setIsModalOpen(true); };
    const openAddVariantModal = (product: Product) => { setEditingProduct(product); setIsCloneMode(true); setIsModalOpen(true); };
    const handleDelete = (id: string) => { const isProductInUse = orders.some(o => ['Placed', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(o.status) && o.items.some(i => i.productId === id)); if (isProductInUse) { showToast('Cannot delete: Product is part of an active order. Fulfill order first.', 'error'); return; } if (window.confirm('Are you sure you want to remove this product? This action cannot be undone.')) { deleteProduct(id); showToast('Product removed from catalog.', 'info'); } };
    const handleOrderAction = (orderId: string, currentStatus: string) => { const freshOrder = orders.find(o => o.id === orderId); if (!freshOrder) { showToast('Co-operation Error: Order not found.', 'error'); reconcileAllData(); return; } if (freshOrder.status === 'Cancelled') { showToast('Action Blocked: Customer cancelled this order.', 'error'); return; } if (currentStatus === 'Placed') { updateOrderStatus(orderId, 'Preparing'); showToast('Order marked as Preparing', 'info'); } else if (currentStatus === 'Preparing') { updateOrderStatus(orderId, 'Ready for Pickup'); showToast('Order is Ready for Pickup!', 'success'); } };
    const toggleOrderSelection = (orderId: string) => { const newSet = new Set(selectedOrderIds); if (newSet.has(orderId)) newSet.delete(orderId); else newSet.add(orderId); setSelectedOrderIds(newSet); };
    const handleBulkProcess = (targetStatus: string) => { let count = 0; selectedOrderIds.forEach(id => { const order = orders.find(o => o.id === id); if (!order) return; if (targetStatus === 'Preparing' && order.status === 'Placed') { updateOrderStatus(id, 'Preparing'); count++; } else if (targetStatus === 'Ready for Pickup' && order.status === 'Preparing') { updateOrderStatus(id, 'Ready for Pickup'); count++; } }); if (count > 0) { showToast(`Successfully updated ${count} orders to ${targetStatus}`, 'success'); setSelectedOrderIds(new Set()); } else { showToast('No eligible orders for this action in selection.', 'info'); } };
    
    // --- REAL IMPORT LOGIC USING REUSABLE COMPONENT ---
    const handleProductImport = (jsonData: any[]) => {
        const newProducts: Product[] = jsonData.map((row, idx) => ({
            id: `imp-${Date.now()}-${idx}`,
            name: row['Product Name'] || row['Name'] || 'Imported Product',
            category: row['Category'] || 'Vegetables',
            description: row['Description'] || 'Imported via Bulk Upload',
            richDescription: '',
            imageUrls: [row['Image URL'] || 'https://via.placeholder.com/300?text=No+Image'],
            variants: [{
                id: `v-${Date.now()}-${idx}`,
                weight: row['Weight'] || '1kg',
                price: parseFloat(row['Price']) || 0,
                stock: parseInt(row['Stock']) || 0,
                discount: parseFloat(row['Discount']) || 0
            }],
            rating: 0,
            reviews: [],
            seller: currentUser?.businessName || currentUser?.name || 'Seller',
            sellerId: currentUser?.id,
            availablePincodes: row['Pincodes'] ? row['Pincodes'].toString().split(',').map((s: string) => s.trim()) : ['400001']
        }));

        bulkImportProducts(newProducts);
        showToast(`Success! Imported ${newProducts.length} products.`, 'success');
    };

    const countSelectedByStatus = (status: string) => { let count = 0; selectedOrderIds.forEach(id => { const order = orders.find(o => o.id === id); if (order && order.status === status) count++; }); return count; };
    const handleReplyToReview = () => { const reply = prompt("Enter your reply to the customer:"); if (reply) showToast("Reply posted successfully!", 'success'); };

    const tabs = [ { id: 'overview', label: 'Overview', icon: BriefcaseIcon, gradient: 'from-gray-700 to-gray-900' }, { id: 'products', label: 'Catalog', count: myProducts.length, icon: ShopIcon, gradient: 'from-green-500 to-green-700' }, { id: 'orders', label: 'Orders', count: incomingOrders.length, icon: ClipboardListIcon, gradient: 'from-blue-500 to-blue-700' }, { id: 'history', label: 'History', count: historyOrders.length, icon: CheckCircleIcon, gradient: 'from-purple-500 to-purple-700' }, { id: 'profile', label: 'Profile', icon: CogIcon, gradient: 'from-orange-500 to-orange-700' } ];
    const StatCard = ({ title, value, icon: Icon, colorClass }: any) => ( <div className={`p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between bg-white hover:shadow-md transition-shadow`}> <div> <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p> <h3 className="text-2xl font-black text-gray-800 mt-1">{value}</h3> </div> <div className={`p-3 rounded-xl ${colorClass} text-white shadow-sm`}> <Icon className="w-6 h-6" /> </div> </div> );

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <ProductFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editProduct={editingProduct} isCloneMode={isCloneMode} />
            <OrderDetailsModal isOpen={!!selectedOrder} order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            
            <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-green-400 to-green-600 p-2.5 rounded-xl shadow-lg"><ShopIcon className="w-6 h-6 text-white" /></div><div><h1 className="text-xl font-bold text-gray-800 leading-tight">Seller Hub</h1><p className="text-xs text-gray-500 font-medium">{currentUser?.businessName || currentUser?.name}</p></div></div>
                <div className="flex items-center gap-4"><button onClick={handleRefresh} disabled={isRefreshing} className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2.5 rounded-xl transition-all shadow-sm border border-gray-200 active:scale-90" title="Refresh & Sync Data"><ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} /></button><button onClick={logout} className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100">Logout</button></div>
            </header>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 border-b"><div className="bg-white p-3 text-center group hover:bg-gray-50 transition-colors"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider group-hover:text-green-600">Orders Today</p><p className="text-xl font-black text-gray-800">{totalOrdersToday}</p></div><div className="bg-white p-3 text-center group hover:bg-gray-50 transition-colors"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider group-hover:text-green-600">Revenue</p><p className="text-xl font-black text-green-600">{formatCurrency(totalRevenueToday)}</p></div><div className="bg-white p-3 text-center group hover:bg-gray-50 transition-colors hidden sm:block"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider group-hover:text-green-600">Pending</p><p className="text-xl font-black text-orange-500">{incomingOrders.length}</p></div><div className="bg-white p-3 text-center group hover:bg-gray-50 transition-colors hidden sm:block"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider group-hover:text-green-600">Rating</p><p className="text-xl font-black text-yellow-500">{averageRating}</p></div></div>
            <div className="bg-white border-b px-6 sticky top-[73px] z-30 shadow-sm overflow-x-auto scrollbar-hide"><div className="flex gap-4 sm:gap-6 py-2">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-2 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-3 ${activeTab === tab.id ? 'border-green-600 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><div className={`p-2 rounded-xl shadow-md bg-gradient-to-br ${tab.gradient} text-white transition-transform ${activeTab === tab.id ? 'scale-110' : 'scale-100 opacity-80'}`}><tab.icon className="w-5 h-5" /></div><span className="hidden sm:inline">{tab.label}</span>{tab.count !== undefined && (<span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>)}</button>))}</div></div>
            <main className="flex-grow p-6 max-w-7xl mx-auto w-full">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Today's Revenue" value={formatCurrency(totalRevenueToday)} icon={CurrencyRupeeIcon} colorClass="bg-green-500" />
                            <StatCard title="Total Stock Value" value={formatCurrency(stockValue)} icon={TagIcon} colorClass="bg-purple-500" />
                            <StatCard title="Low Stock Items" value={lowStockCount} icon={ExclamationCircleIcon} colorClass="bg-red-500" />
                            <StatCard title="Avg Rating" value={averageRating} icon={BadgeCheckIcon} colorClass="bg-yellow-500" />
                        </div>
                        <SalesChart orders={allMyOrders} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><BadgeCheckIcon className="w-4 h-4 text-gray-500" /> Recent Feedback</h3><button onClick={() => setActiveTab('products')} className="text-xs font-bold text-blue-600 hover:underline">View Products</button></div>
                                <div className="divide-y divide-gray-50">{myProducts.filter(p => p.reviews && p.reviews.length > 0).flatMap(p => p.reviews.map(r => ({ ...r, productName: p.name }))).slice(0, 5).map((review, i) => (<div key={i} className="p-4 flex justify-between items-start hover:bg-gray-50"><div><div className="flex items-center gap-1 mb-1"><span className="text-xs font-bold text-gray-800 bg-gray-100 px-1.5 rounded">{review.rating} ★</span><span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">{review.productName}</span></div><p className="text-xs text-gray-500 italic">"{review.comment}"</p></div><div className="text-right"><span className="text-[10px] text-gray-400 block mb-1">{review.date}</span><button onClick={handleReplyToReview} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-0.5 rounded"><ChatBubbleLeftRightIcon className="w-3 h-3" /> Reply</button></div></div>))}{myProducts.every(p => !p.reviews || p.reviews.length === 0) && (<div className="p-6 text-center text-gray-400 text-sm">No reviews yet.</div>)}</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><ClockIcon className="w-4 h-4 text-gray-500" /> Recent Orders</h3><button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-blue-600 hover:underline">View All</button></div>
                                <div className="divide-y divide-gray-50">{allMyOrders.slice(0, 5).map(order => (<div key={order.id} className="p-4 flex justify-between items-center hover:bg-gray-50"><div><span className="font-bold text-gray-800 text-sm">Order #{order.id.split('-')[1]}</span><p className="text-xs text-gray-500">{getTimeOnly(order.date)}</p></div><span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>{order.status}</span></div>))}{allMyOrders.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No recent activity.</div>}</div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'products' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="relative w-full md:w-96"><input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all" /><ArrowPathIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />{searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>)}</div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <ImportButton onImport={handleProductImport} label="Bulk Import" />
                                <ExportMenu data={myProducts} filename="my_inventory" title="Product Inventory" />
                                <button onClick={openCreateModal} className="flex-1 md:flex-none bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-green-500 hover:to-green-600 transition-all flex items-center justify-center gap-2 active:scale-95"><PlusIcon className="w-5 h-5" /> Add New</button>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b border-gray-200"><tr><th className="px-6 py-4">Product Details</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Inventory</th><th className="px-6 py-4">Price Range</th><th className="px-6 py-4">Reach</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">{myProducts.length === 0 ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No products found. Start by adding one!</td></tr>) : (myProducts.map(product => { const totalStock = product.variants.reduce((a, b) => a + b.stock, 0); const minPrice = Math.min(...product.variants.map(v => v.price)); const maxPrice = Math.max(...product.variants.map(v => v.price)); return (<tr key={product.id} className="hover:bg-gray-50 transition-colors group"><td className="px-6 py-4"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">{isVideo(product.imageUrls[0]) ? (<video src={product.imageUrls[0]} className="w-full h-full object-cover" />) : (<img src={product.imageUrls[0]} alt="" className="w-full h-full object-cover" />)}</div><div><div className="font-bold text-gray-900 text-base">{product.name}</div><div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</div></div></div></td><td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">{product.category}</span></td><td className="px-6 py-4"><div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto scrollbar-hide pr-1">{product.variants.map(v => (<div key={v.id} className="flex justify-between items-center text-xs bg-white p-1 rounded border border-gray-200 shadow-sm"><span className="text-gray-600 font-bold w-12 truncate" title={v.weight}>{v.weight}</span><div className="flex items-center bg-gray-50 rounded border border-gray-200"><button type="button" onClick={(e) => { e.stopPropagation(); handleUpdateStock(product.id, v.id, v.stock - 1); }} className="px-2 py-0.5 hover:bg-gray-200 text-gray-600 font-bold border-r border-gray-200 transition-colors">−</button><span className={`w-8 text-center font-mono font-bold ${v.stock < 10 ? 'text-red-600' : 'text-gray-800'}`}>{v.stock}</span><button type="button" onClick={(e) => { e.stopPropagation(); handleUpdateStock(product.id, v.id, v.stock + 1); }} className="px-2 py-0.5 hover:bg-gray-200 text-gray-600 font-bold border-l border-gray-200 transition-colors">+</button></div></div>))}</div>{totalStock < 10 && (<p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1"><ExclamationCircleIcon className="w-3 h-3" /> Low Stock</p>)}</td><td className="px-6 py-4 font-mono font-medium text-gray-700">{product.variants.length > 1 ? `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}` : formatCurrency(minPrice)}</td><td className="px-6 py-4 text-xs text-gray-500"><div className="flex items-center gap-1"><TruckIcon className="w-4 h-4" />{product.inventoryRules && product.inventoryRules.length > 0 ? (<span className="text-blue-600 font-bold">{product.inventoryRules.length} Custom Rules</span>) : (<span>Default</span>)}</div></td><td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity"><button onClick={() => openAddVariantModal(product)} className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:text-blue-700 hover:shadow-sm transition-all active:scale-95" title="Duplicate / Add Similar"><DuplicateIcon className="w-4 h-4" /></button><button onClick={() => openEditModal(product)} className="p-2 bg-white border rounded-lg text-gray-600 hover:text-green-600 hover:border-green-600 hover:shadow-sm transition-all active:scale-95" title="Edit"><PencilIcon className="w-4 h-4" /></button><button onClick={() => handleDelete(product.id)} className="p-2 bg-white border rounded-lg text-gray-600 hover:text-red-600 hover:border-red-600 hover:shadow-sm transition-all active:scale-95" title="Delete"><TrashIcon className="w-4 h-4" /></button></div></td></tr>); }))}</tbody>
                                </table>
                            </div>
                            <div className="bg-gray-50 border-t px-6 py-3 text-xs text-gray-500 flex justify-between items-center"><span>Showing {myProducts.length} Products</span><span>Manage inventory levels regularly to avoid stockouts.</span></div>
                        </div>
                    </div>
                )}
                {activeTab === 'orders' && (
                    <div className="space-y-4 animate-fade-in pb-20">
                        {incomingOrders.length === 0 ? (<div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300"><div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><ClipboardListIcon className="w-8 h-8 text-gray-400" /></div><h3 className="text-gray-900 font-bold mb-1">No Active Orders</h3><p className="text-gray-500 text-sm">New orders will appear here instantly.</p></div>) : (<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{incomingOrders.map(order => { const isSelected = selectedOrderIds.has(order.id); const isActuallyCancelled = order.status === 'Cancelled'; return (<div key={order.id} className={`bg-white rounded-xl shadow-sm border-l-4 p-5 transition-all ${isActuallyCancelled ? 'border-red-500 opacity-75' : order.status === 'Ready for Pickup' ? 'border-green-500' : 'border-yellow-500'} ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}>{isActuallyCancelled && (<div className="bg-red-50 text-red-700 text-xs font-bold p-2 mb-3 rounded flex items-center gap-2 border border-red-200 animate-pulse"><ExclamationCircleIcon className="w-4 h-4" /> ATTENTION: Customer has cancelled this order. Do not process.</div>)}<div className="flex justify-between items-start mb-4"><div className="flex items-start gap-3"><div className="pt-1"><input type="checkbox" checked={isSelected} onChange={() => toggleOrderSelection(order.id)} disabled={isActuallyCancelled} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed" /></div><div><div className="flex items-center gap-2"><h3 className="font-bold text-gray-800 text-lg">Order #{order.id.split('-')[1]}</h3><button onClick={() => setSelectedOrder(order)} className="text-gray-400 hover:text-blue-600 transition-colors"><InformationCircleIcon className="w-5 h-5" /></button></div><p className="text-xs text-gray-500 font-medium">{timeAgo(order.date)}</p></div></div><span className={`px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wide ${order.status === 'Ready for Pickup' ? 'bg-green-100 text-green-800' : order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.status}</span></div><div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100 ml-8"><p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Items Checklist</p><div className="space-y-2">{order.items.filter(i => myProductIds.has(i.productId)).map(item => (<div key={item.variantId} className="flex justify-between text-sm"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div><span className="text-gray-700">{item.name} <span className="text-gray-400">({item.variantName})</span></span></div><span className="font-bold text-gray-900">x{item.quantity}</span></div>))}</div></div><div className="ml-8"><OrderProgressBar status={order.status} /></div><div className="flex justify-between items-center pt-2 border-t mt-4 ml-8"><div className="text-xs text-gray-500"><p>Location: <span className="font-bold text-gray-700">{order.deliveryAddress?.pincode || 'N/A'}</span></p></div>{!isActuallyCancelled && order.status === 'Placed' && (<button onClick={() => handleOrderAction(order.id, 'Placed')} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow hover:shadow-lg hover:from-blue-500 hover:to-blue-600 transition active:scale-95">Accept Order</button>)}{!isActuallyCancelled && order.status === 'Preparing' && (<button onClick={() => handleOrderAction(order.id, 'Preparing')} className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow hover:shadow-lg hover:from-yellow-400 hover:to-yellow-500 transition active:scale-95">Mark Ready</button>)}{order.status === 'Ready for Pickup' && (<span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" /> Awaiting Pickup</span>)}</div></div>); })}</div>)}
                        {selectedOrderIds.size > 0 && (<div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-bounce-short border border-gray-700"><div className="flex items-center gap-3 pr-4 border-r border-gray-700"><span className="bg-white text-black font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">{selectedOrderIds.size}</span><span className="text-sm font-bold">Selected</span><button onClick={() => setSelectedOrderIds(new Set())} className="text-gray-400 hover:text-white ml-2 text-xs uppercase">Clear</button></div><div className="flex gap-3">{countSelectedByStatus('Placed') > 0 && (<button onClick={() => handleBulkProcess('Preparing')} className="bg-blue-600 hover:bg-blue-50 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform active:scale-95">Accept ({countSelectedByStatus('Placed')})</button>)}{countSelectedByStatus('Preparing') > 0 && (<button onClick={() => handleBulkProcess('Ready for Pickup')} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform active:scale-95">Mark Ready ({countSelectedByStatus('Preparing')})</button>)}{countSelectedByStatus('Placed') === 0 && countSelectedByStatus('Preparing') === 0 && (<span className="text-xs text-gray-400 italic">No actions available for selection</span>)}</div></div>)}
                    </div>
                )}
                {activeTab === 'history' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-end mb-4">
                            <ExportMenu data={historyOrders} filename="my_order_history" title="Order History" />
                        </div>
                        {historyOrders.length === 0 ? (<div className="text-center py-10 text-gray-400">No completed orders history.</div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{historyOrders.map(order => (<div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm opacity-90 hover:opacity-100 transition-opacity"><div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><span className="font-bold text-gray-800">#{order.id.split('-')[1]}</span><button onClick={() => setSelectedOrder(order)} className="text-gray-400 hover:text-blue-600"><InformationCircleIcon className="w-4 h-4"/></button></div><span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">{order.status}</span></div><div className="text-xs text-gray-500 mb-2">{getDateOnly(order.date)} • {getTimeOnly(order.date)}</div><div className="flex justify-between items-center border-t pt-2 mt-2"><span className="text-sm font-bold text-green-700">{formatCurrency(order.total)}</span><OrderProgressBar status={order.status} /></div></div>))}</div>)}
                    </div>
                )}
                {activeTab === 'profile' && <ProfileSection />}
            </main>
        </div>
    );
};

export default SellerDashboard;
