
import React, { useState } from 'react';
import { useStore } from '../store';
import { LocationMarkerIcon, ArrowPathIcon } from './ui/Icons';
import { useToast } from '../providers/ToastProvider';

const Header: React.FC = () => {
    const { selectedAddress, reconcileAllData } = useStore();
    const { showToast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        reconcileAllData();
        setTimeout(() => {
            setIsRefreshing(false);
            showToast('App Refreshed', 'success');
        }, 800);
    };

    return (
        <header className="bg-white shadow-md p-4 sticky top-0 z-10">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-green-600">Veggie-Verse</h1>
                <div className="flex items-center gap-3">
                    {selectedAddress && (
                        <div className="flex items-center text-sm text-gray-600">
                            <LocationMarkerIcon className="w-4 h-4 mr-1" />
                            <span className="truncate max-w-[100px] sm:max-w-none">{selectedAddress.city}, {selectedAddress.pincode}</span>
                        </div>
                    )}
                    <button 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-gray-50 text-gray-500 p-2 rounded-full hover:bg-gray-100 hover:text-green-600 transition-all border border-gray-100"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
