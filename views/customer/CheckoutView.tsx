
import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { View, Address } from '../../types';
import { formatCurrency } from '../../utils';
import { useToast } from '../../providers/ToastProvider';
import { 
    LocationMarkerIcon, 
    XMarkIcon,
    DevicePhoneMobileIcon,
    CreditCardIcon,
    BankIcon,
    CurrencyRupeeIcon,
    WalletIcon
} from '../../components/ui/Icons';

const CheckoutView: React.FC = () => {
    // Atomic selectors
    const cart = useStore(state => state.cart);
    const selectedAddress = useStore(state => state.selectedAddress);
    const setSelectedAddress = useStore(state => state.setSelectedAddress);
    const currentUser = useStore(state => state.currentUser);
    const checkoutSession = useStore(state => state.checkoutSession); 
    const placeOrder = useStore(state => state.placeOrder);
    const updateAddress = useStore(state => state.updateAddress);
    const setView = useStore(state => state.setView);
    const paymentMethods = useStore(state => state.paymentMethods);
    
    // Filter only enabled methods
    const availablePaymentMethods = paymentMethods.filter(m => m.isEnabled);
    
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Modal State
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [modalAddress, setModalAddress] = useState<Address | null>(null);

    const { showToast } = useToast();

    const fallbackTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const effectiveTotal = checkoutSession.grandTotal || fallbackTotal;

    // --- ADDRESS INTEGRITY CHECK ---
    useEffect(() => {
        // If the selected address no longer exists in the user's profile (e.g. deleted), reset it.
        if (currentUser && selectedAddress) {
            const exists = currentUser.addresses.find(a => a.id === selectedAddress.id);
            if (!exists) {
                // If the selected address is ghosted, try to select the first available one
                if (currentUser.addresses.length > 0) {
                    setSelectedAddress(currentUser.addresses[0]);
                    showToast('Selected address was unavailable. Switched to default.', 'info');
                } else {
                    setSelectedAddress(null);
                    showToast('Please add a delivery address.', 'error');
                }
            }
        }
    }, [currentUser, selectedAddress, setSelectedAddress, showToast]);

    useEffect(() => {
        if (selectedAddress) {
            setModalAddress(selectedAddress);
        }
        // Set default payment method if available
        if (availablePaymentMethods.length > 0 && !paymentMethod) {
            setPaymentMethod(availablePaymentMethods[0].label);
        }
    }, [selectedAddress, availablePaymentMethods, paymentMethod]);

    const executeOrderPlacement = (finalAddress: Address) => {
        if (!currentUser) return;

        // Save the refined address/coords for future use if it's an existing one
        const exists = currentUser.addresses.find(a => a.id === finalAddress.id);
        if (exists) {
            updateAddress(finalAddress);
        }

        placeOrder({
            userId: currentUser.id,
            items: cart,
            total: effectiveTotal,
            deliveryAddress: finalAddress,
            status: 'Placed',
            paymentMethod,
            discount: checkoutSession.discount,
            appliedCoupon: checkoutSession.couponCode
        });

        showToast(paymentMethod.toLowerCase().includes('cash') ? 'Order placed successfully!' : 'Payment Successful! Order Confirmed.', 'success');
        setView(View.ORDERS);
        setIsProcessing(false);
        setShowLocationModal(false);
    };

    // Step 1: Open verification modal immediately
    const handlePlaceOrderClick = () => {
        if (!selectedAddress || !currentUser) {
             showToast('Please select or add a delivery address.', 'error');
             // Redirect to profile to add address? Or maybe show a modal. 
             // For now, let's assume the user knows to go back if address is missing.
             return;
        }
        if (!paymentMethod) {
             showToast('Please select a payment method.', 'error');
             return;
        }
        setModalAddress(selectedAddress);
        setShowLocationModal(true);
    };

    // Step 2: Handle Verification & Geolocation & Geocoding & Order
    const handleModalConfirm = async () => {
        if (!modalAddress) return;
        
        // A. Verify Address Filled
        if (!modalAddress.details || !modalAddress.city || !modalAddress.pincode) {
            showToast('Please fill full address details.', 'error');
            return;
        }

        setIsProcessing(true);

        // B. Attempt Geolocation (GPS)
        let coords: {lat: number, lng: number} | null = null;
        
        try {
            // This promise wraps the GPS callback
            coords = await new Promise((resolve) => {
                if (!navigator.geolocation) { resolve(null); return; }
                
                // This triggers the browser permission prompt if not already granted
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.warn("GPS Denied/Error:", error);
                        resolve(null);
                    },
                    { enableHighAccuracy: true, timeout: 4000 }
                );
            });
        } catch (e) {
            coords = null;
        }

        // C. Fallback: If GPS denied/failed, Add Coordinates from address text (Geocoding)
        if (!coords) {
             showToast('Location access not enabled. Calculating coordinates from address...', 'info');
             try {
                // Construct query from the filled address fields
                const query = `${modalAddress.details}, ${modalAddress.city}, ${modalAddress.state}, ${modalAddress.pincode}`;
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data && data.length > 0) {
                    coords = { 
                        lat: parseFloat(data[0].lat), 
                        lng: parseFloat(data[0].lon) 
                    };
                }
             } catch (err) {
                console.error("Geocoding failed:", err);
             }
        }

        // D. Finalize Order with whatever coords we found (or keep old ones if geocoding also failed)
        if (coords) {
            executeOrderPlacement({ ...modalAddress, coordinates: coords });
        } else {
            // Rare case: No GPS and Geocoding API failed/returned no results
            showToast('Could not fetch precise coordinates. Placing with address text.', 'info');
            executeOrderPlacement(modalAddress);
        }
    };

    if (cart.length === 0) {
        setView(View.HOME);
        return null;
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'mobile': return <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />;
            case 'card': return <CreditCardIcon className="w-6 h-6 text-purple-600" />;
            case 'bank': return <BankIcon className="w-6 h-6 text-orange-600" />;
            case 'cash': return <CurrencyRupeeIcon className="w-6 h-6 text-green-600" />;
            case 'wallet': return <WalletIcon className="w-6 h-6 text-indigo-600" />;
            default: return <CreditCardIcon className="w-6 h-6 text-gray-600" />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20 animate-fade-in">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm mb-4 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <button onClick={() => setView(View.CART)} className="text-gray-600 hover:text-green-600 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-xl font-bold">Checkout</h2>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Address Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <LocationMarkerIcon className="h-5 w-5 text-green-600" />
                            Delivery Address
                        </h3>
                        {/* We redirect to Profile to manage addresses properly, keeping views clean */}
                        <button onClick={() => setView(View.PROFILE)} className="text-xs font-bold text-green-600 uppercase hover:underline">Change</button>
                    </div>
                    {selectedAddress ? (
                        <div>
                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase mr-2">{selectedAddress.label}</span>
                            <p className="font-medium text-gray-800 mt-1">{selectedAddress.details}</p>
                            <p className="text-sm text-gray-500">{selectedAddress.city}, {selectedAddress.pincode}</p>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            No address selected. <br/>
                            <button onClick={() => setView(View.PROFILE)} className="text-green-600 font-bold underline mt-1">Add Address</button>
                        </div>
                    )}
                </div>

                {/* Payment Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                         <CreditCardIcon className="h-5 w-5 text-green-600" />
                        Payment Method
                    </h3>
                    <div className="space-y-3">
                        {availablePaymentMethods.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No payment methods available. Please contact support.</p>
                        ) : (
                            availablePaymentMethods.map((option) => (
                                <div 
                                    key={option.id}
                                    onClick={() => setPaymentMethod(option.label)}
                                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all active:scale-98 ${
                                        paymentMethod === option.label 
                                        ? 'bg-green-50 border-green-500 ring-1 ring-green-500 shadow-sm' 
                                        : 'hover:bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <div className="flex-shrink-0">
                                        <input 
                                            type="radio" 
                                            name="payment" 
                                            value={option.label} 
                                            checked={paymentMethod === option.label} 
                                            onChange={() => setPaymentMethod(option.label)}
                                            className="w-5 h-5 text-green-600 focus:ring-green-500 accent-green-600 cursor-pointer"
                                        />
                                    </div>
                                    <div className="ml-3 flex-grow flex items-center gap-3">
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
                                            {getIcon(option.iconType)}
                                        </div>
                                        <div>
                                            <span className={`block font-bold text-sm ${paymentMethod === option.label ? 'text-green-800' : 'text-gray-800'}`}>
                                                {option.label}
                                            </span>
                                            <span className="block text-xs text-gray-500">{option.description}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Final Summary */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(checkoutSession.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Delivery</span>
                            <span>{checkoutSession.deliveryFee === 0 ? 'FREE' : formatCurrency(checkoutSession.deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Taxes & Charges</span>
                            <span>{formatCurrency(checkoutSession.tax)}</span>
                        </div>
                        {checkoutSession.discount > 0 && (
                            <div className="flex justify-between text-green-600 font-medium">
                                <span>Discount</span>
                                <span>- {formatCurrency(checkoutSession.discount)}</span>
                            </div>
                        )}
                        <hr className="my-2"/>
                        <div className="flex justify-between text-lg font-bold text-gray-800">
                            <span>Grand Total</span>
                            <span>{formatCurrency(effectiveTotal)}</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handlePlaceOrderClick} 
                    disabled={isProcessing || availablePaymentMethods.length === 0}
                    className={`w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-green-500 hover:to-green-600 transition-all transform active:scale-[0.98] mt-4 flex items-center justify-center gap-2 ${isProcessing || availablePaymentMethods.length === 0 ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                    {isProcessing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing Payment...
                        </>
                    ) : (
                        `Confirm Order • ${formatCurrency(effectiveTotal)}`
                    )}
                </button>
            </div>

            {/* --- CONFIRMATION & LOCATION MODAL --- */}
            {showLocationModal && modalAddress && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => { setShowLocationModal(false); setIsProcessing(false); }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <LocationMarkerIcon className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Confirm Delivery Details</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Please ensure your address is correct for delivery.
                            </p>
                        </div>

                        {/* Address Form */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">House / Flat / Street</label>
                                <input 
                                    type="text" 
                                    value={modalAddress.details}
                                    onChange={(e) => setModalAddress({ ...modalAddress, details: e.target.value })}
                                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Enter full address"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">City</label>
                                    <input 
                                        type="text" 
                                        value={modalAddress.city}
                                        onChange={(e) => setModalAddress({ ...modalAddress, city: e.target.value })}
                                        className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Pincode</label>
                                    <input 
                                        type="text" 
                                        value={modalAddress.pincode}
                                        onChange={(e) => setModalAddress({ ...modalAddress, pincode: e.target.value })}
                                        className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleModalConfirm}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:from-green-500 hover:to-green-600 transition-all transform active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing Payment...
                                </>
                            ) : (
                                `Confirm & Place Order`
                            )}
                        </button>
                        
                        <p className="text-[10px] text-gray-400 text-center mt-3 leading-tight">
                            We will attempt to fetch your current location to ensure precise delivery. <br/>
                            If location access is denied, we will calculate coordinates from the address above.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutView;
