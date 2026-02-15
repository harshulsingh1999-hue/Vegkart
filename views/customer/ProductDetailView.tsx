
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { View, Product } from '../../types';
import { formatCurrency, resolveRegionalPrice } from '../../utils';
import { useToast } from '../../providers/ToastProvider';
import { XMarkIcon, ClipboardListIcon, UserCircleIcon } from '../../components/ui/Icons';

const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg)$/i) || url.includes('video');

const ZoomableMedia: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    
    const mediaRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isVid = isVideo(src);

    // Reset zoom and handle body scroll lock when modal opens/closes
    useEffect(() => {
        if (isZoomModalOpen) {
            document.body.style.overflow = 'hidden';
            setScale(1);
            setPosition({ x: 0, y: 0 });
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isZoomModalOpen]);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    // Helper to extract client coordinates from either Mouse or Touch events
    const getClientCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        // Safer type check for touch events
        const touchEvent = e as unknown as React.TouchEvent;
        if (touchEvent.touches) {
            return { x: touchEvent.touches[0].clientX, y: touchEvent.touches[0].clientY };
        }
        const mouseEvent = e as unknown as React.MouseEvent;
        return { x: mouseEvent.clientX, y: mouseEvent.clientY };
    };

    // Drag Logic
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (scale === 1) return; // Only allow drag if zoomed in
        setIsDragging(true);
        const { x, y } = getClientCoordinates(e);
        setStartPos({ x: x - position.x, y: y - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        // Prevent default only if it's a touch event to avoid scrolling while dragging
        if ((e as unknown as React.TouchEvent).touches) {
            e.preventDefault(); 
        }
        const { x, y } = getClientCoordinates(e);
        setPosition({
            x: x - startPos.x,
            y: y - startPos.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <>
            {/* Thumbnail / Main View */}
            <div className="relative group overflow-hidden rounded-2xl shadow-lg bg-gray-100 border border-gray-200">
                {isVid ? (
                    <video 
                        src={src} 
                        className="w-full h-72 object-contain object-center" 
                        controls
                    />
                ) : (
                    <img 
                        src={src} 
                        alt={alt} 
                        className="w-full h-72 object-cover object-center cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                        onClick={() => setIsZoomModalOpen(true)}
                    />
                )}
                
                {!isVid && (
                    <button 
                        onClick={() => setIsZoomModalOpen(true)}
                        className="absolute bottom-3 right-3 bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md hover:bg-white backdrop-blur-sm transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                        Zoom
                    </button>
                )}
            </div>

            {/* Full Screen Zoom Modal (Images Only) */}
            {isZoomModalOpen && !isVid && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center overflow-hidden animate-fade-in">
                    {/* Toolbar */}
                    <div className="absolute top-6 right-6 flex gap-4 z-50">
                        <button onClick={handleReset} className="bg-white/10 text-white p-3 rounded-full hover:bg-white/20 backdrop-blur-md transition-colors" title="Reset">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        </button>
                        <button onClick={() => setIsZoomModalOpen(false)} className="bg-white/10 text-white p-3 rounded-full hover:bg-red-500/80 backdrop-blur-md transition-colors" title="Close">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Image Container */}
                    <div 
                        ref={containerRef}
                        className={`w-full h-full flex items-center justify-center overflow-hidden ${scale > 1 ? 'cursor-move' : 'cursor-default'}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                    >
                        <img 
                            ref={mediaRef}
                            src={src} 
                            alt={alt}
                            draggable={false}
                            className="max-w-none transition-transform duration-100 ease-linear select-none shadow-2xl"
                            style={{ 
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                maxHeight: '85vh',
                                maxWidth: '95vw'
                            }}
                        />
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-10 flex items-center gap-6 bg-white/10 px-8 py-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
                        <button onClick={handleZoomOut} disabled={scale <= 1} className="text-white hover:text-green-400 disabled:opacity-30 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                            </svg>
                        </button>
                        <span className="text-white font-mono font-bold text-lg min-w-[4ch] text-center">{(scale * 100).toFixed(0)}%</span>
                        <button onClick={handleZoomIn} disabled={scale >= 4} className="text-white hover:text-green-400 disabled:opacity-30 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

const ProductDetailView: React.FC = () => {
    // Atomic selectors to prevent unnecessary re-renders
    const products = useStore(state => state.products);
    const selectedProductId = useStore(state => state.selectedProductId);
    const setView = useStore(state => state.setView);
    const addToCart = useStore(state => state.addToCart);
    const selectedAddress = useStore(state => state.selectedAddress);
    
    const { showToast } = useToast();
    const product = products.find(p => p.id === selectedProductId);
    
    // Initialize with safe default
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

    // Update variant if product changes (though this component usually remounts)
    useEffect(() => {
        if (product && product.variants && product.variants.length > 0) {
            setSelectedVariantId(product.variants[0].id);
        }
    }, [product]);

    // Dead Link & Corruption Protection
    useEffect(() => {
        if (!product && selectedProductId) {
            // Product disappeared
            showToast('This product is no longer available.', 'error');
            setView(View.HOME);
        } else if (product && (!product.variants || product.variants.length === 0)) {
            // Product exists but is invalid (no variants)
            showToast('Product data is incomplete. Redirecting...', 'error');
            setView(View.HOME);
        }
    }, [product, selectedProductId, setView, showToast]);

    if (!product || !product.variants || product.variants.length === 0) {
        // Fallback UI while redirecting
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 mb-4">Redirecting...</p>
            </div>
        );
    }

    // Use Geo-Inventory Helper to get correct price/stock for this user's location
    const { price, stock, discount } = resolveRegionalPrice(product, selectedVariantId, selectedAddress);

    const handleAddToCart = () => {
        addToCart(product, selectedVariantId, quantity);
        showToast(`${quantity}x ${product.name} added to cart!`, 'success');
        setView(View.CART);
    };

    return (
        // Added pb-24 to prevent content being hidden behind sticky bottom bar
        <div className="bg-white min-h-[80vh] flex flex-col font-sans animate-fade-in pb-24">
            {/* Back Button */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center">
                <button 
                    onClick={() => setView(View.HOME)}
                    className="flex items-center gap-2 text-gray-600 hover:text-green-700 bg-gray-100 hover:bg-green-50 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to Shop
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Media Section */}
                <div>
                    <ZoomableMedia src={product.imageUrls[selectedMediaIndex]} alt={product.name} />
                    
                    {/* Thumbnails */}
                    {product.imageUrls.length > 1 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                            {product.imageUrls.map((url, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setSelectedMediaIndex(idx)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${selectedMediaIndex === idx ? 'border-green-600 ring-2 ring-green-100 opacity-100 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                >
                                    {isVideo(url) ? (
                                        <video src={url} className="w-full h-full object-cover" muted />
                                    ) : (
                                        <img src={url} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>
                                <p className="text-sm font-medium text-gray-500 mt-1">{product.category}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Sold By</span>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{product.seller}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                            {[1,2,3,4,5].map(star => (
                                <svg key={star} className={`w-4 h-4 ${star <= Math.round(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                            <span className="text-xs text-gray-500 font-bold ml-1">({product.rating.toFixed(1)}) • {product.reviews?.length || 0} reviews</span>
                        </div>
                    </div>

                    {/* Price & Variants Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-5">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Price</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-3xl font-black text-green-700 tracking-tight">{formatCurrency(price)}</p>
                                        {discount > 0 && (
                                            <div className="flex flex-col text-[10px] font-bold">
                                                <span className="text-gray-400 line-through">{formatCurrency(price / (1 - discount/100))}</span>
                                                <span className="text-green-600">{discount}% OFF</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-sm ${stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {stock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Select Size</label>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants.map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => setSelectedVariantId(v.id)}
                                                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                                                    selectedVariantId === v.id 
                                                    ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105' 
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:bg-green-50'
                                                }`}
                                            >
                                                {v.weight}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Quantity</label>
                                    <div className="flex items-center w-40 bg-gray-100 rounded-xl p-1 shadow-inner">
                                        <button 
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-gray-600 font-bold shadow-sm hover:text-green-600 transition-colors active:bg-gray-200"
                                        >-</button>
                                        <div className="flex-1 text-center font-bold text-gray-800 text-lg">{quantity}</div>
                                        <button 
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-gray-600 font-bold shadow-sm hover:text-green-600 transition-colors active:bg-gray-200"
                                        >+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Details Description Card */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                            <ClipboardListIcon className="w-5 h-5 text-gray-500" />
                            <h3 className="font-bold text-gray-800">Description</h3>
                        </div>
                        {product.richDescription ? (
                            <div 
                                className="prose prose-sm prose-green max-w-none text-gray-600 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: product.richDescription }}
                            />
                        ) : (
                            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                        )}
                    </div>

                    {/* Reviews Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <span className="bg-yellow-400 text-white p-1 rounded-md"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></span>
                                Ratings & Reviews
                            </h3>
                            <button className="text-xs font-bold text-green-600 hover:underline">View All</button>
                        </div>
                        
                        {product.reviews && product.reviews.length > 0 ? (
                            <div className="space-y-4">
                                {product.reviews.slice(0, 3).map(review => (
                                    <div key={review.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <UserCircleIcon className="w-6 h-6 text-gray-300" />
                                                <span className="text-sm font-bold text-gray-800">{review.author}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">{review.date}</span>
                                        </div>
                                        <div className="pl-8">
                                            <div className="flex mb-1">
                                                {[1,2,3,4,5].map(star => (
                                                    <svg key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-sm text-gray-500 mb-2">No reviews yet.</p>
                                <p className="text-xs text-gray-400">Be the first to review this product!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 max-w-md mx-auto p-4">
                <button 
                    onClick={handleAddToCart}
                    disabled={stock === 0}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-green-500 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] flex justify-between items-center px-6"
                >
                    <span>{stock === 0 ? 'Unavailable' : 'Add to Cart'}</span>
                    {stock > 0 && (
                        <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                            {formatCurrency(price * quantity)}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProductDetailView;
