
import React from 'react';
import { useStore } from '../store';
import { View } from '../types';
import { HomeIcon, ClipboardListIcon, UserCircleIcon, ShoppingCartIcon } from './ui/Icons';

const Footer: React.FC = () => {
    const { currentView, setView, cart } = useStore();
    
    const navItems = [
        { view: View.HOME, label: 'Home', icon: HomeIcon },
        { view: View.CART, label: 'Cart', icon: ShoppingCartIcon, badge: cart.length },
        { view: View.ORDERS, label: 'Orders', icon: ClipboardListIcon },
        { view: View.PROFILE, label: 'Profile', icon: UserCircleIcon },
    ];

    return (
        <footer className="bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sticky bottom-0 z-30 border-t border-gray-100">
            <nav className="flex justify-around p-2 pb-safe">
                {navItems.map(item => (
                    <button
                        key={item.view}
                        onClick={() => setView(item.view)}
                        className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 group w-16 ${
                            currentView === item.view 
                            ? 'text-green-700' 
                            : 'text-gray-400 hover:text-green-600 hover:bg-gray-50'
                        }`}
                        aria-current={currentView === item.view ? 'page' : undefined}
                    >
                        <div className={`relative p-1 rounded-full transition-all duration-200 ${currentView === item.view ? '-translate-y-1' : ''}`}>
                            <item.icon 
                                className={`w-6 h-6 transition-transform duration-200 ${
                                    currentView === item.view ? 'scale-110 drop-shadow-sm stroke-2' : 'stroke-[1.5]'
                                }`} 
                            />
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white shadow-sm animate-bounce-short">
                                    {item.badge}
                                </span>
                            )}
                        </div>
                        <span className={`text-[10px] font-bold transition-opacity duration-200 ${currentView === item.view ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>
        </footer>
    );
};

export default Footer;
