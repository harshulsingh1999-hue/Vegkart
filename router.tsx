import React from 'react';
import { useStore } from './store';
import { View } from './types';

// Lazy load views for better performance
const LoginFlow = React.lazy(() => import('./views/LoginFlow'));
const ProfileSetup = React.lazy(() => import('./views/ProfileSetup'));
const LocationSelection = React.lazy(() => import('./views/LocationSelection'));
const CustomerLayout = React.lazy(() => import('./layout/CustomerLayout'));
const SellerDashboard = React.lazy(() => import('./views/SellerDashboard'));
const DeliveryDashboard = React.lazy(() => import('./views/DeliveryDashboard'));
const AdminDashboard = React.lazy(() => import('./views/AdminDashboard'));
const OfficeDashboard = React.lazy(() => import('./views/OfficeDashboard'));

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500"></div>
  </div>
);

const AppRouter: React.FC = () => {
  // Split selectors to avoid object reference equality issues causing re-renders
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const currentUser = useStore(state => state.currentUser);
  const selectedAddress = useStore(state => state.selectedAddress);
  const hasHydrated = useStore(state => state._hasHydrated);

  // Wait for persisted store to hydrate before checking auth state
  if (!hasHydrated) {
    return <LoadingFallback />;
  }

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      {!isAuthenticated || !currentUser ? (
        <LoginFlow />
      ) : !currentUser.isProfileComplete ? (
        <ProfileSetup />
      ) : currentUser.role === 'customer' && !selectedAddress ? (
        <LocationSelection />
      ) : (
        <>
          {currentUser.role === 'customer' && <CustomerLayout />}
          {currentUser.role === 'seller' && <SellerDashboard />}
          {currentUser.role === 'delivery' && <DeliveryDashboard />}
          {currentUser.role === 'staff' && <OfficeDashboard />}
          {currentUser.role === 'admin' && <AdminDashboard />}
        </>
      )}
    </React.Suspense>
  );
};

export default AppRouter;