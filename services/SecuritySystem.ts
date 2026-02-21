
import { SecurityLog } from '../types';

/**
 * Global Security & Analysis System
 * Monitors traffic, detects threats, and manages system integrity.
 */
export const SecuritySystem = {
    
    // In-memory logs buffer (flushed to store periodically)
    logsBuffer: [] as SecurityLog[],

    createLog: (level: 'INFO' | 'WARN' | 'CRITICAL', event: string, userId?: string): SecurityLog => {
        const ipPart = Math.floor(Math.random() * 255);
        return {
            id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            level,
            event,
            ip: `192.168.1.${ipPart}`, // Simulated Client IP
            userId,
            timestamp: Date.now(),
            resolved: level === 'INFO'
        };
    },

    /**
     * Pattern Analysis to detect anomalies
     */
    analyzeTraffic: (recentLogs: SecurityLog[]) => {
        const alerts: SecurityLog[] = [];
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Check for rapid fire requests (DDoS simulation)
        const recentRequests = recentLogs.filter(l => l.timestamp > oneMinuteAgo);
        if (recentRequests.length > 50) {
            alerts.push(SecuritySystem.createLog('CRITICAL', 'High traffic volume detected (Potential DDoS)'));
        }

        return alerts;
    },

    /**
     * Validate Order Integrity (Prevent Price Tampering)
     */
    validateOrderIntegrity: (clientTotal: number, serverCalculatedTotal: number) => {
        const diff = Math.abs(clientTotal - serverCalculatedTotal);
        if (diff > 1.0) { // Allow small float variance
            return {
                valid: false,
                log: SecuritySystem.createLog('CRITICAL', `Price Tampering Detected. Client: ${clientTotal}, Server: ${serverCalculatedTotal}`)
            };
        }
        return { valid: true };
    }
};
