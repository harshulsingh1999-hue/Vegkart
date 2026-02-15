import React from 'react';

const DeliveryDashboard: React.FC = () => {
    // In a real app, this would show assigned deliveries, maps, etc.
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
            <p className="mt-4">Your assigned deliveries will appear here.</p>
        </div>
    );
};

export default DeliveryDashboard;
