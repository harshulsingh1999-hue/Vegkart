
import { Order, Product, Address, InventoryRule } from './types';

// Currency formatter
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// Check if URL is a video
export const isVideo = (url: string | undefined): boolean => {
    if (!url) return false;
    return !!(url.match(/\.(mp4|webm|ogg)$/i) || url.includes('video'));
};

// Time ago function
export const timeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

// Generate a 4-digit OTP
export const generateOtp = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

export const checkDateFilter = (dateStr: string, filter: string): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  
  switch(filter) {
    case 'Today':
      return date.toDateString() === now.toDateString();
    case 'Yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return date.toDateString() === yesterday.toDateString();
    case 'Last 7 Days':
      const last7 = new Date(now);
      last7.setDate(now.getDate() - 7);
      return date >= last7;
    case 'This Month':
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    case 'Last Month':
       const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
       const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
       return date >= lastMonth && date <= endLastMonth;
    case 'Last 3 Months':
       const last3 = new Date(now);
       last3.setMonth(now.getMonth() - 3);
       return date >= last3;
    case 'Last 6 Months':
       const last6 = new Date(now);
       last6.setMonth(now.getMonth() - 6);
       return date >= last6;
    case 'Last 1 Year':
       const lastYear = new Date(now);
       lastYear.setFullYear(now.getFullYear() - 1);
       return date >= lastYear;
    default: // All Time
      return true;
  }
};

// Original formatted date (includes time)
export const getFormattedDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// Explicit Date Only
export const getDateOnly = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
};

// Explicit Time Only
export const getTimeOnly = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
    });
};

// Week Name / Number
export const getWeekName = (dateStr: string) => {
    const d = new Date(dateStr);
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `Week ${weekNumber}`;
};

// Month Year
export const getMonthYear = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

// --- ROUTE OPTIMIZATION UTILS ---

// Haversine formula to calculate distance (in km) between two points
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Mock Coordinate Generator (Deterministic based on ID string to keep positions stable)
export const generateMockCoordinates = (id: string, baseLat = 19.0760, baseLng = 72.8777) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate random offset within ~5km
  const latOffset = (Math.sin(hash) * 0.05); 
  const lngOffset = (Math.cos(hash) * 0.05);
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
};

/**
 * Nearest Neighbor Algorithm
 * Sorts orders such that Order[i+1] is the closest geographically to Order[i].
 * This creates a route chain: 1st -> Closest to 1st -> Closest to 2nd -> ...
 */
export const optimizeRoute = (orders: Order[]): Order[] => {
  if (orders.length <= 1) return orders;

  // Ensure orders have coords (Mocking them if missing for the demo)
  const ordersWithCoords = orders.map(o => {
    if (o.deliveryAddress.coordinates) return o;
    // Mock coordinates based on pincode/id if missing
    return {
      ...o,
      deliveryAddress: {
        ...o.deliveryAddress,
        coordinates: generateMockCoordinates(o.id)
      }
    };
  });

  const sorted: Order[] = [ordersWithCoords[0]]; // Start with the first order
  const remaining = [...ordersWithCoords.slice(1)];

  while (remaining.length > 0) {
    const current = sorted[sorted.length - 1];
    const currentCoords = current.deliveryAddress.coordinates!;

    let nearestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const candidateCoords = candidate.deliveryAddress.coordinates!;
      
      const dist = getDistance(
        currentCoords.lat, currentCoords.lng,
        candidateCoords.lat, candidateCoords.lng
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    if (nearestIndex !== -1) {
      sorted.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    } else {
      // Fallback
      sorted.push(remaining.shift()!);
    }
  }

  return sorted;
};

// --- REGIONAL INVENTORY RESOLVER ---
// This function implements the Geo-Inventory logic for the User Side.
// It checks InventoryRules to see if there is a specific price/stock for the user's location.
export const resolveRegionalPrice = (product: Product, variantId: string, address: Address | null) => {
    const variant = product.variants.find(v => v.id === variantId);
    
    // Default fallback if variant or product is missing
    if (!variant) return { price: 0, stock: 0, discount: 0, weight: 'N/A' };

    // Default values from Base Variant
    let result = { 
        price: variant.price, 
        stock: variant.stock, 
        discount: variant.discount || 0, 
        weight: variant.weight 
    };

    // If no address selected or no specific rules, return base values
    if (!address || !product.inventoryRules || product.inventoryRules.length === 0) {
        return result;
    }

    // Filter rules for this specific variant
    const rules = product.inventoryRules.filter(r => r.variantId === variantId);
    
    // Hierarchy Check: PINCODE > CITY > STATE
    
    // 1. Check Specific Pincode
    const pinRule = rules.find(r => r.scope === 'PINCODE' && r.locationName === address.pincode);
    if (pinRule) {
        return { price: pinRule.price, stock: pinRule.stock, discount: pinRule.discount, weight: variant.weight };
    }

    // 2. Check City
    const cityRule = rules.find(r => r.scope === 'CITY' && r.locationName.toLowerCase() === address.city.toLowerCase());
    if (cityRule) {
        return { price: cityRule.price, stock: cityRule.stock, discount: cityRule.discount, weight: variant.weight };
    }

    // 3. Check State
    const stateRule = rules.find(r => r.scope === 'STATE' && r.locationName.toLowerCase() === address.state.toLowerCase());
    if (stateRule) {
        return { price: stateRule.price, stock: stateRule.stock, discount: stateRule.discount, weight: variant.weight };
    }

    // No rules matched user location -> Return default base pricing
    return result;
};
