import React, { createContext, useState, useCallback, useContext, ReactNode, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '../components/ui/Icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 5000);
  }, []);
  
  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };
  
  const toastIcons = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
    error: <ExclamationCircleIcon className="w-6 h-6 text-red-500" />,
    info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
  };

  const contextValue = useMemo(() => ({ showToast }), [showToast]);
  
  return (
    <ToastContext value={contextValue}>
      {children}
      {createPortal(
        <div className="fixed top-5 right-5 z-[100] space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden flex"
            >
                <div className="p-4 flex items-start">
                    <div className="flex-shrink-0">{toastIcons[toast.type]}</div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-900">{toast.message}</p>
                    </div>
                     <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="inline-flex text-gray-400 hover:text-gray-500"
                        >
                            <span className="sr-only">Close</span>
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};