
import { telemetry } from './GlobalArchitecture';

export interface DataNode {
    id: string;
    region: string;
    role: 'PRIMARY' | 'REPLICA';
    status: 'HEALTHY' | 'DEGRADED' | 'SYNCING' | 'OFFLINE';
    recordCount: number;
    replicationLag: number; // ms
    lastSyncTimestamp: number;
}

export interface SearchIndexItem {
    id: string;
    text: string;
    entity: any;
}

class GlobalDataSystem {
    private nodes: DataNode[] = [
        { id: 'node-mum-01', region: 'IND-MUM-1 (Mumbai)', role: 'PRIMARY', status: 'HEALTHY', recordCount: 1420, replicationLag: 0, lastSyncTimestamp: Date.now() },
        { id: 'node-del-02', region: 'IND-DEL-2 (Delhi)', role: 'REPLICA', status: 'HEALTHY', recordCount: 1418, replicationLag: 45, lastSyncTimestamp: Date.now() - 45000 },
        { id: 'node-blr-01', region: 'IND-BLR-1 (Bangalore)', role: 'REPLICA', status: 'SYNCING', recordCount: 1400, replicationLag: 120, lastSyncTimestamp: Date.now() - 120000 },
        { id: 'node-che-01', region: 'IND-CHE-1 (Chennai)', role: 'REPLICA', status: 'HEALTHY', recordCount: 1419, replicationLag: 55, lastSyncTimestamp: Date.now() - 55000 },
    ];

    private searchIndex: SearchIndexItem[] = [];
    private listeners: Function[] = [];

    constructor() {
        // Start background replication simulation
        setInterval(() => this.simulateReplicationCycle(), 3000);
    }

    public getNodes() {
        return this.nodes;
    }

    public subscribe(listener: Function) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.nodes));
    }

    // Simulate writing data to the grid
    public writeData(recordId: string, payload: any) {
        const primary = this.nodes.find(n => n.role === 'PRIMARY');
        if (primary) {
            primary.recordCount++;
            telemetry.log('DB_WRITE', 'INFO', { nodeId: primary.id, recordId });
            
            // Trigger lag in replicas
            this.nodes.forEach(n => {
                if (n.role === 'REPLICA') {
                    n.status = 'SYNCING';
                    n.replicationLag += Math.floor(Math.random() * 50) + 10;
                }
            });
            this.notify();
        }
    }

    // Background process to sync replicas
    private simulateReplicationCycle() {
        let changed = false;
        const primary = this.nodes.find(n => n.role === 'PRIMARY');
        if (!primary) return;

        this.nodes.forEach(n => {
            if (n.role === 'REPLICA') {
                // Simulate catch-up
                if (n.recordCount < primary.recordCount) {
                    const diff = primary.recordCount - n.recordCount;
                    const catchUpAmount = Math.ceil(diff * 0.5); // Catch up half the difference
                    n.recordCount += catchUpAmount;
                    changed = true;
                }

                // Simulate lag reduction
                if (n.replicationLag > 0) {
                    n.replicationLag = Math.max(0, n.replicationLag - Math.floor(Math.random() * 20));
                    n.lastSyncTimestamp = Date.now();
                    if (n.replicationLag < 10) n.status = 'HEALTHY';
                    changed = true;
                }
            }
        });

        if (changed) this.notify();
    }

    // --- SEARCH ENGINE SIMULATION ---
    
    public buildIndex(items: any[], textField: string) {
        this.searchIndex = items.map(item => ({
            id: item.id,
            text: (item[textField] || '').toLowerCase(),
            entity: item
        }));
        telemetry.log('SEARCH_INDEX_BUILD', 'INFO', { items: items.length });
    }

    public search(query: string): any[] {
        if (!query) return [];
        const q = query.toLowerCase();
        
        // Simple fuzzy match simulation
        return this.searchIndex
            .filter(item => item.text.includes(q))
            .map(item => item.entity);
    }

    public forceReplication() {
        const primary = this.nodes.find(n => n.role === 'PRIMARY');
        if (!primary) return;

        this.nodes.forEach(n => {
            if (n.role === 'REPLICA') {
                n.recordCount = primary.recordCount;
                n.replicationLag = 5; // minimal lag
                n.status = 'HEALTHY';
                n.lastSyncTimestamp = Date.now();
            }
        });
        telemetry.log('MANUAL_SYNC', 'WARN', { initiatedBy: 'ADMIN' });
        this.notify();
    }

    public simulateNetworkPartition() {
        const replicas = this.nodes.filter(n => n.role === 'REPLICA');
        if (replicas.length > 0) {
            const victim = replicas[Math.floor(Math.random() * replicas.length)];
            victim.status = 'OFFLINE';
            victim.replicationLag = 9999;
            telemetry.log('NETWORK_PARTITION', 'FATAL', { nodeId: victim.id });
            this.notify();
        }
    }
}

export const globalDataSystem = new GlobalDataSystem();
