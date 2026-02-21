
import { Transaction } from '../types';

/**
 * Advanced Payment Gateway Simulator
 * Mimics banking handshake, 3D secure, and latency.
 */
export const PaymentGateway = {
    
    generateTransactionId: () => `txn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,

    /**
     * Simulates the payment processing delay and probability of failure
     */
    processPayment: async (amount: number, method: string): Promise<{ success: boolean; refId: string; message: string }> => {
        return new Promise((resolve) => {
            const delay = Math.floor(Math.random() * 2000) + 1500; // 1.5s - 3.5s delay
            
            setTimeout(() => {
                // Simulate random bank failure (5% chance) unless it's COD
                const isFailure = method !== 'Cash on Delivery' && Math.random() > 0.95;
                const refId = `bank_ref_${Math.floor(Math.random() * 10000000)}`;

                if (isFailure) {
                    resolve({
                        success: false,
                        refId,
                        message: 'Bank server timeout or insufficient funds.'
                    });
                } else {
                    resolve({
                        success: true,
                        refId,
                        message: 'Transaction authorized successfully.'
                    });
                }
            }, delay);
        });
    },

    /**
     * Luhn Algorithm for basic card validation
     */
    validateCard: (number: string): boolean => {
        const regex = new RegExp("^[0-9]{13,19}$");
        if (!regex.test(number)) return false;

        let sum = 0;
        let shouldDouble = false;
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number.charAt(i));
            if (shouldDouble) {
                if ((digit *= 2) > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return (sum % 10) === 0;
    },

    getBankList: () => ['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra'],
    getWalletList: () => ['Paytm', 'PhonePe', 'Amazon Pay', 'Freecharge']
};
