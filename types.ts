
export type Role = 'customer' | 'seller' | 'delivery' | 'staff' | 'admin';

export interface Address {
  id: string;
  label: string;
  details: string;
  pincode: string;
  city: string;
  state: string;
  // Added for Route Optimization
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: Role; // Active role for the current session
  roles: Role[]; // All available roles for this user
  isProfileComplete: boolean;
  addresses: Address[];
  language?: string; // Added Language Preference
  // User Dashboard Features
  walletBalance?: number;
  wishlist?: string[]; // Array of Product IDs
  totalSavings?: number;
  // Additional role-specific details
  businessName?: string;
  gstin?: string;
  vehicleDetails?: string;
  licenseNumber?: string; // For delivery
  employeeId?: string; // For staff/admin
  department?: string; // For staff
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
}

export interface ProductVariant {
    id: string;
    weight: string; // e.g., "500g", "1kg"
    price: number;
    stock: number;
    discount?: number; // Added discount percentage
}

// --- NEW: Advanced Inventory Logic ---
export interface InventoryRule {
    id: string;
    variantId: string; // Links to a specific variant (e.g. 1kg)
    scope: 'STATE' | 'CITY' | 'PINCODE';
    locationName: string; // "Maharashtra", "Mumbai", or "400001"
    price: number;
    stock: number;
    discount: number; // Percentage
}

export interface Product {
  id: string;
  name: string;
  description: string;
  richDescription?: string; // HTML string for rich text details
  category: string;
  imageUrls: string[]; // Can contain image or video URLs
  variants: ProductVariant[];
  inventoryRules?: InventoryRule[]; // New: Granular control
  rating: number;
  reviews: Review[];
  seller: string;
  sellerId?: string; // Added for stable linking
  availablePincodes: string[]; // Kept for backward compatibility/quick search
}

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  price: number;
  image: string;
  quantity: number;
}

// New Interface for Tax Configuration
export interface TaxConfig {
    gstRate: number; // Percentage
    serviceTaxRate: number; // Percentage (Default 3%)
}

// Payment Configuration for Admin Control
export interface PaymentMethodConfig {
    id: string;
    label: string;
    description: string;
    iconType: 'mobile' | 'card' | 'bank' | 'cash' | 'wallet';
    isEnabled: boolean;
}

// --- COUPON INTERFACE ---
export interface Coupon {
    id: string;
    code: string; // e.g., WELCOME50
    type: 'FLAT' | 'PERCENTAGE';
    value: number; // Amount or Percent
    description: string;
    minOrderValue?: number;
    isActive: boolean;
}

// --- GLOBAL APP FEATURE FLAGS ---
export interface AppSettings {
    enableMaintenanceMode: boolean;
    allowNewRegistrations: boolean;
    enableCoupons: boolean;
    enableBanners: boolean;
    requirePincodeCheck: boolean;
    showLowStockWarnings: boolean;
}

// New Interface for Advanced Cart/Checkout Logic
export interface CheckoutSession {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    grandTotal: number;
    couponCode?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  date: string;
  deliveryAddress: Address;
  // Updated status flow
  status: 'Placed' | 'Preparing' | 'Ready for Pickup' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  paymentMethod: string; // Changed to string to support dynamic methods
  appliedCoupon?: string;
  discount?: number;
  deliveryOtp: string;
  deliveryAgentId?: string; // Assigned delivery partner ID
  // Return / Refund Logic
  returnStatus?: 'Requested' | 'Approved' | 'Rejected' | 'Refunded';
  returnReason?: string;
  // Cash Management
  isDeposited?: boolean; // True if COD cash has been handed over to office
}

// --- NEW MARKETING TYPES ---
export type BannerType = 'HERO' | 'TODAY_OFFER' | 'WEEKLY_OFFER' | 'FULLSCREEN_AD';

export interface Banner {
    id: string;
    type: BannerType;
    title: string;
    subtitle?: string;
    imageUrl: string;
    discountText?: string; // e.g. "50% OFF" or "Flat ₹100"
    couponCode?: string;
    themeClass: string; // CSS class for background/gradients
    isActive: boolean;
}

export enum View {
  HOME = 'HOME',
  CART = 'CART',
  CHECKOUT = 'CHECKOUT',
  ORDERS = 'ORDERS',
  PROFILE = 'PROFILE', // Now acts as Dashboard
  PRODUCT_DETAIL = 'PRODUCT_DETAIL',
  ORDER_TRACKING = 'ORDER_TRACKING',
  // Dashboard Sub-Views
  WALLET = 'WALLET',
  WISHLIST = 'WISHLIST',
  SUPPORT = 'SUPPORT',
  NOTIFICATIONS = 'NOTIFICATIONS',
  // Profile sub-views
  SECURITY = 'SECURITY',
  PAYMENT = 'PAYMENT',
  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS',
  CONTACT_US = 'CONTACT_US',
}
