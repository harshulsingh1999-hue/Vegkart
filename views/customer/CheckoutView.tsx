
import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { View, Address, Transaction } from '../../types';
import { formatCurrency } from '../../utils';
import { useToast } from '../../providers/ToastProvider';
import { PaymentGateway } from '../../services/PaymentGateway';
import { SecuritySystem } from '../../services/SecuritySystem';
import { 
    LocationMarkerIcon, 
    XMarkIcon,
    DevicePhoneMobileIcon,
    CreditCardIcon,
    BankIcon,
    CurrencyRupeeIcon,
    WalletIcon,
    ShieldCheckIcon,
    LockClosedIcon,
    CheckCircleIcon
} from '../../components/ui/Icons';

const CheckoutView: React.FC = () => {
    const cart = useStore(state => state.cart);
    const selectedAddress = useStore(state => state.selectedAddress);
    const currentUser = useStore(state => state.currentUser);
    const checkoutSession = useStore(state => state.checkoutSession); 
    const placeOrder = useStore(state => state.placeOrder);
    const setView = useStore(state => state.setView);
    const logSecurityEvent = useStore(state => state.logSecurityEvent);
    
    const [paymentTab, setPaymentTab] = useState<'UPI' | 'CARD' | 'BANK' | 'COD'>('UPI');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState('');
    
    // Form States
    const [upiId, setUpiId] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [selectedBank, setSelectedBank] = useState('');

    const { showToast } = useToast();

    const fallbackTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const effectiveTotal = checkoutSession.grandTotal || fallbackTotal;

    // --- SECURITY CHECK ---
    useEffect(() => {
        // Validate amount integrity on mount
        const sanityCheck = SecuritySystem.validateOrderIntegrity(effectiveTotal, fallbackTotal + (checkoutSession.tax || 0) + (checkoutSession.deliveryFee || 0) - (checkoutSession.discount || 0));
        if (!sanityCheck.valid) {
            logSecurityEvent('CRITICAL', 'Checkout Price Tampering Detected');
            showToast('Security Alert: Order mismatch detected. Refreshing...', 'error');
            setView(View.CART);
        }
    }, [effectiveTotal, fallbackTotal, checkoutSession, setView, showToast, logSecurityEvent]);

    const handlePayment = async () => {
        if (!selectedAddress) {
            showToast('Please select a delivery address.', 'error');
            return;
        }

        // Basic Validation
        if (paymentTab === 'UPI' && !upiId.includes('@')) return showToast('Invalid UPI ID', 'error');
        if (paymentTab === 'CARD') {
            if (!PaymentGateway.validateCard(cardNumber)) return showToast('Invalid Card Number', 'error');
            if (cardCvv.length !== 3) return showToast('Invalid CVV', 'error');
        }
        if (paymentTab === 'BANK' && !selectedBank) return showToast('Select a Bank', 'error');

        setIsProcessing(true);
        setProcessingStep('Initiating Secure Handshake...');

        // Step 1: Simulate Gateway Handshake
        setTimeout(async () => {
            setProcessingStep('Verifying with Bank...');
            
            // Step 2: Process Payment
            const result = await PaymentGateway.processPayment(effectiveTotal, paymentTab);
            
            if (result.success) {
                setProcessingStep('Payment Authorized!');
                setTimeout(() => {
                    const transaction: Transaction = {
                        id: PaymentGateway.generateTransactionId(),
                        orderId: '', // Will be filled by placeOrder
                        userId: currentUser?.id || 'guest',
                        amount: effectiveTotal,
                        method: paymentTab === 'COD' ? 'Cash on Delivery' : `${paymentTab} - ${result.refId}`,
                        status: 'SUCCESS',
                        gatewayRef: result.refId,
                        timestamp: Date.now()
                    };

                    placeOrder({
                        userId: currentUser?.id || 'guest',
                        items: cart,
                        total: effectiveTotal,
                        deliveryAddress: selectedAddress,
                        status: 'Placed',
                        paymentMethod: paymentTab === 'COD' ? 'Cash on Delivery' : paymentTab,
                        discount: checkoutSession.discount,
                        appliedCoupon: checkoutSession.couponCode
                    }, transaction);

                    showToast('Order Placed Successfully!', 'success');
                    setView(View.ORDERS);
                }, 1000);
            } else {
                setIsProcessing(false);
                showToast(result.message, 'error');
                logSecurityEvent('WARN', `Payment Failed: ${result.message}`);
            }
        }, 1500);
    };

    if (cart.length === 0) {
        setView(View.HOME);
        return null;
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-20 animate-fade-in">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm mb-4 sticky top-0 z-10 flex items-center gap-3">
                <button onClick={() => setView(View.CART)} className="text-gray-600 hover:text-green-600">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex-grow">
                    <h2 className="text-lg font-bold text-gray-800">Secure Checkout</h2>
                    <p className="text-xs text-green-600 flex items-center gap-1 font-bold">
                        <LockClosedIcon className="w-3 h-3" /> 256-bit SSL Encrypted
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-xl">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Payable</p>
                    <h1 className="text-4xl font-black">{formatCurrency(effectiveTotal)}</h1>
                    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center text-sm">
                        <span className="text-gray-300">Delivery to</span>
                        <span className="font-bold truncate max-w-[150px]">{selectedAddress?.city || 'Select Address'}</span>
                    </div>
                </div>

                {/* Payment Gateway Interface */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        <button onClick={() => setPaymentTab('UPI')} className={`flex-1 py-4 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${paymentTab === 'UPI' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <DevicePhoneMobileIcon className="w-5 h-5" /> UPI
                        </button>
                        <button onClick={() => setPaymentTab('CARD')} className={`flex-1 py-4 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${paymentTab === 'CARD' ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <CreditCardIcon className="w-5 h-5" /> Card
                        </button>
                        <button onClick={() => setPaymentTab('BANK')} className={`flex-1 py-4 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${paymentTab === 'BANK' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <BankIcon className="w-5 h-5" /> NetBank
                        </button>
                        <button onClick={() => setPaymentTab('COD')} className={`flex-1 py-4 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${paymentTab === 'COD' ? 'bg-green-50 text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <CurrencyRupeeIcon className="w-5 h-5" /> COD
                        </button>
                    </div>

                    <div className="p-6 min-h-[250px]">
                        {paymentTab === 'UPI' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="text-center mb-4">
                                    <div className="bg-white p-2 inline-block border-2 border-dashed border-gray-300 rounded-lg">
                                        <div className="w-32 h-32 bg-gray-900 flex items-center justify-center text-white text-xs">QR Code Sim</div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Scan with any UPI App</p>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Enter UPI ID (e.g. user@oksbi)" 
                                        value={upiId}
                                        onChange={e => setUpiId(e.target.value)}
                                        className="w-full border rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                                </div>
                            </div>
                        )}

                        {paymentTab === 'CARD' && (
                            <div className="space-y-4 animate-fade-in">
                                <input 
                                    type="text" 
                                    placeholder="Card Number" 
                                    value={cardNumber}
                                    onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                    className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                                />
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="MM/YY" 
                                        value={cardExpiry}
                                        onChange={e => setCardExpiry(e.target.value)}
                                        className="w-1/2 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="CVV" 
                                        value={cardCvv}
                                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        className="w-1/2 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <ShieldCheckIcon className="w-4 h-4 text-green-600" />
                                    <span>Securely saved for next time</span>
                                </div>
                            </div>
                        )}

                        {paymentTab === 'BANK' && (
                            <div className="space-y-3 animate-fade-in">
                                <p className="text-xs font-bold text-gray-500 uppercase">Popular Banks</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {PaymentGateway.getBankList().slice(0, 4).map(bank => (
                                        <button 
                                            key={bank}
                                            onClick={() => setSelectedBank(bank)}
                                            className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${selectedBank === bank ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            {bank}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {paymentTab === 'COD' && (
                            <div className="text-center py-8 animate-fade-in">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                    <CurrencyRupeeIcon className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-800">Cash / UPI on Delivery</h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Pay our delivery partner when your order arrives. Please keep exact change if possible.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action */}
                <button 
                    onClick={handlePayment}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {paymentTab === 'COD' ? 'Place Order' : `Pay ${formatCurrency(effectiveTotal)}`}
                </button>
            </div>

            {/* PROCESSING MODAL */}
            {isProcessing && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in text-center text-white">
                    <div className="relative w-24 h-24 mb-8">
                        <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShieldCheckIcon className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black mb-2">Processing Payment</h2>
                    <p className="text-gray-300 font-mono text-sm animate-pulse">{processingStep}</p>
                    <div className="mt-8 text-xs text-gray-500 uppercase tracking-widest font-bold">
                        Do not press back or refresh
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutView;
