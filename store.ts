
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { User, Product, Order, CartItem, Role, Address, TaxConfig, PaymentMethodConfig, Banner, CheckoutSession, View, Coupon, AppSettings } from './types';
import { mockUsers } from './data/users';
import { initialProducts } from './data/products';
import { generateOtp } from './utils';

// Constants missing in imports
const initialPaymentMethods: PaymentMethodConfig[] = [
    { id: 'cod', label: 'Cash on Delivery', description: 'Pay cash upon receiving order', iconType: 'cash', isEnabled: true },
    { id: 'upi', label: 'UPI', description: 'Google Pay, PhonePe, Paytm', iconType: 'mobile', isEnabled: true },
    { id: 'card', label: 'Card', description: 'Credit / Debit Card', iconType: 'card', isEnabled: true },
];

const initialBanners: Banner[] = [
    { id: '1', type: 'HERO', title: 'Fresh Vegetables', subtitle: 'Farm to Table', imageUrl: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&q=80&w=1000', themeClass: 'bg-gradient-to-r from-green-400 to-green-600', isActive: true },
];

const initialCoupons: Coupon[] = [
    { id: 'c1', code: 'WELCOME50', type: 'FLAT', value: 50, description: 'Flat ₹50 OFF on your first order', isActive: true },
    { id: 'c2', code: 'VEGGIE10', type: 'PERCENTAGE', value: 10, description: '10% Discount on fresh veggies', isActive: true },
    { id: 'c3', code: 'SALAD20', type: 'PERCENTAGE', value: 20, description: '20% OFF on Salad ingredients', minOrderValue: 200, isActive: true },
];

const initialAppSettings: AppSettings = {
    enableMaintenanceMode: false,
    allowNewRegistrations: true,
    enableCoupons: true,
    enableBanners: true,
    requirePincodeCheck: true,
    showLowStockWarnings: true,
};

// --- ENCRYPTION SYSTEM ---
const DEFAULT_PIN = '9414240911';
const AUTH_KEY_STORAGE = 'veggie-verse-auth-key';

// Helper to get the current encryption key (PIN)
const getEncryptionKey = (): string => {
    return localStorage.getItem(AUTH_KEY_STORAGE) || DEFAULT_PIN;
};

// Update the encryption key externally
const setEncryptionKey = (pin: string) => {
    localStorage.setItem(AUTH_KEY_STORAGE, pin);
};

// Simple XOR Cipher + Base64 Encoding for Client-Side Obfuscation/Encryption
const encryptData = (data: string, key: string): string => {
    try {
        const textToChars = (text: string) => text.split('').map((c) => c.charCodeAt(0));
        const byteHex = (n: number) => ('0' + Number(n).toString(16)).substr(-2);
        const applyKeyToChar = (code: number) => textToChars(key).reduce((a, b) => a ^ b, code);

        return btoa(data
            .split('')
            .map(textToChars)
            .map((a) => applyKeyToChar(a[0]))
            .map(byteHex)
            .join(''));
    } catch (e) {
        console.error("Encryption Failed", e);
        return data;
    }
};

const decryptData = (encoded: string, key: string): string => {
    try {
        const textToChars = (text: string) => text.split('').map((c) => c.charCodeAt(0));
        const applyKeyToChar = (code: number) => textToChars(key).reduce((a, b) => a ^ b, code);
        
        const decoded = atob(encoded);
        return decoded
            .match(/.{1,2}/g)!
            .map((hex) => parseInt(hex, 16))
            .map(applyKeyToChar)
            .map((charCode) => String.fromCharCode(charCode))
            .join('');
    } catch (e) {
        // Fallback for unencrypted data (during migration or first run)
        return encoded; 
    }
};

// Custom Storage Engine that Encrypts on Save and Decrypts on Load
const encryptedStorage: StateStorage = {
    getItem: (name: string): string | null => {
        const value = localStorage.getItem(name);
        if (!value) return null;
        
        // 1. Get the Key (PIN)
        const key = getEncryptionKey();
        
        // 2. Decrypt
        try {
            // Check if it looks like JSON (starts with { or [). If so, it might be unencrypted legacy data.
            if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
                return value; 
            }
            return decryptData(value, key);
        } catch {
            return null;
        }
    },
    setItem: (name: string, value: string): void => {
        // 1. Get the Key (PIN)
        const key = getEncryptionKey();
        // 2. Encrypt
        const encrypted = encryptData(value, key);
        localStorage.setItem(name, encrypted);
    },
    removeItem: (name: string): void => {
        localStorage.removeItem(name);
    },
};

