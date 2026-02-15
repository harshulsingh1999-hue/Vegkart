import { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    phone: '9876543210',
    name: 'Rohan Sharma',
    role: 'customer',
    roles: ['customer'],
    isProfileComplete: true,
    addresses: [
      { id: 'addr-1', label: 'Home', details: '123, Rose Villa, MG Road', pincode: '400001', city: 'Mumbai', state: 'Maharashtra' },
      { id: 'addr-2', label: 'Work', details: '456, Tech Park, Powai', pincode: '400076', city: 'Mumbai', state: 'Maharashtra' },
    ],
  },
  {
    id: 'user-2',
    phone: '1234567890',
    name: 'Aisha Khan',
    role: 'seller',
    roles: ['seller'],
    isProfileComplete: true,
    addresses: [
      { id: 'addr-3', label: 'Warehouse', details: '789, Green Acres, Vashi', pincode: '400703', city: 'Navi Mumbai', state: 'Maharashtra' },
    ],
    businessName: 'Fresh Farms',
    gstin: '27AAAAA0000A1Z5',
  },
    {
    id: 'user-3',
    phone: '5555555555',
    name: 'Delivery Dave',
    role: 'delivery',
    roles: ['delivery'],
    isProfileComplete: true,
    addresses: [],
    vehicleDetails: 'MH 01 AB 1234',
  },
  {
    id: 'user-4',
    phone: '9999999999',
    name: 'Admin Alice',
    role: 'admin',
    roles: ['admin'],
    isProfileComplete: true,
    addresses: [],
  },
  {
    id: 'user-5',
    phone: '8888888888',
    name: 'Staff Steve',
    role: 'staff',
    roles: ['staff'],
    isProfileComplete: true,
    addresses: [],
    employeeId: 'EMP-001',
    department: 'Inventory',
  }
];