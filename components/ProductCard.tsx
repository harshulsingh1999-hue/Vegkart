
import React, { useState } from 'react';
import { Product, View } from '../types';
import { formatCurrency, resolveRegionalPrice } from '../utils';
import { useStore } from '../store';
import { useToast } from '../providers/ToastProvider';
import { HeartIcon, ShoppingCartIcon, LocationMarkerIcon, CheckCircleIcon } from './ui/Icons';

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
    const addToCart = useStore(state => state.addToCart);
    const setSelectedProductId = useStore(state => state.setSelectedProductId);
    const setView = useStore(state => state.setView);
    const toggleWishlist = useStore(state => state.toggleWishlist);
    const currentUser = useStore(state => state.currentUser);
    const selectedAddress = useStore(state => state.selectedAddress);
    
    const { showToast } = useToast();
    const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id);
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedVariantId) return;
        
        setIsAdding(true);
        addToCart(product, selectedVariantId, 1);
        
        // Visual feedback delay
        setTimeout(() => {
            setIsAdding(false);
            showToast(`${product.name} added to cart!`, 'success');
        }, 600);
    };

    const handleWishlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) {
            showToast('Please login to wishlist items', 'error');
            return;
        }
        toggleWishlist(product.id);
    };

    const handleViewDetail = () => {
        setSelectedProductId(product.id);
        setView(View.PRODUCT_DETAIL);
    };
    
    // Resolve Regional Pricing logic using the utility
    // We check if the resolved price is different from base to show "Regional Price" badge
    const baseVariant = product.variants.find(v => v.id === selectedVariantId);
    const { price, stock, discount, weight } = resolveRegionalPrice(product, selectedVariantId, selectedAddress);
    
    const isRegionalPrice = baseVariant && baseVariant.price !== price;
    
    const isVideo = (url: string) => url?.match(/\.(mp4|webm|ogg)$/i) || url?.includes('video');
    const mainMedia = product.imageUrls[0];
    const isWishlisted = currentUser?.wishlist?.includes(product.id);

    return (
        <div 
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group h-full flex flex-col relative transform hover:-translate-y-1"
            onClick={handleViewDetail}
        >
            {/* Action Overlay */}
            <button 
                onClick={handleWishlist}
                className={`absolute top-2 right-2 z-20 p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
                    isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-400 hover:text-red-500'
                }`}
            >
                <HeartIcon className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            {/* Discount Badge */}
            {discount > 0 && (
                <div className="absolute top-2 left-2 z-20 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm animate-pulse">
                    {discount}% OFF
                </div>
            )}

            {/* Media Section */}
            <div className="relative w-full h-40 bg-gray-50 overflow-hidden">
                {isVideo(mainMedia) ? (
                    <div className="w-full h-full relative">
                         <video src={mainMedia} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" muted />
                         <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <div className="bg-white/90 rounded-full p-2 shadow-lg backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600">
                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                </svg>
                            </div>
                         </div>
                    </div>
                ) : (
                    <img 
                        src={mainMedia} 
                        alt={product.name} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                )}
                
                {/* Stock Warning Bar */}
                {stock < 10 && stock > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                        <div className="h-full bg-red-500" style={{ width: `${(stock / 10) * 100}%` }}></div>
                    </div>
                )}
            </div>

            <div className="p-3 flex flex-col flex-grow justify-between">
                <div className="mb-2">
                    <h3 className="font-bold text-sm text-gray-800 leading-snug mb-1 line-clamp-2 group-hover:text-green-700 transition-colors">{product.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{product.category}</p>
                </div>
                
                <div>
                    <div className="flex justify-between items-end mb-3">
                        <div className="flex flex-col">
                            {isRegionalPrice && (
                                <div className="flex items-center gap-1 text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 rounded mb-0.5 w-fit">
                                    <LocationMarkerIcon className="w-2 h-2" />
                                    <span>{selectedAddress?.city || 'Local'} Price</span>
                                </div>
                            )}
                            <span className="font-black text-lg text-gray-900 leading-none">{formatCurrency(price)}</span>
                            {discount > 0 && (
                                <span className="text-[10px] text-gray-400 line-through mt-0.5">
                                    {formatCurrency(price / (1 - discount/100))}
                                </span>
                            )}
                        </div>
                        
                        {product.variants.length > 1 ? (
                            <select 
                                value={selectedVariantId} 
                                onChange={(e) => {
                                    e.stopPropagation();
                                    setSelectedVariantId(e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] font-bold border border-gray-200 rounded-lg py-1 px-1 bg-gray-50 outline-none focus:border-green-500 transition-colors"
                            >
                                {product.variants.map(v => <option key={v.id} value={v.id}>{v.weight}</option>)}
                            </select>
                        ) : (
                             <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{weight}</span>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleAddToCart}
                        disabled={stock === 0}
                        className={`w-full text-xs font-bold py-2.5 px-2 rounded-xl shadow-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                            stock === 0 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : isAdding 
                                ? 'bg-green-700 text-white scale-95'
                                : 'bg-gray-900 text-white hover:bg-green-600 hover:shadow-green-200 hover:shadow-lg active:scale-95'
                        }`}
                    >
                        {isAdding ? (
                            <>
                                <CheckCircleIcon className="w-4 h-4 animate-bounce" />
                                Added
                            </>
                        ) : stock === 0 ? (
                            'Out of Stock'
                        ) : (
                            <>
                                <ShoppingCartIcon className="w-3.5 h-3.5" />
                                Add to Cart
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