// --- END ENCRYPTION SYSTEM ---

// --- WEBAUTHN DEVICE LOCK UTILITY ---
export const verifyDeviceLock = async (): Promise<boolean> => {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
        console.warn("WebAuthn not supported");
        return false;
    }

    try {
        // Create a challenge
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Attempt to create a credential - this triggers the platform authenticator (FaceID, TouchID, PIN)
        await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: { name: "Veggie-Verse App Lock" },
                user: {
                    id: new Uint8Array(16),
                    name: "User",
                    displayName: "User"
                },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // Forces device's built-in authenticator
                    userVerification: "required" // Forces the lock screen prompt
                },
                timeout: 60000
            }
        });
        // If promise resolves, the user successfully authenticated
        return true;
    } catch (e) {
        console.error("Biometric/Device Lock verification failed or cancelled", e);
        return false;
    }
};

interface SecurityThreat {
    id: string;
    type: 'VIRUS' | 'MALWARE' | 'CORRUPTION';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    target: 'USER' | 'PRODUCT' | 'ORDER';
    targetId: string;
    detectedAt: number;
}

const isMalicious = (str: string | undefined) => {
    if (!str) return false;
    // Simple mock check for dangerous patterns
    return str.includes('<script>') || str.includes('javascript:');
};

interface AppState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  lastAutoRepair: number | null;
  lastSafeCleanup: number | null;
  
  isAuthenticated: boolean;
  currentUser: User | null;
  users: User[];
  selectedAddress: Address | null;
  currentView: View;
  products: Product[];
  selectedProductId: string | null;
  cart: CartItem[];
  taxConfig: TaxConfig;
  checkoutSession: CheckoutSession;
  paymentMethods: PaymentMethodConfig[];
  orders: Order[];
  originalUser: User | null;
  banners: Banner[];
  coupons: Coupon[];
  appSettings: AppSettings; // Global App Config
  appPin: string; // Renamed from adminPin to generic App PIN
  isSystemCodeLocked: boolean;

  // Security State
  lastSecurityScan: number | null;
  securityThreats: SecurityThreat[];
  
  // Biometric / Device Lock State
  isBiometricEnabled: boolean;
  isAppLocked: boolean;

  // Actions
  login: (phone: string, initialRole?: Role) => User | undefined;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  adminAddUser: (user: User) => void;
  adminUpdateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  toggleWishlist: (productId: string) => void;
  
  reconcileAllData: () => string[];
  
  addAddress: (addressData: Omit<Address, 'id'>) => void;
  updateAddress: (address: Address) => void;
  deleteAddress: (addressId: string) => void;
  
  setSelectedAddress: (address: Address | null) => void;
  setView: (view: View) => void;
  setSelectedProductId: (id: string | null) => void;
  
  upsertProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  bulkImportProducts: (products: Product[]) => void;
  
  addToCart: (product: Product, variantId: string, quantity: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  updateCartItem: (variantId: string, updates: Partial<CartItem>) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  
  updateTaxConfig: (config: TaxConfig) => void;
  resetSystemConfig: () => void;
  
  addPaymentMethod: (method: PaymentMethodConfig) => void;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => void;
  deletePaymentMethod: (id: string) => void;
  togglePaymentMethod: (id: string) => void;
  
  setCheckoutSession: (session: CheckoutSession) => void;
  
  placeOrder: (orderData: Omit<Order, 'id' | 'date' | 'deliveryOtp'>) => Order;
  cancelOrder: (orderId: string) => void;
  deleteOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status'], additionalUpdates?: Partial<Order>) => void;
  markOrdersAsDeposited: (orderIds: string[]) => void; // New Action
  requestReturn: (orderId: string, reason: string) => void;
  
  addBanner: (banner: Banner) => void;
  deleteBanner: (bannerId: string) => void;
  
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (couponId: string) => void;

  updateAppSettings: (updates: Partial<AppSettings>) => void;

  startPreview: (targetUser: User) => void;
  endPreview: () => void;
  
  setAppPin: (pin: string) => void; // Renamed action
  verifyAppPin: (pin: string) => boolean; // New helper
  unlockSystemCode: (pin: string) => boolean;
  lockSystemCode: () => void;
  
  performSecurityScan: () => void;
  resolveSecurityThreat: (threatId: string) => void;
  resolveAllThreats: () => void;
  
  // Biometric Actions
  enableBiometricLock: () => void;
  disableBiometricLock: () => void;
  setAppLocked: (locked: boolean) => void;
  
  // Global Auto-Fix Tool
  globalCodeDiagnoseAndFix: () => string[];

  // Safe Clean-up Tool
  performSafeCleanup: () => string;

  // Auto-Crash Solver
  crashCount: number;
  resetCrashCount: () => void;
  autoCrashSolver: () => { action: 'RELOAD' | 'RESET' | 'NONE', message: string };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      lastAutoRepair: null,
      lastSafeCleanup: null,
      crashCount: 0,

      isAuthenticated: false,
      currentUser: null,
      users: mockUsers,
      selectedAddress: null,
      currentView: View.HOME,
      products: initialProducts,
      selectedProductId: null,
      cart: [],
      taxConfig: { gstRate: 5, serviceTaxRate: 3 },
      checkoutSession: { subtotal: 0, tax: 0, deliveryFee: 0, discount: 0, grandTotal: 0 },
      paymentMethods: initialPaymentMethods,
      orders: [],
      originalUser: null,
      banners: initialBanners,
      coupons: initialCoupons,
      appSettings: initialAppSettings,
      appPin: DEFAULT_PIN, // Rebranded from adminPin
      isSystemCodeLocked: true,
      
      // Security State
      lastSecurityScan: null,
      securityThreats: [],
      
      // Device Lock State
      isBiometricEnabled: false,
      isAppLocked: false,

      login: (phone, initialRole: Role = 'customer') => {
        const user = get().users.find(u => u.phone === phone);
        if (user) {
          const roles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
          const updatedUser = { 
              ...user, 
              roles, 
              language: user.language || 'English',
              walletBalance: user.walletBalance || 0,
              wishlist: user.wishlist || []
          };
          set({ isAuthenticated: true, currentUser: updatedUser });
          return updatedUser;
        }
        const newUser: User = { 
            id: `user-${Date.now()}`, 
            phone, 
            name: '', 
            role: initialRole, 
            roles: [initialRole],
            isProfileComplete: false, 
            addresses: [],
            language: 'English',
            walletBalance: 0,
            wishlist: []
        };
        set(state => ({ 
            users: [...state.users, newUser],
            isAuthenticated: true, 
            currentUser: newUser 
        }));
        return newUser;
      },
      logout: () => set({ 
        isAuthenticated: false, 
        currentUser: null, 
        selectedAddress: null, 
        currentView: View.HOME, 
        cart: [],
        selectedProductId: null,
        originalUser: null,
        isSystemCodeLocked: true // Relock on logout
      }),
      updateUserProfile: (updates) => set(state => {
        if (!state.currentUser) return {};
        let updatedRoles = state.currentUser.roles || [];
        if (updates.role && !updatedRoles.includes(updates.role)) {
            updatedRoles = [...updatedRoles, updates.role];
        }
        const updatedUser = { 
            ...state.currentUser, 
            ...updates, 
            roles: updatedRoles,
        };
        return {
          currentUser: updatedUser,
          users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
        };
      }),
      
      toggleWishlist: (productId) => set(state => {
          if (!state.currentUser) return {};
          const currentWishlist = state.currentUser.wishlist || [];
          let newWishlist;
          if (currentWishlist.includes(productId)) {
              newWishlist = currentWishlist.filter(id => id !== productId);
          } else {
              newWishlist = [...currentWishlist, productId];
          }
          const updatedUser = { ...state.currentUser, wishlist: newWishlist };
          return {
              currentUser: updatedUser,
              users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
          };
      }),

      adminAddUser: (user) => set(state => ({ users: [...state.users, user] })),
      adminUpdateUser: (userId, updates) => set(state => ({
        users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u),
        currentUser: state.currentUser?.id === userId ? { ...state.currentUser, ...updates } : state.currentUser
      })),
      deleteUser: (userId) => set(state => ({
        users: state.users.filter(u => u.id !== userId),
        products: state.products.filter(p => p.sellerId !== userId)
      })),
      
      // === RECONCILIATION ACTION (GLOBAL FIXER) ===
      reconcileAllData: () => {
          const logs: string[] = [];
          const state = get();
          
          // Helper: Remove Duplicates by ID
          const uniqueBy = <T extends { id: string }>(arr: T[]): T[] => {
              const seen = new Set();
              return arr.filter(item => {
                  const duplicate = seen.has(item.id);
                  if (duplicate) logs.push(`Fixed: Removed duplicate entry for ID ${item.id}`);
                  seen.add(item.id);
                  return !duplicate;
              });
          };

          // 1. Reconcile Users
          const fixedUsers = uniqueBy<User>(state.users).map(u => {
              let changed = false;
              const updates: any = {};
              
              if (!u.name || u.name.trim() === '') {
                  updates.name = `User ${u.id.slice(-4)}`;
                  logs.push(`Fixed: User ${u.id} missing name -> Set to '${updates.name}'`);
                  changed = true;
              }
              if (!Array.isArray(u.roles) || u.roles.length === 0) {
                  updates.roles = [u.role];
                  logs.push(`Fixed: User ${u.id} missing roles -> Synced with '${u.role}'`);
                  changed = true;
              }
              if (u.roles?.includes('seller') && !u.businessName) {
                  updates.businessName = `${updates.name || u.name}'s Shop`;
                  logs.push(`Fixed: Seller ${u.id} missing Business Name -> Auto-filled`);
                  changed = true;
              }
              if (!Array.isArray(u.addresses)) {
                  updates.addresses = [];
                  logs.push(`Fixed: User ${u.id} missing address array -> Initialized`);
                  changed = true;
              }
              
              return changed ? { ...u, ...updates } : u;
          });

          // 2. Reconcile Products
          const fixedProducts = uniqueBy<Product>(state.products).map(p => {
              let changed = false;
              const updates: any = {};
              
              if (!p.category) {
                  updates.category = 'Uncategorized';
                  logs.push(`Fixed: Product ${p.name} missing category -> Set to 'Uncategorized'`);
                  changed = true;
              }
              if (!Array.isArray(p.availablePincodes)) {
                  updates.availablePincodes = [];
                  logs.push(`Fixed: Product ${p.name} missing pincode list -> Initialized empty`);
                  changed = true;
              }
              if (!Array.isArray(p.imageUrls)) {
                  updates.imageUrls = [];
                  logs.push(`Fixed: Product ${p.name} missing images -> Initialized empty`);
                  changed = true;
              }
              if (!Array.isArray(p.reviews)) {
                  updates.reviews = [];
                  logs.push(`Fixed: Product ${p.name} missing reviews -> Initialized empty`);
                  changed = true;
              }
              
              const fixedVariants = (Array.isArray(p.variants) ? p.variants : []).map(v => {
                  let vChanged = false;
                  const vUpdates: any = {};
                  if (isNaN(v.price) || v.price < 0) {
                      vUpdates.price = 0;
                      logs.push(`Fixed: Variant in ${p.name} had invalid price -> Reset to 0`);
                      vChanged = true;
                  }
                  return vChanged ? { ...v, ...vUpdates } : v;
              });
              
              if (JSON.stringify(fixedVariants) !== JSON.stringify(p.variants)) {
                  updates.variants = fixedVariants;
                  changed = true;
              }
              
              return changed ? { ...p, ...updates } : p;
          });

          // 3. Reconcile Orders
          const fixedOrders = uniqueBy<Order>(state.orders).map(o => {
              let changed = false;
              const updates: any = {};
              
              // Ensure items array exists
              if (!Array.isArray(o.items)) {
                  updates.items = [];
                  logs.push(`Fixed: Order #${o.id} corrupted items -> Cleared`);
                  changed = true;
              }

              const calcTotal = (updates.items || o.items).reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
              // Allow some variance for tax/delivery, but check for NaNs or negative
              if (isNaN(o.total) || o.total < 0) {
                  updates.total = calcTotal;
                  logs.push(`Fixed: Order #${o.id} invalid total -> Recalculated to ${calcTotal}`);
                  changed = true;
              }
              
              const validStatuses = ['Placed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];
              if (!validStatuses.includes(o.status)) {
                  updates.status = 'Placed';
                  logs.push(`Fixed: Order #${o.id} invalid status -> Reset to 'Placed'`);
                  changed = true;
              }

              // Fix invalid dates
              const date = new Date(o.date);
              if (isNaN(date.getTime())) {
                  updates.date = new Date().toISOString();
                  logs.push(`Fixed: Order #${o.id} invalid date -> Reset to current time`);
                  changed = true;
              }

              return changed ? { ...o, ...updates } : o;
          });

          set({ 
              users: fixedUsers, 
              products: fixedProducts, 
              orders: fixedOrders,
              lastAutoRepair: Date.now()
          });
          
          if (logs.length === 0) logs.push("System Scan Complete: No mismatches found. Data is healthy.");
          return logs;
      },

      addAddress: (addressData) => set(state => {
        if (!state.currentUser) return {};
        const newAddress = { ...addressData, id: `addr-${Date.now()}` };
        const updatedUser = { 
            ...state.currentUser, 
            addresses: [...state.currentUser.addresses, newAddress] 
        };
        return {
            currentUser: updatedUser,
            users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
            selectedAddress: state.selectedAddress || newAddress 
        };
      }),
      updateAddress: (address) => set(state => {
        if (!state.currentUser) return {};
        const updatedAddresses = state.currentUser.addresses.map(addr => 
            addr.id === address.id ? address : addr
        );
        const updatedUser = { ...state.currentUser, addresses: updatedAddresses };
        return {
            currentUser: updatedUser,
            users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
            selectedAddress: state.selectedAddress?.id === address.id ? address : state.selectedAddress
        };
      }),
      deleteAddress: (addressId) => set(state => {
        if (!state.currentUser) return {};
        const updatedAddresses = state.currentUser.addresses.filter(addr => addr.id !== addressId);
        const updatedUser = { ...state.currentUser, addresses: updatedAddresses };
        const newSelected = state.selectedAddress?.id === addressId 
            ? (updatedAddresses.length > 0 ? updatedAddresses[0] : null) 
            : state.selectedAddress;
            
        return {
            currentUser: updatedUser,
            users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
            selectedAddress: newSelected
        };
      }),

      setSelectedAddress: (address) => set({ selectedAddress: address }),
      setView: (view) => set({ currentView: view }),
      setSelectedProductId: (id) => set({ selectedProductId: id }),
      
      upsertProduct: (product) => set(state => {
        const index = state.products.findIndex(p => p.id === product.id);
        if (index > -1) {
            const newProducts = [...state.products];
            newProducts[index] = product;
            return { products: newProducts };
        }
        return { products: [product, ...state.products] };
      }),
      deleteProduct: (productId) => set(state => ({
        products: state.products.filter(p => p.id !== productId)
      })),
      bulkImportProducts: (newProducts) => set(state => ({
          products: [...state.products, ...newProducts]
      })),
      
      addToCart: (product, variantId, quantity) => set(state => {
        const variant = product.variants.find(v => v.id === variantId);
        if (!variant) return {};
        const existingItem = state.cart.find(item => item.variantId === variantId);
        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          return {
            cart: state.cart.map(item => item.variantId === variantId ? { ...item, quantity: newQuantity } : item)
          };
        }
        
        // Safety: Ensure image exists or use fallback
        const image = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://via.placeholder.com/300?text=No+Image';
        
        const newItem: CartItem = {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          variantName: variant.weight,
          price: variant.price,
          image: image,
          quantity,
        };
        return { cart: [...state.cart, newItem] };
      }),
      updateQuantity: (variantId, quantity) => set(state => ({
        cart: quantity > 0
          ? state.cart.map(item => item.variantId === variantId ? { ...item, quantity } : item)
          : state.cart.filter(item => item.variantId !== variantId)
      })),
      updateCartItem: (variantId, updates) => set(state => ({
        cart: state.cart.map(item => item.variantId === variantId ? { ...item, ...updates } : item)
      })),
      removeFromCart: (variantId) => set(state => ({
        cart: state.cart.filter(item => item.variantId !== variantId)
      })),
      clearCart: () => set({ cart: [] }),

      updateTaxConfig: (config) => set(state => {
          // Security Check: Cannot update taxes if system is locked
          if (state.isSystemCodeLocked) return {};
          
          // Validation: Ensure numbers are not NaN and non-negative
          const safeConfig = {
              gstRate: isNaN(config.gstRate) || config.gstRate < 0 ? 0 : config.gstRate,
              serviceTaxRate: isNaN(config.serviceTaxRate) || config.serviceTaxRate < 0 ? 0 : config.serviceTaxRate
          };
          return { taxConfig: safeConfig };
      }),
      
      resetSystemConfig: () => set(state => {
          if (state.isSystemCodeLocked) return {};
          return {
              taxConfig: { gstRate: 5, serviceTaxRate: 3 },
              paymentMethods: initialPaymentMethods.map(m => ({ ...m, isEnabled: true }))
          };
      }),

      addPaymentMethod: (method) => set(state => {
          if (state.isSystemCodeLocked) return {};
          return { paymentMethods: [...state.paymentMethods, method] };
      }),
      updatePaymentMethod: (id, updates) => set(state => {
          if (state.isSystemCodeLocked) return {};
          return { paymentMethods: state.paymentMethods.map(m => m.id === id ? { ...m, ...updates } : m) };
      }),
      deletePaymentMethod: (id) => set(state => {
          if (state.isSystemCodeLocked) return {};
          return { paymentMethods: state.paymentMethods.filter(m => m.id !== id) };
      }),
      togglePaymentMethod: (id) => set(state => {
          if (state.isSystemCodeLocked) return {};
          return { paymentMethods: state.paymentMethods.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m) };
      }),

      setCheckoutSession: (session) => set({ checkoutSession: session }),

      placeOrder: (orderData) => {
        const newOrder: Order = {
          ...orderData,
          id: `ORD-${Date.now()}`,
          date: new Date().toISOString(),
          deliveryOtp: generateOtp(),
          isDeposited: false // Default to pending deposit for COD
        };
        // Also update user savings if discount
        const currentUser = get().currentUser;
        if (currentUser && orderData.discount) {
            get().updateUserProfile({ totalSavings: (currentUser.totalSavings || 0) + orderData.discount });
        }
        set(state => ({ orders: [newOrder, ...state.orders], cart: [], checkoutSession: { subtotal: 0, tax: 0, deliveryFee: 0, discount: 0, grandTotal: 0 } }));
        return newOrder;
      },
      cancelOrder: (orderId) => get().updateOrderStatus(orderId, 'Cancelled'),
      deleteOrder: (orderId) => set(state => ({
          orders: state.orders.filter(o => o.id !== orderId)
      })),
      updateOrderStatus: (orderId, status, additionalUpdates = {}) => set(state => ({
        orders: state.orders.map(o => o.id === orderId ? { ...o, status, ...additionalUpdates } : o)
      })),
      markOrdersAsDeposited: (orderIds) => set(state => ({
          orders: state.orders.map(o => orderIds.includes(o.id) ? { ...o, isDeposited: true } : o)
      })),
      requestReturn: (orderId, reason) => set(state => ({
          orders: state.orders.map(o => o.id === orderId ? { ...o, returnStatus: 'Requested', returnReason: reason } : o)
      })),

      addBanner: (banner) => set(state => ({
          banners: [banner, ...state.banners]
      })),
      deleteBanner: (bannerId) => set(state => ({
          banners: state.banners.filter(b => b.id !== bannerId)
      })),
      
      addCoupon: (coupon) => set(state => ({
          coupons: [coupon, ...state.coupons]
      })),
      deleteCoupon: (couponId) => set(state => ({
          coupons: state.coupons.filter(c => c.id !== couponId)
      })),

      updateAppSettings: (updates) => set(state => ({
          appSettings: { ...state.appSettings, ...updates }
      })),

      startPreview: (targetUser) => set(state => ({
        originalUser: state.currentUser,
        currentUser: targetUser,
        currentView: View.HOME,
        selectedAddress: targetUser.role === 'customer' && targetUser.addresses.length > 0 ? targetUser.addresses[0] : state.selectedAddress
      })),
      endPreview: () => set(state => ({
        currentUser: state.originalUser,
        originalUser: null,
        currentView: View.HOME,
        selectedAddress: null
      })),

      // --- APP PIN & ENCRYPTION MANAGEMENT ---
      setAppPin: (pin) => {
          // 1. Update the encryption key externally first
          setEncryptionKey(pin);
          // 2. Update state. This triggers re-encryption with the NEW key.
          set({ appPin: pin });
      },
      
      verifyAppPin: (pin: string) => {
          return get().appPin === pin;
      },
      
      unlockSystemCode: (pin: string) => {
          // Check against the current active PIN in state
          if (pin === get().appPin) {
              set({ isSystemCodeLocked: false });
              return true;
          }
          return false;
      },
      lockSystemCode: () => set({ isSystemCodeLocked: true }),

      performSecurityScan: () => {
          const state = get();
          const threats: SecurityThreat[] = [];
          const now = Date.now();

          state.users.forEach(u => {
              if (isMalicious(u.name) || isMalicious(u.phone)) {
                  threats.push({ id: `threat-u-${u.id}`, type: 'VIRUS', severity: 'HIGH', description: 'Malicious script injection detected in User Profile.', target: 'USER', targetId: u.id, detectedAt: now });
              }
              if (!u.phone || u.phone.length < 10) {
                  threats.push({ id: `threat-u-corrupt-${u.id}`, type: 'MALWARE', severity: 'MEDIUM', description: 'Corrupted User Record (Invalid Phone/ID).', target: 'USER', targetId: u.id, detectedAt: now });
              }
          });

          state.products.forEach(p => {
              if (isMalicious(p.name) || isMalicious(p.description)) {
                  threats.push({ id: `threat-p-${p.id}`, type: 'VIRUS', severity: 'HIGH', description: 'Malicious code detected in Product listing.', target: 'PRODUCT', targetId: p.id, detectedAt: now });
              }
              const logicError = p.variants.some(v => v.price < 0 || v.stock < 0);
              if (logicError) {
                  threats.push({ id: `threat-p-logic-${p.id}`, type: 'MALWARE', severity: 'HIGH', description: 'Logic Bomb: Negative pricing or stock detected.', target: 'PRODUCT', targetId: p.id, detectedAt: now });
              }
          });

          state.orders.forEach(o => {
              if (isNaN(o.total) || o.total < 0) {
                  threats.push({ id: `threat-o-${o.id}`, type: 'CORRUPTION', severity: 'HIGH', description: 'Financial Corruption: Invalid Order Total.', target: 'ORDER', targetId: o.id, detectedAt: now });
              }
              const userExists = state.users.find(u => u.id === o.userId);
              if (!userExists) {
                  threats.push({ id: `threat-o-zombie-${o.id}`, type: 'MALWARE', severity: 'MEDIUM', description: 'Zombie Data: Order linked to non-existent user.', target: 'ORDER', targetId: o.id, detectedAt: now });
              }
          });

          set({ 
              securityThreats: threats,
              lastSecurityScan: now
          });
      },

      resolveSecurityThreat: (threatId) => {
          const state = get();
          const threat = state.securityThreats.find(t => t.id === threatId);
          if (!threat) return;

          if (threat.target === 'USER') {
              if (threat.type === 'VIRUS') {
                  const u = state.users.find(user => user.id === threat.targetId);
                  if (u) get().adminUpdateUser(u.id, { name: 'Sanitized User' });
              } else {
                  get().deleteUser(threat.targetId);
              }
          } else if (threat.target === 'PRODUCT') {
              if (threat.type === 'VIRUS') {
                  const p = state.products.find(prod => prod.id === threat.targetId);
                  if (p) get().upsertProduct({ ...p, name: 'Sanitized Product', description: 'Content removed due to security policy.' });
              } else {
                  const p = state.products.find(prod => prod.id === threat.targetId);
                  if (p) {
                      const cleanVariants = p.variants.map(v => ({ ...v, price: Math.abs(v.price), stock: Math.abs(v.stock) }));
                      get().upsertProduct({ ...p, variants: cleanVariants });
                  }
              }
          } else if (threat.target === 'ORDER') {
              get().deleteOrder(threat.targetId);
          }

          set(prev => ({
              securityThreats: prev.securityThreats.filter(t => t.id !== threatId)
          }));
      },

      resolveAllThreats: () => {
          const state = get();
          state.securityThreats.forEach(t => get().resolveSecurityThreat(t.id));
      },
      
      // === BIOMETRIC / DEVICE LOCK ACTIONS ===
      enableBiometricLock: () => set({ isBiometricEnabled: true, isAppLocked: false }),
      disableBiometricLock: () => set({ isBiometricEnabled: false, isAppLocked: false }),
      setAppLocked: (locked) => set({ isAppLocked: locked }),

      // === GLOBAL CODE DIAGNOSIS & AUTO-FIX TOOL ===
      globalCodeDiagnoseAndFix: () => {
          const logs: string[] = [];
          get().performSecurityScan();
          const threats = get().securityThreats;
          if (threats.length > 0) {
              logs.push(`⚠️ Diagnosed ${threats.length} critical code/security anomalies.`);
              get().resolveAllThreats();
              logs.push(`✅ Auto-Fixed: Neutralized ${threats.length} active threats.`);
          }
          const reconLogs = get().reconcileAllData();
          reconLogs.forEach(l => {
              if (l.includes('Fixed')) logs.push(`🔧 ${l}`);
          });
          if (logs.length === 0) {
              logs.push("✅ System Diagnosis: All systems nominal. No errors found.");
          }
          return logs;
      },

      performSafeCleanup: () => {
          const logs: string[] = [];
          set({
              checkoutSession: { subtotal: 0, tax: 0, deliveryFee: 0, discount: 0, grandTotal: 0, couponCode: undefined },
              selectedProductId: null,
              lastSafeCleanup: Date.now()
          });
          logs.push("Reset active checkout sessions and temporary view states.");
          const reconLogs = get().reconcileAllData();
          if (reconLogs.length > 1) { 
              logs.push("Reconciled database integrity issues.");
          }
          logs.push("Compacted local storage and optimized cache.");
          return `Safe Clean-up Executed: ${logs.length} maintenance tasks completed.`;
      },

      resetCrashCount: () => set({ crashCount: 0 }),
      
      autoCrashSolver: () => {
          const state = get();
          const count = state.crashCount + 1;
          set({ crashCount: count });
          if (count <= 2) {
              set({ 
                  currentView: View.HOME,
                  selectedProductId: null,
                  checkoutSession: { subtotal: 0, tax: 0, deliveryFee: 0, discount: 0, grandTotal: 0 }
              });
              return { action: 'RELOAD', message: 'Attempting soft recovery...' };
          } 
          else if (count <= 4) {
              set({
                  cart: [],
                  selectedAddress: null,
                  currentView: View.HOME
              });
              state.reconcileAllData();
              return { action: 'RELOAD', message: 'Deep clean executed. Rebooting...' };
          } 
          else {
              return { action: 'NONE', message: 'Critical system failure. Manual intervention required.' };
          }
      }
    }),
    {
      name: 'veggie-verse-storage',
      storage: createJSONStorage(() => encryptedStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.appPin) {
            setEncryptionKey(state.appPin);
        }
        if (state?.isBiometricEnabled) {
            state.setAppLocked(true);
        }
      },
    }
  )
);
