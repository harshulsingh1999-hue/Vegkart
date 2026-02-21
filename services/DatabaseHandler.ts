
import { get, set, del, keys, clear } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';

// --- CONSTANTS ---
const DEFAULT_PIN = '9414240911';
const AUTH_KEY_STORAGE = 'veggie-verse-auth-key';
const FILE_PREFIX = 'fs::';
const AUDIT_LOG_KEY = 'sys_audit_log';

// --- ENCRYPTION KERNEL ---
const textToChars = (text: string) => text.split('').map((c) => c.charCodeAt(0));
const byteHex = (n: number) => ('0' + Number(n).toString(16)).substr(-2);
const applyKeyToChar = (code: number, key: string) => textToChars(key).reduce((a, b) => a ^ b, code);

const getEncryptionKey = (): string => {
    return localStorage.getItem(AUTH_KEY_STORAGE) || DEFAULT_PIN;
};

export const setEncryptionKey = (pin: string) => {
    localStorage.setItem(AUTH_KEY_STORAGE, pin);
};

const encryptData = (data: string, key: string): string => {
    try {
        if (!data) return '';
        return btoa(data
            .split('')
            .map(textToChars)
            .map((a) => applyKeyToChar(a[0], key))
            .map(byteHex)
            .join(''));
    } catch (e) {
        console.error("Encryption Kernel Fault", e);
        return data;
    }
};

const decryptData = (encoded: string, key: string): string => {
    try {
        if (!encoded) return '';
        const decoded = atob(encoded);
        return decoded
            .match(/.{1,2}/g)!
            .map((hex) => parseInt(hex, 16))
            .map((code) => applyKeyToChar(code, key))
            .map((charCode) => String.fromCharCode(charCode))
            .join('');
    } catch (e) {
        // Fallback for unencrypted data (migration safe)
        return encoded; 
    }
};

// --- DATABASE HANDLER (Zustand Adapter) ---
export const DatabaseHandler: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            const key = getEncryptionKey();
            const value = await get(name);
            
            if (!value) return null;
            
            // Heuristic: If it looks like JSON, return as is (Legacy/Plaintext support)
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                return value; 
            }
            
            return decryptData(value, key);
        } catch (error) {
            console.error('[DB Handler] Read Error:', error);
            return null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            const key = getEncryptionKey();
            const encrypted = encryptData(value, key);
            await set(name, encrypted);
        } catch (error) {
            console.error('[DB Handler] Write Error:', error);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

// --- ADVANCED DATABASE MANAGEMENT SYSTEM ---
export const DatabaseSystem = {
    /**
     * Calculates approximate usage of the IndexedDB
     */
    getStorageStats: async () => {
        try {
            const allKeys = await keys();
            let totalBytes = 0;
            for (const k of allKeys) {
                const val = await get(k);
                if (val) totalBytes += new Blob([val]).size;
            }
            const kb = (totalBytes / 1024).toFixed(2);
            const mb = (totalBytes / 1024 / 1024).toFixed(2);
            return {
                keys: allKeys.length,
                sizeKB: kb,
                sizeMB: mb,
                formatted: `${mb} MB (${kb} KB)`
            };
        } catch (e) {
            return { keys: 0, sizeKB: '0', sizeMB: '0', formatted: 'Unknown' };
        }
    },

    /**
     * Creates a portable, decrypted JSON snapshot of the entire database.
     * Useful for migration or manual backup.
     */
    createSnapshot: async () => {
        const allKeys = await keys();
        const snapshot: Record<string, any> = {};
        const key = getEncryptionKey();

        for (const k of allKeys) {
            const kStr = k.toString();
            // Skip system locks or non-app keys if any
            if (kStr === 'file-system-lock') continue;

            const rawValue = await get(k);
            
            // Attempt decryption for state keys
            if (typeof rawValue === 'string' && !rawValue.startsWith('{') && !rawValue.startsWith('[') && !kStr.startsWith(FILE_PREFIX)) {
                try {
                    const decrypted = decryptData(rawValue, key);
                    // Verify if it's valid JSON (State usually is)
                    JSON.parse(decrypted); 
                    snapshot[kStr] = decrypted; // Store decrypted
                } catch {
                    snapshot[kStr] = rawValue; // Store raw if decryption fails or not JSON
                }
            } else {
                snapshot[kStr] = rawValue;
            }
        }
        
        const metadata = {
            timestamp: Date.now(),
            version: '1.0.0',
            app: 'Veggie-Verse'
        };

        return JSON.stringify({ metadata, data: snapshot });
    },

    /**
     * Wipes current DB and restores from a snapshot.
     * Re-encrypts data with the CURRENT active key.
     */
    restoreSnapshot: async (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.data || !parsed.metadata) throw new Error("Invalid Backup Format");

            // 1. Wipe existing
            await clear();

            // 2. Restore keys
            const key = getEncryptionKey();
            const entries = Object.entries(parsed.data);

            for (const [k, v] of entries) {
                // Determine if this key needs encryption (State keys usually do)
                // We encrypt everything except Files/Blobs for uniformity in this implementation
                // or specific logic:
                if (k.startsWith(FILE_PREFIX)) {
                    await set(k, v);
                } else if (typeof v === 'string') {
                    // Re-encrypt using current system PIN
                    const encrypted = encryptData(v, key);
                    await set(k, encrypted);
                } else {
                    await set(k, v);
                }
            }
            
            return { success: true, count: entries.length };
        } catch (e) {
            console.error("Restore Failed", e);
            return { success: false, error: e };
        }
    },

    /**
     * Internal Audit Logger
     */
    logEvent: async (action: string, details: string) => {
        const logEntry = {
            ts: Date.now(),
            action,
            details
        };
        // We append to a specific log key, but keep it capped
        const currentLogs = (await get(AUDIT_LOG_KEY)) || [];
        const newLogs = [logEntry, ...(Array.isArray(currentLogs) ? currentLogs : [])].slice(0, 50);
        await set(AUDIT_LOG_KEY, newLogs);
    }
};

// --- FILE SYSTEM ABSTRACTION ---
export const AdvancedFileSystem = {
    // Save a file (Blob or String) to virtual path
    writeFile: async (path: string, content: Blob | string) => {
        try {
            await set(`${FILE_PREFIX}${path}`, content);
            DatabaseSystem.logEvent('FILE_WRITE', path);
            return true;
        } catch (e) {
            console.error(`[File System] Write Failed: ${path}`, e);
            return false;
        }
    },

    // Read a file
    readFile: async (path: string) => {
        return await get(`${FILE_PREFIX}${path}`);
    },

    // Delete a file
    deleteFile: async (path: string) => {
        await del(`${FILE_PREFIX}${path}`);
        DatabaseSystem.logEvent('FILE_DELETE', path);
    },

    // List all files (Virtual Directory Listing)
    listFiles: async (folder: string = '') => {
        const allKeys = await keys();
        return allKeys
            .filter(k => typeof k === 'string' && k.startsWith(`${FILE_PREFIX}${folder}`))
            .map(k => (k as string).replace(FILE_PREFIX, ''));
    },

    // Wipe all files (Factory Reset for Storage)
    formatStorage: async () => {
        const allKeys = await keys();
        const fileKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(FILE_PREFIX));
        await Promise.all(fileKeys.map(k => del(k)));
        DatabaseSystem.logEvent('FS_FORMAT', 'All files wiped');
    }
};
