
export type Role = 'customer' | 'seller' | 'delivery' | 'staff' | 'admin';

export interface Address {
  id: string;
  label: string;
  details: string;
  pincode: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Session {
    id: string;
    device: string;
    browser: string;
    location: string;
    ip: string;
    lastActive: number;
    isCurrent: boolean;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: Role;
  roles: Role[];
  isProfileComplete: boolean;
  addresses: Address[];
  language?: string;
  walletBalance?: number;
  wishlist?: string[];
  totalSavings?: number;
  businessName?: string;
  gstin?: string;
  vehicleDetails?: string;
  licenseNumber?: string;
  employeeId?: string;
  department?: string;
  // Security
  riskScore?: number;
  isFlagged?: boolean;
  // Added fields
  email?: string;
  region?: string;
  authProvider?: string;
  sessions?: Session[];
}

export interface ProductVariant {
    id: string;
    weight: string;
    price: number;
    stock: number;
    discount?: number;
}

export interface InventoryRule {
    id: string;
    variantId: string;
    scope: 'STATE' | 'CITY' | 'PINCODE';
    locationName: string;
    price: number;
    stock: number;
    discount: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  richDescription?: string;
  category: string;
  imageUrls: string[];
  variants: ProductVariant[];
  inventoryRules?: InventoryRule[];
  rating: number;
  reviews: any[];
  seller: string;
  sellerId?: string;
  availablePincodes: string[];
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

export interface TaxConfig {
    gstRate: number;
    serviceTaxRate: number;
}

export interface PaymentMethodConfig {
    id: string;
    label: string;
    description: string;
    iconType: 'mobile' | 'card' | 'bank' | 'cash' | 'wallet';
    isEnabled: boolean;
}

export interface Coupon {
    id: string;
    code: string;
    type: 'FLAT' | 'PERCENTAGE';
    value: number;
    description: string;
    minOrderValue?: number;
    isActive: boolean;
}

export interface AppSettings {
    enableMaintenanceMode: boolean;
    allowNewRegistrations: boolean;
    enableCoupons: boolean;
    enableBanners: boolean;
    requirePincodeCheck: boolean;
    showLowStockWarnings: boolean;
}

export interface CheckoutSession {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    grandTotal: number;
    couponCode?: string;
}

// --- NEW TRANSACTION INTERFACES ---
export interface Transaction {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    method: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
    gatewayRef: string;
    timestamp: number;
    metadata?: any;
}

export interface SecurityLog {
    id: string;
    level: 'INFO' | 'WARN' | 'CRITICAL';
    event: string;
    ip: string; // Simulated
    userId?: string;
    timestamp: number;
    resolved: boolean;
}

export interface SecurityThreat {
    id: string;
    type: 'VIRUS' | 'MALWARE' | 'CORRUPTION' | 'DDOS' | 'INTRUSION';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    target: 'USER' | 'PRODUCT' | 'ORDER' | 'SYSTEM';
    targetId: string;
    detectedAt: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  date: string;
  deliveryAddress: Address;
  status: 'Placed' | 'Preparing' | 'Ready for Pickup' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  paymentMethod: string;
  appliedCoupon?: string;
  discount?: number;
  deliveryOtp: string;
  deliveryAgentId?: string;
  returnStatus?: 'Requested' | 'Approved' | 'Rejected' | 'Refunded';
  returnReason?: string;
  isDeposited?: boolean;
  transactionId?: string; // Link to financial record
  region?: string;
}

export type BannerType = 'HERO' | 'TODAY_OFFER' | 'WEEKLY_OFFER' | 'FULLSCREEN_AD';

export interface Banner {
    id: string;
    type: BannerType;
    title: string;
    subtitle?: string;
    imageUrl: string;
    discountText?: string;
    couponCode?: string;
    themeClass: string;
    isActive: boolean;
}

export enum View {
  HOME = 'HOME',
  CART = 'CART',
  CHECKOUT = 'CHECKOUT',
  ORDERS = 'ORDERS',
  PROFILE = 'PROFILE',
  PRODUCT_DETAIL = 'PRODUCT_DETAIL',
  ORDER_TRACKING = 'ORDER_TRACKING',
  WALLET = 'WALLET',
  WISHLIST = 'WISHLIST',
  SUPPORT = 'SUPPORT',
  NOTIFICATIONS = 'NOTIFICATIONS',
  SECURITY = 'SECURITY',
  PAYMENT = 'PAYMENT',
  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS',
  CONTACT_US = 'CONTACT_US',
}
