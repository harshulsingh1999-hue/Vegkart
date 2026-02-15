
import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { View, CartItem } from '../../types';
import { formatCurrency, resolveRegionalPrice } from '../../utils';
import { TrashIcon, PlusIcon, ShopIcon, CheckCircleIcon, ArrowPathIcon } from '../../components/ui/Icons';
import { useToast } from '../../providers/ToastProvider';

const CartView: React.FC = () => {
    const cart = useStore(state => state.cart);
    const products = useStore(state => state.products); // Access live products for validation
    const updateQuantity = useStore(state => state.updateQuantity);
    const updateCartItem = useStore(state => state.updateCartItem);
    const removeFromCart = useStore(state => state.removeFromCart);
    const clearCart = useStore(state => state.clearCart);
    const setView = useStore(state => state.setView);
    const setCheckoutSession = useStore(state => state.setCheckoutSession);
    const taxConfig = useStore(state => state.taxConfig);
    const availableCoupons = useStore(state => state.coupons);
    const selectedAddress = useStore(state => state.selectedAddress);

    const { showToast } = useToast();

    // Local state for coupon
    const [couponInput, setCouponInput] = useState('');
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    // --- SELF-HEALING CART LOGIC (LOCATION AWARE) ---
    useEffect(() => {
        let changesNeeded = false;
        const updates: { type: 'update' | 'remove', item: CartItem }[] = [];

        cart.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            
            // 1. Check if Product Exists
            if (!product) {
                updates.push({ type: 'remove', item });
                changesNeeded = true;
                return;
            }

            const variant = product.variants.find(v => v.id === item.variantId);

            // 2. Check if Variant Exists
            if (!variant) {
                updates.push({ type: 'remove', item });
                changesNeeded = true;
                return;
            }

            // 3. Resolve Regional Price & Stock (Geo-Inventory)
            const regionalData = resolveRegionalPrice(product, item.variantId, selectedAddress);
            const livePrice = regionalData.price;
            const liveStock = regionalData.stock;

            // 4. Validate Stock (If stock dropped below cart qty)
            if (liveStock === 0) {
                updates.push({ type: 'remove', item });
                changesNeeded = true;
                return;
            }

            // 5. Sync Price or Quantity (only if different)
            let currentQty = item.quantity;
            let qtyChanged = false;
            if (currentQty > liveStock) {
                currentQty = liveStock;
                qtyChanged = true;
            }

            const priceChanged = item.price !== livePrice;
            const nameChanged = item.name !== product.name;
            const imageChanged = item.image !== product.imageUrls[0];

            if (qtyChanged || priceChanged || nameChanged || imageChanged) {
                updates.push({ 
                    type: 'update', 
                    item: { 
                        ...item, 
                        price: livePrice, 
                        quantity: currentQty,
                        name: product.name,
                        image: product.imageUrls[0]
                    } 
                });
                changesNeeded = true;
            }
        });

        // Apply changes to store only if discrepancies were found
        // Use a timeout to break the render cycle and ensure we don't update state during render phase if triggered unexpectedly
        if (changesNeeded) {
            const timeoutId = setTimeout(() => {
                let itemsRemoved = false;
                let stockAdjusted = false;
                let priceUpdated = false;

                updates.forEach(action => {
                    if (action.type === 'remove') {
                        removeFromCart(action.item.variantId);
                        itemsRemoved = true;
                    } else {
                        // For updates, we use updateCartItem which handles partial updates
                        // We check specifically what changed to set flags for the toast
                        const oldItem = cart.find(i => i.variantId === action.item.variantId);
                        if (oldItem) {
                            if (oldItem.price !== action.item.price) priceUpdated = true;
                            if (oldItem.quantity !== action.item.quantity) stockAdjusted = true;
                            
                            updateCartItem(action.item.variantId, {
                                price: action.item.price,
                                quantity: action.item.quantity,
                                name: action.item.name,
                                image: action.item.image
                            });
                        }
                    }
                });

                if (itemsRemoved) showToast('Some unavailable items were removed based on your location.', 'info');
                if (stockAdjusted) showToast('Quantities adjusted based on regional availability.', 'info');
                if (priceUpdated) showToast('Prices updated to reflect latest values for your area.', 'info');
            }, 0);
            
            return () => clearTimeout(timeoutId);
        }
    }, [products, cart, updateCartItem, removeFromCart, showToast, selectedAddress]);


    // --- CALCULATIONS ---
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    
    // Tax Calculation
    const gstAmount = subtotal * (taxConfig.gstRate / 100);
    const serviceTaxAmount = subtotal * (taxConfig.serviceTaxRate / 100);
    const totalTaxAmount = gstAmount + serviceTaxAmount;

    // Delivery Fee
    const freeDeliveryThreshold = 500;
    const standardDeliveryFee = 40;
    const deliveryFee = subtotal > freeDeliveryThreshold ? 0 : standardDeliveryFee;

    // --- DYNAMIC DISCOUNT LOGIC ---
    let discountAmount = 0;
    const appliedCoupon = availableCoupons.find(c => c.code === appliedCouponCode && c.isActive);

    if (appliedCoupon) {
        // Validate minimum order value
        if (appliedCoupon.minOrderValue && subtotal < appliedCoupon.minOrderValue) {
            // Coupon invalid due to subtotal drop
            if (discountAmount > 0) { 
                 // Logic handled in render or effect
            }
        } else {
            if (appliedCoupon.type === 'FLAT') {
                discountAmount = appliedCoupon.value;
            } else {
                discountAmount = subtotal * (appliedCoupon.value / 100);
            }
        }
    }

    const maxDiscount = subtotal + totalTaxAmount; 
    if (discountAmount > maxDiscount) discountAmount = maxDiscount;

    const grandTotal = subtotal + totalTaxAmount + deliveryFee - discountAmount;

    useEffect(() => {
        setCheckoutSession({
            subtotal,
            tax: totalTaxAmount,
            deliveryFee,
            discount: discountAmount,
            grandTotal,
            couponCode: appliedCouponCode || undefined
        });
    }, [subtotal, totalTaxAmount, deliveryFee, discountAmount, grandTotal, appliedCouponCode, setCheckoutSession]);

    // --- HANDLERS ---
    
    const handleApplyCoupon = () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;

        setIsValidating(true);
        setTimeout(() => {
            setIsValidating(false);
            const coupon = availableCoupons.find(c => c.code === code && c.isActive);
            
            if (coupon) {
                if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
                    showToast(`Minimum order of ${formatCurrency(coupon.minOrderValue)} required for this coupon.`, 'error');
                } else {
                    setAppliedCouponCode(code);
                    showToast(`Coupon '${code}' applied successfully!`, 'success');
                    setCouponInput('');
                }
            } else {
                showToast('Invalid or expired coupon code.', 'error');
            }
        }, 600);
    };

    const handleRemoveCoupon = () => {
        setAppliedCouponCode(null);
        showToast('Coupon removed.', 'info');
    };

    const handleCheckout = () => {
        // Final sanity check before navigating
        if (cart.some(item => item.quantity <= 0)) {
            showToast('Invalid items in cart. Please clear and try again.', 'error');
            return;
        }
        setView(View.CHECKOUT);
    };

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
                <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-full mb-6 shadow-xl">
                    <ShopIcon className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
                <p className="text-gray-500 mb-8 max-w-xs">Looks like you haven't added any fresh vegetables to your cart yet.</p>
                <button 
                    onClick={() => setView(View.HOME)}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:from-green-500 hover:to-green-600 transition-all transform active:scale-95"
                >
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="pb-24 bg-gray-50 min-h-screen animate-fade-in">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">My Cart <span className="text-sm font-normal text-gray-500">({cart.length} items)</span></h2>
                <button onClick={clearCart} className="text-xs text-red-500 font-bold hover:underline bg-red-50 px-2 py-1 rounded">Clear All</button>
            </div>

            <div className="p-4 space-y-6">
                
                {/* Cart Items List */}
                <div className="space-y-4">
                    {cart.map(item => (
                        <div key={item.variantId} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-4 transition-all hover:shadow-md">
                            {/* Product Image */}
                            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>

                            {/* Details & Controls */}
                            <div className="flex-grow flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800 leading-tight line-clamp-1">{item.name}</h3>
                                        <p className="text-xs text-gray-500">{item.variantName}</p>
                                    </div>
                                    <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                                </div>

                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-400">{formatCurrency(item.price)} / unit</p>
                                    
                                    {/* Quantity Stepper */}
                                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 h-8 shadow-sm">
                                        <button 
                                            onClick={() => item.quantity === 1 ? removeFromCart(item.variantId) : updateQuantity(item.variantId, item.quantity - 1)}
                                            className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg transition-colors"
                                        >
                                            {item.quantity === 1 ? <TrashIcon className="w-3.5 h-3.5 text-red-500" /> : '-'}
                                        </button>
                                        <div className="w-8 text-center text-sm font-bold text-gray-800">{item.quantity}</div>
                                        <button 
                                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                            className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-lg transition-colors"
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coupon Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                        Offers & Coupons
                    </h3>
                    
                    {appliedCoupon ? (
                        <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="font-bold text-green-800 text-sm">'{appliedCouponCode}' Applied</p>
                                    <p className="text-xs text-green-600">You saved {formatCurrency(discountAmount)}</p>
                                </div>
                            </div>
                            <button onClick={handleRemoveCoupon} className="text-xs font-bold text-red-500 hover:underline">Remove</button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={couponInput}
                                onChange={e => setCouponInput(e.target.value)}
                                placeholder="Enter Coupon Code" 
                                className="flex-grow border rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            <button 
                                onClick={handleApplyCoupon}
                                disabled={isValidating}
                                className="bg-gray-900 text-white text-xs font-bold px-4 rounded-lg hover:bg-black transition-colors shadow-md flex items-center gap-2"
                            >
                                {isValidating && <ArrowPathIcon className="w-3 h-3 animate-spin" />}
                                {isValidating ? '...' : 'Apply'}
                            </button>
                        </div>
                    )}
                    
                    {!appliedCoupon && availableCoupons.length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {availableCoupons.filter(c => c.isActive).map(c => (
                                <button 
                                    key={c.id} 
                                    onClick={() => {setCouponInput(c.code); handleApplyCoupon();}} 
                                    className="flex-shrink-0 text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 font-bold"
                                >
                                    {c.code}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bill Summary */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Bill Summary</h3>
                    
                    <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Item Total</span>
                            <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span>Delivery Charges</span>
                            {deliveryFee === 0 ? (
                                <span className="text-green-600 font-bold">FREE</span>
                            ) : (
                                <span className="font-medium text-gray-900">{formatCurrency(deliveryFee)}</span>
                            )}
                        </div>
                        {deliveryFee > 0 && (
                            <p className="text-[10px] text-gray-400 -mt-2">Add items worth {formatCurrency(freeDeliveryThreshold - subtotal)} more for free delivery.</p>
                        )}

                        <div className="flex justify-between">
                            {/* Consolidated Tax Line as requested: GST + Service Tax */}
                            <span className="flex items-center gap-1">
                                Taxes & Charges 
                                <span className="text-[10px] bg-gray-100 px-1 rounded" title={`GST: ${taxConfig.gstRate}% + Service: ${taxConfig.serviceTaxRate}%`}>
                                    {(taxConfig.gstRate + taxConfig.serviceTaxRate).toFixed(1)}%
                                </span>
                            </span>
                            <span className="font-medium text-gray-900">{formatCurrency(totalTaxAmount)}</span>
                        </div>

                        {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Coupon Discount</span>
                                <span className="font-bold">- {formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        
                        <div className="border-t pt-3 flex justify-between items-center mt-2">
                            <span className="font-bold text-gray-800 text-base">To Pay</span>
                            <span className="font-bold text-green-700 text-lg">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Info Text */}
                <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg text-xs text-blue-700 border border-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p>Prices and stock availability are customized based on your delivery location.</p>
                </div>
            </div>

            {/* Sticky Checkout Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] max-w-md mx-auto z-20">
                <button 
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white flex justify-between items-center px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-green-500 hover:to-green-600 transition-all transform active:scale-[0.98]"
                >
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-xs font-normal opacity-80 mb-1">{cart.length} Items</span>
                        <span className="text-lg">{formatCurrency(grandTotal)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        Proceed to Pay
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default CartView;
