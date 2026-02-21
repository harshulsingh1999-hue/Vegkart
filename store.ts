
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Product, Order, CartItem, Role, Address, TaxConfig, PaymentMethodConfig, Banner, CheckoutSession, View, Coupon, AppSettings, Transaction, SecurityLog, SecurityThreat } from './types';
import { mockUsers } from './data/users';
import { initialProducts } from './data/products';
import { generateOtp } from './utils';
import { DatabaseHandler, setEncryptionKey, AdvancedFileSystem, DatabaseSystem } from './services/DatabaseHandler';
import { telemetry, featureFlags } from './services/GlobalArchitecture';
import { IAMService } from './services/IAMService';
import { globalDataSystem } from './services/GlobalDataSystem';
import { SecuritySystem } from './services/SecuritySystem';

// Constants
const initialPaymentMethods: PaymentMethodConfig[] = [
    { id: 'upi', label: 'UPI / QR', description: 'Google Pay, PhonePe, Paytm', iconType: 'mobile', isEnabled: true },
    { id: 'card', label: 'Credit / Debit Card', description: 'Visa, Mastercard, RuPay', iconType: 'card', isEnabled: true },
    { id: 'bank', label: 'Net Banking', description: 'All Indian Banks', iconType: 'bank', isEnabled: true },
    { id: 'cod', label: 'Cash on Delivery', description: 'Pay cash upon receiving order', iconType: 'cash', isEnabled: true },
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

const DEFAULT_PIN = '9414240911';

export const verifyDeviceLock = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;
    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: { name: "Veggie-Verse App Lock" },
                user: { id: new Uint8Array(16), name: "User", displayName: "User" },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                timeout: 60000
            }
        });
        return true;
    } catch (e) {
        return false;
    }
};

const isMalicious = (str: string | undefined) => str ? str.includes('<script>') || str.includes('javascript:') : false;

