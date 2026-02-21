
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useStore } from '../store';
import { WrenchScrewdriverIcon, ArrowPathIcon, ExclamationCircleIcon } from './ui/Icons';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Auto-Crash Solver Caught:", error, errorInfo);
    
    // Call the global crash solver logic
    const { autoCrashSolver } = useStore.getState();
    const result = autoCrashSolver();

    console.log(`[Auto-Crash Solver] Strategy: ${result.action} - ${result.message}`);

    if (result.action === 'RELOAD') {
        // Attempt immediate recovery by reloading the page
        setTimeout(() => {
            window.location.reload();
        }, 500); 
    } 
    // If action is NONE, we stay on the error screen (Max crashes reached)
  }

  handleManualFactoryReset = () => {
      if (window.confirm("WARNING: This will clear all local app data (Cart, Login Session, etc) to fix the crash. Your account data on the server is safe. Continue?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6 text-center font-mono">
          <div className="bg-red-500/20 p-4 rounded-full mb-6 animate-pulse">
             <ExclamationCircleIcon className="w-16 h-16 text-red-500" />
          </div>
          
          <h1 className="text-3xl font-black mb-2 tracking-widest uppercase text-red-500">System Malfunction</h1>
          <p className="text-gray-400 mb-8 max-w-md">
            The Auto-Crash Handler detected a critical failure. Automatic recovery attempts have failed to stabilize the system.
          </p>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 w-full max-w-md mb-8 text-left">
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Error Log:</p>
              <code className="text-red-400 text-sm break-all">
                  {this.state.errorInfo || 'Unknown runtime exception'}
              </code>
          </div>

          <div className="space-y-4 w-full max-w-xs">
            <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
            >
                <ArrowPathIcon className="w-5 h-5" />
                Retry System
            </button>

            <button
                onClick={this.handleManualFactoryReset}
                className="w-full py-3 bg-transparent border border-red-500/50 text-red-400 hover:bg-red-900/30 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
            >
                <WrenchScrewdriverIcon className="w-5 h-5" />
                Force Factory Reset
            </button>
          </div>
          
          <div className="mt-12 text-xs text-gray-600">
              Auto-Crash Solver v1.0 • System Integrity Protection
          </div>
        </div>
      );
    }

    // Access children from props
    return this.props.children || null;
  }
}

export default ErrorBoundary;
