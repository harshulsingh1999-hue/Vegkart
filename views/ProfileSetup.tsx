
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Role } from '../types';

const ProfileSetup: React.FC = () => {
    // Atomic selectors
    const currentUser = useStore(state => state.currentUser);
    const updateUserProfile = useStore(state => state.updateUserProfile);

    // Common Fields
    const [name, setName] = useState('');
    
    // Seller Fields
    const [businessName, setBusinessName] = useState('');
    const [gstin, setGstin] = useState('');
    
    // Delivery Fields
    const [vehicleDetails, setVehicleDetails] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    
    // Employee/Admin Fields
    const [employeeId, setEmployeeId] = useState('');
    const [department, setDepartment] = useState('');

    useEffect(() => {
        if (currentUser?.name) setName(currentUser.name);
        if (currentUser?.businessName) setBusinessName(currentUser.businessName);
        if (currentUser?.gstin) setGstin(currentUser.gstin);
        if (currentUser?.vehicleDetails) setVehicleDetails(currentUser.vehicleDetails);
        if (currentUser?.employeeId) setEmployeeId(currentUser.employeeId);
    }, [currentUser]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const updates: any = { 
            name, 
            isProfileComplete: true 
        };

        if (currentUser?.role === 'seller') {
            updates.businessName = businessName;
            updates.gstin = gstin;
        } else if (currentUser?.role === 'delivery') {
            updates.vehicleDetails = vehicleDetails;
            updates.licenseNumber = licenseNumber;
        } else if (currentUser?.role === 'staff' || currentUser?.role === 'admin') {
            updates.employeeId = employeeId;
            updates.department = department;
        }

        updateUserProfile(updates);
    };

    const roleLabel = currentUser?.role === 'staff' ? 'Office Employee' : 
                      currentUser?.role === 'delivery' ? 'Delivery Partner' : 
                      currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'User';

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 py-10">
            <div className="p-8 bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in border-t-4 border-green-600">
                <h2 className="text-2xl font-bold mb-1 text-gray-800">Complete Your Profile</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Setting up account as <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">{roleLabel}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Common Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" 
                            placeholder="Enter your full name"
                            required 
                        />
                    </div>

                    {/* SELLER SPECIFIC FIELDS */}
                    {currentUser?.role === 'seller' && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Business / Shop Name</label>
                                <input 
                                    type="text" 
                                    value={businessName} 
                                    onChange={(e) => setBusinessName(e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="e.g. Fresh Farms"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">GSTIN (Optional)</label>
                                <input 
                                    type="text" 
                                    value={gstin} 
                                    onChange={(e) => setGstin(e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="GST Number"
                                />
                            </div>
                        </>
                    )}

                    {/* DELIVERY SPECIFIC FIELDS */}
                    {currentUser?.role === 'delivery' && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Details</label>
                                <input 
                                    type="text" 
                                    value={vehicleDetails} 
                                    onChange={(e) => setVehicleDetails(e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none" 
                                    placeholder="e.g. Bike - MH 04 AB 1234"
                                    required 
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Driving License No.</label>
                                <input 
                                    type="text" 
                                    value={licenseNumber} 
                                    onChange={(e) => setLicenseNumber(e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none" 
                                    required 
                                />
                            </div>
                        </>
                    )}

                    {/* STAFF / ADMIN SPECIFIC FIELDS */}
                    {(currentUser?.role === 'staff' || currentUser?.role === 'admin') && (
                        <>
                             <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
                                <input 
                                    type="text" 
                                    value={employeeId} 
                                    onChange={(e) => setEmployeeId(e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none" 
                                    placeholder="EMP-XXXX"
                                    required 
                                />
                            </div>
                            {currentUser.role === 'staff' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                                    <select 
                                        value={department} 
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Accounts">Accounts</option>
                                        <option value="Inventory">Inventory Management</option>
                                        <option value="Support">Customer Support</option>
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    <div className="pt-4">
                        <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold p-3 rounded-xl shadow-lg hover:shadow-xl hover:from-green-500 hover:to-green-600 transition transform active:scale-95">
                            Save & Enter Dashboard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;
