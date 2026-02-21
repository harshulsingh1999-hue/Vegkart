
import React from 'react';
import { useStore } from '../store';
import { View } from '../types';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Dynamically import views for better code splitting
const HomeView = React.lazy(() => import('../views/customer/HomeView'));
const CartView = React.lazy(() => import('../views/customer/CartView'));
const CheckoutView = React.lazy(() => import('../views/customer/CheckoutView'));
const OrderHistory = React.lazy(() => import('../views/customer/OrderHistory'));
const ProfileView = React.lazy(() => import('../views/customer/ProfileView'));
const ProductDetailView = React.lazy(() => import('../views/customer/ProductDetailView'));

const LoadingFallback = () => <div className="p-4 text-center">Loading...</div>;

const CustomerLayout: React.FC = () => {
    // Atomic selectors to prevent unnecessary re-renders
    const currentView = useStore(state => state.currentView);
    const selectedProductId = useStore(state => state.selectedProductId);

    const renderView = () => {
        switch (currentView) {
            case View.HOME:
                return <HomeView />;
            case View.PRODUCT_DETAIL:
                // Add key to force remount when selected product changes
                return <ProductDetailView key={selectedProductId} />;
            case View.CART:
                return <CartView />;
            case View.CHECKOUT:
                return <CheckoutView />;
            case View.ORDERS:
                return <OrderHistory />;
            case View.PROFILE:
                return <ProfileView />;
            // Add other customer-facing views here
            default:
                return <HomeView />;
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 shadow-lg flex flex-col font-sans">
            <Header />
            <main className="flex-grow p-4 overflow-y-auto">
                <React.Suspense fallback={<LoadingFallback />}>
                    {renderView()}
                </React.Suspense>
            </main>
            <Footer />
        </div>
    );
};

export default CustomerLayout;