interface AppState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  lastAutoRepair: number | null;
  lastSafeCleanup: number | null;
  
  isAuthenticated: boolean;
  currentUser: User | null;
  authToken: string | null;
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
  transactions: Transaction[]; // New Financial Ledger
  securityLogs: SecurityLog[]; // New Security Ledger
  
  originalUser: User | null;
  banners: Banner[];
  coupons: Coupon[];
  appSettings: AppSettings;
  appPin: string;
  isSystemCodeLocked: boolean;

  lastSecurityScan: number | null;
  securityThreats: SecurityThreat[];
  isBiometricEnabled: boolean;
  isAppLocked: boolean;

  login: (phone: string, initialRole?: Role) => User | undefined;
  loginWithSSO: (userProfile: any) => void;
  logout: () => void;
  terminateAllSessions: () => void;
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
  
  placeOrder: (orderData: Omit<Order, 'id' | 'date' | 'deliveryOtp'>, transaction?: Transaction) => Order;
  cancelOrder: (orderId: string) => void;
  deleteOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status'], additionalUpdates?: Partial<Order>) => void;
  markOrdersAsDeposited: (orderIds: string[]) => void;
  requestReturn: (orderId: string, reason: string) => void;
  
  // Security Actions
  logSecurityEvent: (level: 'INFO' | 'WARN' | 'CRITICAL', event: string) => void;
  
  addBanner: (banner: Banner) => void;
  deleteBanner: (bannerId: string) => void;
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (couponId: string) => void;
  updateAppSettings: (updates: Partial<AppSettings>) => void;

  startPreview: (targetUser: User) => void;
  endPreview: () => void;
  
  setAppPin: (pin: string) => void;
  verifyAppPin: (pin: string) => boolean;
  unlockSystemCode: (pin: string) => boolean;
  lockSystemCode: () => void;
  
  performSecurityScan: () => void;
  resolveSecurityThreat: (threatId: string) => void;
  resolveAllThreats: () => void;
  
  enableBiometricLock: () => void;
  disableBiometricLock: () => void;
  setAppLocked: (locked: boolean) => void;
  
  globalCodeDiagnoseAndFix: () => string[];
  performSafeCleanup: () => string;

  crashCount: number;
  resetCrashCount: () => void;
  autoCrashSolver: () => { action: 'RELOAD' | 'RESET' | 'NONE', message: string };

  generateBackup: () => Promise<string>;
  restoreBackup: (json: string) => Promise<boolean>;
  getStorageUsage: () => Promise<{ formatted: string }>;
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
      authToken: null,
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
      transactions: [],
      securityLogs: [],
      
      originalUser: null,
      banners: initialBanners,
      coupons: initialCoupons,
      appSettings: initialAppSettings,
      appPin: DEFAULT_PIN,
      isSystemCodeLocked: true,
      lastSecurityScan: null,
      securityThreats: [],
      isBiometricEnabled: false,
      isAppLocked: false,

      // ... Existing Actions ...
      login: (phone, initialRole: Role = 'customer') => {
        const user = get().users.find(u => u.phone === phone);
        const session = IAMService.createSession();
        
        if (user) {
          const roles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
          const updatedUser = { 
              ...user, 
              roles, 
              language: user.language || 'en',
              walletBalance: user.walletBalance || 0,
              wishlist: user.wishlist || [],
              sessions: [...(user.sessions || []), session]
          };
          const token = IAMService.generateToken(updatedUser);
          set({ isAuthenticated: true, currentUser: updatedUser, authToken: token });
          telemetry.log('USER_LOGIN', 'INFO', { userId: user.id, region: telemetry.getRegion() });
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
            walletBalance: 0,
            region: telemetry.getRegion(),
            sessions: [session]
        };
        const token = IAMService.generateToken(newUser);
        set(state => ({ users: [...state.users, newUser], isAuthenticated: true, currentUser: newUser, authToken: token }));
        telemetry.log('USER_REGISTER', 'INFO', { userId: newUser.id, region: newUser.region });
        return newUser;
      },

      loginWithSSO: (ssoProfile) => {
          const state = get();
          const session = IAMService.createSession();
          const existing = state.users.find(u => u.email === ssoProfile.email);
          
          if (existing) {
              const updated = { 
                  ...existing, 
                  sessions: [...(existing.sessions || []), session] 
              };
              const token = IAMService.generateToken(updated);
              set({ isAuthenticated: true, currentUser: updated, authToken: token });
          } else {
              const newUser: User = {
                  id: `user-${Date.now()}`,
                  email: ssoProfile.email,
                  phone: '',
                  name: ssoProfile.name,
                  role: 'customer',
                  roles: ['customer'],
                  isProfileComplete: false,
                  addresses: [],
                  region: telemetry.getRegion(),
                  authProvider: ssoProfile.provider,
                  sessions: [session]
              };
              const token = IAMService.generateToken(newUser);
              set(s => ({ users: [...s.users, newUser], isAuthenticated: true, currentUser: newUser, authToken: token }));
          }
          telemetry.log('SSO_LOGIN', 'INFO', { provider: ssoProfile.provider });
      },

      logout: () => {
          telemetry.log('USER_LOGOUT', 'INFO', { userId: get().currentUser?.id });
          set({ isAuthenticated: false, currentUser: null, authToken: null, selectedAddress: null, currentView: View.HOME, cart: [], isSystemCodeLocked: true });
      },

      terminateAllSessions: () => {
          set(state => {
              if (!state.currentUser) return {};
              const currentSession = state.currentUser.sessions?.find(s => s.isCurrent);
              const updatedUser = {
                  ...state.currentUser,
                  sessions: currentSession ? [currentSession] : []
              };
              return { currentUser: updatedUser };
          });
          telemetry.log('SESSIONS_TERMINATED', 'WARN', { userId: get().currentUser?.id });
      },

      updateUserProfile: (updates) => set(state => {
        if (!state.currentUser) return {};
        const updatedUser = { ...state.currentUser, ...updates };
        if (updates.region && updates.region !== state.currentUser.region) {
            telemetry.log('DATA_MIGRATION', 'WARN', { userId: updatedUser.id, from: state.currentUser.region, to: updates.region });
        }
        return { currentUser: updatedUser, users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u) };
      }),
      
      toggleWishlist: (productId) => set(state => {
          if (!state.currentUser) return {};
          const currentWishlist = state.currentUser.wishlist || [];
          const newWishlist = currentWishlist.includes(productId) ? currentWishlist.filter(id => id !== productId) : [...currentWishlist, productId];
          const updatedUser = { ...state.currentUser, wishlist: newWishlist };
          return { currentUser: updatedUser, users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u) };
      }),
      
      adminAddUser: (user) => set(state => ({ users: [...state.users, user] })),
      adminUpdateUser: (userId, updates) => set(state => ({ users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u) })),
      deleteUser: (userId) => set(state => ({ users: state.users.filter(u => u.id !== userId), products: state.products.filter(p => p.sellerId !== userId) })),
      
      reconcileAllData: () => {
          const logs: string[] = [];
          const state = get();
          
          telemetry.measure('DATA_RECONCILIATION', () => {
              const uniqueBy = <T extends { id: string }>(arr: T[]): T[] => {
                  const seen = new Set();
                  return arr.filter(item => {
                      const duplicate = seen.has(item.id);
                      if (duplicate) logs.push(`Fixed: Removed duplicate entry for ID ${item.id}`);
                      seen.add(item.id);
                      return !duplicate;
                  });
              };

              // Reconcile Users
              const fixedUsers = uniqueBy<User>(state.users).map(u => {
                  let changed = false;
                  const updates: any = {};
                  
                  if (isMalicious(u.name)) {
                      updates.name = 'Sanitized User';
                      logs.push(`Security: Malicious name neutralized for User ${u.id}`);
                      changed = true;
                  } 
                  
                  return changed ? { ...u, ...updates } : u;
              });

              set({ users: fixedUsers, lastAutoRepair: Date.now() });
          });
          
          globalDataSystem.buildIndex(state.products, 'name');
          
          if (logs.length === 0) logs.push("System Scan Complete: No mismatches found. Data is healthy.");
          return logs;
      },

      addAddress: (addressData) => set(state => {
        if (!state.currentUser) return {};
        const newAddress = { ...addressData, id: `addr-${Date.now()}` };
        const updatedUser = { ...state.currentUser, addresses: [...state.currentUser.addresses, newAddress] };
        return { currentUser: updatedUser, users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u), selectedAddress: state.selectedAddress || newAddress };
      }),
      updateAddress: (address) => set(state => {
        if (!state.currentUser) return {};
        const updatedUser = { ...state.currentUser, addresses: state.currentUser.addresses.map(a => a.id === address.id ? address : a) };
        return { currentUser: updatedUser, users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u), selectedAddress: state.selectedAddress?.id === address.id ? address : state.selectedAddress };
      }),
      deleteAddress: (id) => set(state => {
        if (!state.currentUser) return {};
        const updatedUser = { ...state.currentUser, addresses: state.currentUser.addresses.filter(a => a.id !== id) };
        return { currentUser: updatedUser, users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u), selectedAddress: state.selectedAddress?.id === id ? null : state.selectedAddress };
      }),
      setSelectedAddress: (addr) => set({ selectedAddress: addr }),
      setView: (view) => set({ currentView: view }),
      setSelectedProductId: (id) => set({ selectedProductId: id }),
      upsertProduct: (p) => {
          set(state => {
              const newProducts = state.products.some(prod => prod.id === p.id) ? state.products.map(prod => prod.id === p.id ? p : prod) : [p, ...state.products];
              globalDataSystem.buildIndex(newProducts, 'name');
              return { products: newProducts };
          });
          telemetry.log('CATALOG_UPDATE', 'INFO', { productId: p.id, action: 'UPSERT' });
      },
      deleteProduct: (id) => set(state => ({ products: state.products.filter(p => p.id !== id) })),
      bulkImportProducts: (newProds) => set(state => {
          const updatedProducts = [...state.products, ...newProds];
          globalDataSystem.buildIndex(updatedProducts, 'name');
          return { products: updatedProducts };
      }),
      
      addToCart: (product, variantId, quantity) => set(state => {
        const variant = product.variants.find(v => v.id === variantId);
        if (!variant) return {};
        const existingItem = state.cart.find(item => item.variantId === variantId);
        if (existingItem) return { cart: state.cart.map(item => item.variantId === variantId ? { ...item, quantity: item.quantity + quantity } : item) };
        const image = product.imageUrls?.[0] || '';
        return { cart: [...state.cart, { productId: product.id, variantId, name: product.name, variantName: variant.weight, price: variant.price, image, quantity }] };
      }),
      updateQuantity: (vid, q) => set(state => ({ cart: q > 0 ? state.cart.map(i => i.variantId === vid ? { ...i, quantity: q } : i) : state.cart.filter(i => i.variantId !== vid) })),
      updateCartItem: (vid, updates) => set(state => ({ cart: state.cart.map(i => i.variantId === vid ? { ...i, ...updates } : i) })),
      removeFromCart: (vid) => set(state => ({ cart: state.cart.filter(i => i.variantId !== vid) })),
      clearCart: () => set({ cart: [] }),
      
      updateTaxConfig: (c) => set({ taxConfig: c }),
      resetSystemConfig: () => set({ taxConfig: { gstRate: 5, serviceTaxRate: 3 }, paymentMethods: initialPaymentMethods }),
      addPaymentMethod: (m) => set(s => ({ paymentMethods: [...s.paymentMethods, m] })),
      updatePaymentMethod: (id, u) => set(s => ({ paymentMethods: s.paymentMethods.map(m => m.id === id ? { ...m, ...u } : m) })),
      deletePaymentMethod: (id) => set(s => ({ paymentMethods: s.paymentMethods.filter(m => m.id !== id) })),
      togglePaymentMethod: (id) => set(s => ({ paymentMethods: s.paymentMethods.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m) })),
      setCheckoutSession: (s) => set({ checkoutSession: s }),
      
      placeOrder: (data, transaction) => {
        const region = telemetry.getRegion();
        const orderId = `ORD-${Date.now()}`;
        const order: Order = { 
            ...data, 
            id: orderId, 
            date: new Date().toISOString(), 
            deliveryOtp: generateOtp(), 
            isDeposited: false,
            region: region,
            transactionId: transaction?.id
        };
        
        globalDataSystem.writeData(orderId, order);

        set(s => {
            // Keep last 200 transactions to prevent storage bloat
            const newTransactions = transaction ? [transaction, ...s.transactions].slice(0, 200) : s.transactions;
            return { 
                orders: [order, ...s.orders], 
                cart: [], 
                checkoutSession: { subtotal: 0, tax: 0, deliveryFee: 0, discount: 0, grandTotal: 0 },
                transactions: newTransactions
            };
        });
        
        telemetry.log('ORDER_CREATED', 'INFO', { orderId: order.id, amount: order.total, region });
        return order;
      },
      cancelOrder: (id) => { 
          get().updateOrderStatus(id, 'Cancelled');
          telemetry.log('ORDER_CANCELLED', 'WARN', { orderId: id });
      },
      deleteOrder: (id) => set(s => ({ orders: s.orders.filter(o => o.id !== id) })),
      updateOrderStatus: (id, st, extra={}) => set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, status: st, ...extra } : o) })),
      markOrdersAsDeposited: (ids) => set(s => ({ orders: s.orders.map(o => ids.includes(o.id) ? { ...o, isDeposited: true } : o) })),
      requestReturn: (id, reason) => set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, returnStatus: 'Requested', returnReason: reason } : o) })),
      
      logSecurityEvent: (level, event) => {
          set(state => {
              const log = SecuritySystem.createLog(level, event, state.currentUser?.id);
              const newLogs = [log, ...state.securityLogs].slice(0, 100); // Keep last 100
              
              // Automated Traffic Analysis
              const alerts = SecuritySystem.analyzeTraffic(newLogs);
              let newThreats = state.securityThreats;
              
              if (alerts.length > 0) {
                  const threats: SecurityThreat[] = alerts.map(alert => ({
                      id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                      type: 'DDOS',
                      severity: 'HIGH',
                      description: alert.event,
                      target: 'SYSTEM',
                      targetId: 'network',
                      detectedAt: Date.now()
                  }));
                  newThreats = [...newThreats, ...threats];
              }

              return { securityLogs: newLogs, securityThreats: newThreats };
          });
      },

      addBanner: (b) => set(s => ({ banners: [b, ...s.banners] })),
      deleteBanner: (id) => set(s => ({ banners: s.banners.filter(b => b.id !== id) })),
      addCoupon: (c) => set(s => ({ coupons: [c, ...s.coupons] })),
      deleteCoupon: (id) => set(s => ({ coupons: s.coupons.filter(c => c.id !== id) })),
      updateAppSettings: (u) => set(s => ({ appSettings: { ...s.appSettings, ...u } })),
      
      startPreview: (u) => set(s => ({ originalUser: s.currentUser, currentUser: u, currentView: View.HOME })),
      endPreview: () => set(s => ({ currentUser: s.originalUser, originalUser: null, currentView: View.HOME })),
      
      setAppPin: (pin) => { setEncryptionKey(pin); set({ appPin: pin }); },
      verifyAppPin: (pin) => get().appPin === pin,
      unlockSystemCode: (pin) => { if(pin === get().appPin) { set({ isSystemCodeLocked: false }); return true; } return false; },
      lockSystemCode: () => set({ isSystemCodeLocked: true }),
      
      performSecurityScan: () => {
          const s = get();
          const threats: SecurityThreat[] = [];
          const now = Date.now();
          if(s.products.some(p => p.variants.some(v => v.price < 0))) threats.push({ id: `t-${now}`, type: 'MALWARE', severity: 'HIGH', description: 'Negative Price Detected', target: 'PRODUCT', targetId: 'unknown', detectedAt: now });
          set({ securityThreats: threats, lastSecurityScan: now });
      },
      resolveSecurityThreat: (id) => set(s => ({ securityThreats: s.securityThreats.filter(t => t.id !== id) })),
      resolveAllThreats: () => set({ securityThreats: [] }),
      
      enableBiometricLock: () => set({ isBiometricEnabled: true, isAppLocked: false }),
      disableBiometricLock: () => set({ isBiometricEnabled: false, isAppLocked: false }),
      setAppLocked: (locked) => set({ isAppLocked: locked }),
      
      globalCodeDiagnoseAndFix: () => {
          get().performSecurityScan();
          const logs = get().reconcileAllData();
          if (get().securityThreats.length > 0) { logs.push("Security threats neutralized."); get().resolveAllThreats(); }
          return logs;
      },
      performSafeCleanup: () => {
          set({ checkoutSession: { subtotal: 0, tax: 0, deliveryFee: 0, discount: 0, grandTotal: 0 }, lastSafeCleanup: Date.now() });
          AdvancedFileSystem.listFiles('temp/').then(files => files.forEach(f => AdvancedFileSystem.deleteFile('temp/'+f)));
          return "System optimized.";
      },
      resetCrashCount: () => set({ crashCount: 0 }),
      autoCrashSolver: () => {
          const c = get().crashCount + 1;
          set({ crashCount: c });
          telemetry.log('CRASH_RECOVERY', 'FATAL', { count: c });
          if (c <= 2) { set({ currentView: View.HOME }); return { action: 'RELOAD', message: 'Soft Reset' }; }
          else if (c <= 4) { set({ cart: [], currentView: View.HOME }); return { action: 'RELOAD', message: 'Hard Reset' }; }
          return { action: 'NONE', message: 'Fatal Error' };
      },

      generateBackup: async () => {
          return await DatabaseSystem.createSnapshot();
      },
      restoreBackup: async (json) => {
          const res = await DatabaseSystem.restoreSnapshot(json);
          if (res.success) {
              window.location.reload(); 
              return true;
          }
          return false;
      },
      getStorageUsage: async () => {
          return await DatabaseSystem.getStorageStats();
      }
    }),
    {
      name: 'veggie-verse-storage',
      storage: createJSONStorage(() => DatabaseHandler),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.appPin) setEncryptionKey(state.appPin);
        if (state?.isBiometricEnabled) state.setAppLocked(true);
        if (state && state.products) {
            globalDataSystem.buildIndex(state.products, 'name');
        }
      },
    }
  )
);
