
import { User, Session } from '../types';

/**
 * Identity & Access Management (IAM) Service
 * Simulates enterprise security features:
 * 1. JWT Token Generation
 * 2. Session Tracking
 * 3. OAuth/SSO Providers
 */
export const IAMService = {
    /**
     * Simulates generating a JWT (JSON Web Token)
     */
    generateToken: (user: User) => {
        const payload = { 
            sub: user.id, 
            role: user.role, 
            iat: Date.now(),
            exp: Date.now() + 3600000 // 1 Hour Expiry
        };
        // In a real app, this would be signed by a server secret
        return btoa(JSON.stringify(payload)); 
    },
    
    /**
     * Simulates an external Identity Provider (IdP) login
     */
    mockSSOLogin: async (provider: 'google' | 'apple') => {
        // Simulate network latency for the handshake
        await new Promise(r => setTimeout(r, 1500));
        
        return {
            email: `user_${Math.floor(Math.random()*1000)}@${provider}.com`,
            name: provider === 'google' ? 'Google User' : 'Apple User',
            providerId: `pid_${Date.now()}`,
            provider: provider
        };
    },

    /**
     * Creates a new session object based on client environment
     */
    createSession: (): Session => {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown Browser';
        if(userAgent.indexOf("Chrome") > -1) browser = "Chrome";
        else if(userAgent.indexOf("Safari") > -1) browser = "Safari";
        else if(userAgent.indexOf("Firefox") > -1) browser = "Firefox";

        let device = 'Desktop';
        if(userAgent.match(/Android/i)) device = "Android";
        else if(userAgent.match(/iPhone/i)) device = "iPhone";

        return {
            id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            device: device,
            browser: browser,
            location: 'Mumbai, IN', // Geo-IP Simulation
            ip: `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
            lastActive: Date.now(),
            isCurrent: true
        };
    }
};
