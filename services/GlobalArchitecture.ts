
/**
 * Global Architecture Service
 * Handles application-wide concerns: Telemetry, Feature Flags, and Regional Config.
 */

export interface LogEvent {
    id: string;
    timestamp: number;
    event: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
    metadata?: any;
    latency?: number;
}

class TelemetrySystem {
    private logs: LogEvent[] = [];
    private region: string = 'IND-MUM-1'; // Default simulated region

    log(event: string, level: LogEvent['level'] = 'INFO', metadata?: any) {
        const entry: LogEvent = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: Date.now(),
            event,
            level,
            metadata
        };
        // Keep last 100 logs
        this.logs = [entry, ...this.logs].slice(0, 100);
        
        if (level === 'ERROR' || level === 'FATAL') {
            console.error(`[Telemetry] ${event}`, metadata);
        }
    }

    measure(name: string, fn: () => void) {
        const start = performance.now();
        try {
            fn();
        } finally {
            const end = performance.now();
            this.log(name, 'INFO', { duration: `${(end - start).toFixed(2)}ms` });
        }
    }

    getLogs() {
        return this.logs;
    }

    getRegion() {
        return this.region;
    }
}

class FeatureFlagSystem {
    private flags = {
        enableNewCheckout: true,
        enableAIRecommendations: false,
        maintenanceMode: false,
        highTrafficMode: false,
        debugLogging: true
    };

    getAllFlags() {
        return this.flags;
    }

    setFlag(key: keyof typeof this.flags, value: boolean) {
        this.flags[key] = value;
        telemetry.log('FEATURE_FLAG_CHANGE', 'WARN', { key, value });
    }

    isEnabled(key: keyof typeof this.flags) {
        return this.flags[key];
    }
}

export const telemetry = new TelemetrySystem();
export const featureFlags = new FeatureFlagSystem();
