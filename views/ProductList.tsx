
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import { XMarkIcon } from '../components/ui/Icons';
import { Banner } from '../types';

// --- Dynamic Components mapped from Banner Data ---

const FullScreenAd = ({ banner, onClose }: { banner: Banner, onClose: () => void }) => {
    if (!banner) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full relative transform transition-all scale-100">
                <button 
                    onClick={onClose}
                    className="absolute top-3 right-3 bg-white/50 text-black p-2 rounded-full hover:bg-white backdrop-blur-md z-10 transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <div className="h-96 relative">
                    <img 
                        src={banner.imageUrl || 'https://via.placeholder.com/400x600'} 
                        alt={banner.title} 
                        className="w-full h-full object-cover bg-gray-200"
                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x600?text=Ad'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 text-center">
                        {banner.discountText && (
                            <span className="bg-yellow-400 text-black font-extrabold text-xs px-3 py-1 uppercase tracking-widest rounded-full self-center mb-2 animate-bounce-short">
                                {banner.discountText}
                            </span>
                        )}
                        <h2 className="text-3xl font-extrabold text-white mb-1">{banner.title}</h2>
                        <p className="text-gray-200 text-sm mb-4">{banner.subtitle}</p>
                        <button 
                            onClick={onClose}
                            className="bg-green-600 text-white font-bold py-3 px-6 rounded-full hover:bg-green-500 transition-transform active:scale-95 shadow-lg w-full"
                        >
                            {banner.couponCode ? `Use Code: ${banner.couponCode}` : 'Grab Deal Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HeroSection = ({ banners }: { banners: Banner[] }) => {
    if (banners.length === 0) return null;
    return (
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-4 w-max px-1">
                {banners.map(banner => (
                    <div key={banner.id} className="relative w-72 h-40 rounded-2xl overflow-hidden shadow-lg group">
                        <img src={banner.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={banner.title} onError={(e) => e.currentTarget.style.display = 'none'} />
                        <div className={`absolute inset-0 flex flex-col justify-center p-4 ${banner.themeClass}`}>
                            <span className="text-white/90 font-bold text-xs uppercase mb-1">{banner.subtitle}</span>
                            <h3 className="text-white font-bold text-xl leading-tight">{banner.title}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TodaysOffers = ({ banners }: { banners: Banner[] }) => {
    if (banners.length === 0) return null;
    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">LIVE</span>
                <h2 className="text-lg font-bold text-gray-800">Today's Offers</h2>
            </div>
            
            <div className="space-y-4">
                {banners.map(banner => (
                     <div key={banner.id} className={`relative rounded-2xl overflow-hidden shadow-xl h-44 flex items-center ${banner.themeClass}`}>
                        <div className="w-3/5 p-5 z-10">
                            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider backdrop-blur-sm">
                                Deal of the Day
                            </span>
                            <h3 className="text-white text-2xl font-black mt-2 leading-none italic break-words">
                                {banner.title}
                            </h3>
                            <p className="text-indigo-100 text-xs mt-2 mb-3">{banner.subtitle}</p>
                            {banner.discountText && (
                                <button className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-gray-100">
                                    {banner.discountText}
                                </button>
                            )}
                        </div>
                        <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        {banner.imageUrl && (
                            <img 
                                src={banner.imageUrl} 
                                alt={banner.title} 
                                className="absolute right-0 top-0 h-full w-2/5 object-cover mask-image-gradient"
                                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}
                                onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const WeeklyOffers = ({ banners }: { banners: Banner[] }) => {
    if (banners.length === 0) return null;
    return (
        <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Weekly Theme Offers</h2>
            <div className="grid grid-cols-1 gap-3">
                {banners.map(banner => (
                    <div key={banner.id} className={`rounded-xl p-4 flex items-center justify-between shadow-sm ${banner.themeClass}`}>
                        <div>
                            <h4 className="font-bold">{banner.title}</h4>
                            <p className="text-xs opacity-80 mt-1">{banner.subtitle}</p>
                        </div>
                        <div className="text-right">
                            <span className="block text-lg font-bold">{banner.discountText}</span>
                            {banner.couponCode && (
                                <span className="text-[10px] opacity-60 uppercase">Use Code: {banner.couponCode}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Component ---

const ProductList: React.FC = () => {
    const products = useStore(state => state.products);
    const selectedAddress = useStore(state => state.selectedAddress);
    const banners = useStore(state => state.banners);
    const [showAd, setShowAd] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Group banners by type
    const heroBanners = banners.filter(b => b.type === 'HERO');
    const todayBanners = banners.filter(b => b.type === 'TODAY_OFFER');
    const weeklyBanners = banners.filter(b => b.type === 'WEEKLY_OFFER');
    const adBanner = banners.find(b => b.type === 'FULLSCREEN_AD');
    
    // Simulate checking if ad should be shown (e.g., once per session)
    useEffect(() => {
        if (adBanner) {
            const timer = setTimeout(() => {
                setShowAd(true);
            }, 1000); // Show ad 1 second after load
            return () => clearTimeout(timer);
        }
    }, [adBanner]);

    // Extract Categories - Safely
    const categories = ['All', ...(Array.from(new Set(products.filter(p => p && p.category).map(p => p.category))) as string[])];

    // Filter Logic - WITH HARDENED SAFETY CHECKS
    const filteredProducts = products.filter(p => {
        if (!p) return false;
        
        // Defensive: Ensure array exists before calling includes
        const pincodes = Array.isArray(p.availablePincodes) ? p.availablePincodes : [];
        const matchesPincode = pincodes.includes(selectedAddress?.pincode || '');
        
        // Defensive: Check for name existence
        const productName = p.name ? p.name.toLowerCase() : '';
        const matchesSearch = productName.includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        
        return matchesPincode && matchesSearch && matchesCategory;
    });

    return (
        <div className="pb-16">
            {/* Full Screen Ad Overlay */}
            {showAd && adBanner && <FullScreenAd banner={adBanner} onClose={() => setShowAd(false)} />}

            {/* Header Banners */}
            <HeroSection banners={heroBanners} />

            {/* Search Bar */}
            <div className="mb-6 sticky top-0 z-20 bg-gray-50 pt-2 pb-2">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search for vegetables, fruits..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border-none shadow-md focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-700"
                    />
                    <div className="absolute left-3 top-3.5 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 w-max px-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 ${
                                selectedCategory === cat 
                                ? 'bg-green-600 text-white shadow-green-200' 
                                : 'bg-white text-gray-600 hover:bg-green-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Only show marketing sections if not searching */}
            {!searchQuery && selectedCategory === 'All' && (
                <>
                    {/* Special Offers */}
                    <TodaysOffers banners={todayBanners} />

                    {/* Weekly Offers */}
                    <WeeklyOffers banners={weeklyBanners} />
                </>
            )}

            {/* Product Grid */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                    {searchQuery ? 'Search Results' : `${selectedCategory === 'All' ? 'Fresh Vegetables' : selectedCategory}`}
                </h2>
                {!searchQuery && <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">{filteredProducts.length} Items</span>}
            </div>
            
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow text-center mt-4">
                    <div className="text-4xl mb-2">🥬</div>
                    <p className="text-lg font-medium text-gray-800">No products found</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Try changing your search term or category.
                        <br/>Your location: <strong>{selectedAddress?.pincode}</strong>
                    </p>
                    <button 
                        onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                        className="mt-4 text-green-600 font-bold hover:underline"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
            
            {/* Bottom spacer for safe area */}
            <div className="h-8"></div>
        </div>
    );
};

export default ProductList;
