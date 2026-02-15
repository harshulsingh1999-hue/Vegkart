import { Product } from '../types';

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Fresh Tomatoes',
    description: 'Juicy, red tomatoes, perfect for salads and cooking.',
    category: 'Vegetables',
    imageUrls: ['https://images.unsplash.com/photo-1561155653-29f1b2da4489?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80'],
    variants: [
      { id: 'var-1a', weight: '500g', price: 40, stock: 100 },
      { id: 'var-1b', weight: '1kg', price: 75, stock: 50 },
    ],
    rating: 4.5,
    reviews: [],
    seller: 'Fresh Farms',
    availablePincodes: ['400001', '400076'],
  },
  {
    id: 'prod-2',
    name: 'Organic Spinach',
    description: 'Tender baby spinach leaves, packed with nutrients.',
    category: 'Leafy Greens',
    imageUrls: ['https://images.unsplash.com/photo-1576045057995-568f588f2f84?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80'],
    variants: [
      { id: 'var-2a', weight: '250g', price: 30, stock: 80 },
      { id: 'var-2b', weight: '500g', price: 55, stock: 40 },
    ],
    rating: 4.8,
    reviews: [],
    seller: 'Green Valley Organics',
    availablePincodes: ['400001', '400703'],
  },
];
