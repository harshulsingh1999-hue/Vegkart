
import React, { useState } from 'react';
import AppRouter from './router';
import { ToastProvider, useToast } from './providers/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore, verifyDeviceLock } from './store';
import DataManager from './components/DataManager';
import { FingerPrintIcon, LockClosedIcon, ShieldCheckIcon, DevicePhoneMobileIcon } from './components/ui/Icons';

const ExitPreviewButton = () => {
    // Optimized selectors
    const originalUser = useStore(state => state.originalUser);
    const endPreview = useStore(state => state.endPreview);
    
    if (!originalUser) return null;
    
    return (
        <div className="fixed bottom-24 right-4 z-[9999]">
            <button 
                onClick={endPreview}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 animate-bounce-short border-4 border-white transition-transform active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                Exit Preview
            </button>
        </div>
    );
};

const BiometricLock: React.FC = () => {
    const { setAppLocked, verifyAppPin } = useStore();
    const { showToast } = useToast();
    const [isVerifying, setIsVerifying] = useState(false);
    const [usePinMode, setUsePinMode] = useState(false);
    const [enteredPin, setEnteredPin] = useState('');

    const handleUnlock = async () => {
        setIsVerifying(true);
        const success = await verifyDeviceLock();
        setIsVerifying(false);

        if (success) {
            setAppLocked(false);
            showToast('Device verified. Access granted.', 'success');
        } else {
            showToast('Verification failed. Try PIN.', 'error');
            setUsePinMode(true);
        }
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (verifyAppPin(enteredPin)) {
            setAppLocked(false);
            showToast('Encrypted Data Unlocked.', 'success');
        } else {
            showToast('Incorrect App PIN.', 'error');
            setEnteredPin('');
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-gray-900 via-green-900 to-black flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in">
            <div className="bg-white/10 p-6 rounded-full mb-8 backdrop-blur-md shadow-2xl border border-white/20 animate-pulse">
                <LockClosedIcon className="w-20 h-20 text-green-400" />
            </div>
            
            <h1 className="text-3xl font-black mb-2 tracking-widest uppercase">System Locked</h1>
            <p className="text-gray-300 mb-10 max-w-xs text-sm">
                Protected by Device Encryption & Biometric Security.
            </p>

            {!usePinMode ? (
                <>
                    <button 
                        onClick={handleUnlock}
                        disabled={isVerifying}
                        className="w-full max-w-xs bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        {isVerifying ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Verifying...
                            </>
                        ) : (
                            <>
                                <FingerPrintIcon className="w-6 h-6" />
                                Unlock with Device
                            </>
                        )}
                    </button>
                    <button onClick={() => setUsePinMode(true)} className="mt-6 text-sm text-green-300 hover:text-white underline">
                        Use App PIN Instead
                    </button>
                </>
            ) : (
                <form onSubmit={handlePinSubmit} className="w-full max-w-xs animate-fade-in">
                    <p className="text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">Enter App PIN</p>
                    <div className="relative mb-6">
                        <input 
                            type="password" 
                            value={enteredPin}
                            onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="w-full bg-black/50 border border-green-500/50 text-green-400 text-center text-3xl py-3 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-500/30 outline-none tracking-[0.5em] font-mono shadow-inner"
                            autoFocus
                            placeholder="••••"
                        />
                        <DevicePhoneMobileIcon className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95"
                    >
                        Unlock Data
                    </button>
                    <button type="button" onClick={() => setUsePinMode(false)} className="mt-4 text-xs text-gray-400 hover:text-white">
                        Cancel & Use Biometrics
                    </button>
                </form>
            )}
            
            <div className="mt-12 flex items-center gap-2 text-xs text-green-500/60 font-mono uppercase">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>AES-256 Encrypted Storage</span>
            </div>
        </div>
    );
};

const MainAppContent: React.FC = () => {
    const isAppLocked = useStore(state => state.isAppLocked);
    const isBiometricEnabled = useStore(state => state.isBiometricEnabled);

    return (
        <>
            {isBiometricEnabled && isAppLocked && <BiometricLock />}
            <DataManager />
            <AppRouter />
            <ExitPreviewButton />
        </>
    );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
