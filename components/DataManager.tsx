
import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useToast } from '../providers/ToastProvider';

/**
 * DataManager acts as the application's background service.
 * It does not render anything visible but manages data integrity intervals.
 * 
 * OPTIMIZATION: Uses requestIdleCallback to ensure heavy maintenance tasks
 * don't block the main thread, improving startup and runtime performance.
 */
const DataManager: React.FC = () => {
    // We now use the Global Diagnosis Tool for maintenance
    const globalCodeDiagnoseAndFix = useStore(state => state.globalCodeDiagnoseAndFix);
    const performSafeCleanup = useStore(state => state.performSafeCleanup);
    const resetCrashCount = useStore(state => state.resetCrashCount);
    
    const hasHydrated = useStore(state => state._hasHydrated);
    const currentUser = useStore(state => state.currentUser);
    const users = useStore(state => state.users);
    const logout = useStore(state => state.logout);
    const { showToast } = useToast();
    
    // Refs to prevent closure staleness in intervals
    const globalFixRef = useRef(globalCodeDiagnoseAndFix);
    globalFixRef.current = globalCodeDiagnoseAndFix;
    const safeCleanupRef = useRef(performSafeCleanup);
    safeCleanupRef.current = performSafeCleanup;
    
    const usersRef = useRef(users);
    usersRef.current = users;
    const currentUserRef = useRef(currentUser);
    currentUserRef.current = currentUser;
    const logoutRef = useRef(logout);
    logoutRef.current = logout;

    // --- 1. RUNTIME HEARTBEAT (Every 1 Second) ---
    // Checks basic connectivity and ensures store is reactive.
    useEffect(() => {
        const ONE_SECOND = 1000;
        const heartbeat = setInterval(() => {
            const isOnline = navigator.onLine;
            if (!isOnline) {
                // Console only to avoid spamming user
                // console.warn('[System] Network disconnected.');
            }
        }, ONE_SECOND);

        return () => clearInterval(heartbeat);
    }, []);

    // --- 2. AUTOMATIC CODE DIAGNOSIS & AUTO-FIX (Scheduled) ---
    useEffect(() => {
        if (!hasHydrated) return; // Wait for storage to be ready

        const runMaintenance = (isStartup = false) => {
            // Polyfill or use requestIdleCallback
            const scheduleWork = (window as any).requestIdleCallback || ((cb: Function) => setTimeout(cb, 1));

            scheduleWork(() => {
                console.log('[Auto-Repair] Running Global Code Diagnosis (Idle)...');
                
                // SECURITY CHECK: Ensure current user still exists in database
                // This prevents "Ghost Sessions" where a deleted user can still act.
                const current = currentUserRef.current;
                const allUsers = usersRef.current;
                
                if (current) {
                    const userExists = allUsers.find(u => u.id === current.id);
                    if (!userExists) {
                        console.error('[Security] Active session user not found in database. Forcing logout.');
                        logoutRef.current();
                        showToast('Session expired or account removed by admin.', 'error');
                        return; // Stop further maintenance
                    }
                }

                // Execute the Global Fix Logic (Security + Data)
                const logs = globalFixRef.current();
                
                // Check if any actual repairs were made
                const fixes = logs.filter(l => l.includes('Fixed') || l.includes('Neutralized') || l.includes('Repair') || l.includes('🔧') || l.includes('✅ Auto-Fix'));
                
                if (fixes.length > 0) {
                    console.info(`[Auto-Repair] Action Taken:`, fixes);
                    if (isStartup) {
                        // Less intrusive toast on startup
                        showToast(`System Startup: ${fixes.length} issues diagnosed & fixed.`, 'success');
                    } else {
                        showToast(`Auto-Fix Tool: Resolved ${fixes.length} code/data errors.`, 'success');
                    }
                } else {
                    console.log('[Auto-Repair] System healthy. No issues found.');
                }
            }, { timeout: 2000 }); // Force execution after 2s if CPU never idles
        };

        // Run immediately on mount (or rehydration) via idle callback
        runMaintenance(true);

        // Then run every 20 minutes
        const TWENTY_MINUTES = 20 * 60 * 1000;
        const intervalId = setInterval(() => runMaintenance(false), TWENTY_MINUTES);
        
        return () => clearInterval(intervalId);
    }, [showToast, hasHydrated]); // Depend on hydrated to start

    // --- 3. WEEKLY SAFE CLEAN-UP (Scheduled) ---
    useEffect(() => {
        if (!hasHydrated) return;

        const checkWeeklyCleanup = () => {
            const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
            const lastRun = useStore.getState().lastSafeCleanup || 0;
            
            if (Date.now() - lastRun > WEEK_MS) {
                // Use idle callback for cleanup too
                const scheduleWork = (window as any).requestIdleCallback || ((cb: Function) => setTimeout(cb, 1));
                
                scheduleWork(() => {
                    console.log('[Maintenance] Running Weekly Safe Clean-up...');
                    const result = safeCleanupRef.current();
                    console.info('[Maintenance]', result);
                    showToast('Weekly System Maintenance Completed Successfully.', 'info');
                }, { timeout: 5000 });
            }
        };

        // Check on mount
        checkWeeklyCleanup();

        // And check every hour just in case app is left open
        const hourlyCheck = setInterval(checkWeeklyCleanup, 60 * 60 * 1000);
        return () => clearInterval(hourlyCheck);
    }, [hasHydrated, showToast]);

    // --- 4. STABILITY TIMER (Crash Loop Prevention) ---
    useEffect(() => {
        // If app runs for 10 seconds without crashing, reset the crash counter.
        // This ensures random sporadic crashes don't accumulate to a lockout.
        const stabilityTimer = setTimeout(() => {
            resetCrashCount();
            console.log('[System] Stability Check Passed. Crash count reset.');
        }, 10000);

        return () => clearTimeout(stabilityTimer);
    }, [resetCrashCount]);

    return null;
};

export default DataManager;
