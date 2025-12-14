// store/useToastStore.js
import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set, get) => ({
    toasts: [],

    // Add a toast
    addToast: (message, options = {}) => {
        const id = ++toastId;
        const toast = {
            id,
            message,
            type: options.type || 'info',
            duration: options.duration ?? 3000,
            icon: options.icon || null,
            createdAt: Date.now(),
        };

        set(state => ({
            toasts: [...state.toasts, toast]
        }));

        // Auto-dismiss
        if (toast.duration > 0) {
            setTimeout(() => {
                get().removeToast(id);
            }, toast.duration);
        }

        return id;
    },

    // Remove a toast
    removeToast: (id) => {
        set(state => ({
            toasts: state.toasts.filter(t => t.id !== id)
        }));
    },

    // Clear all toasts
    clearToasts: () => {
        set({ toasts: [] });
    },

    // Convenience methods
    success: (message, options = {}) => {
        return get().addToast(message, { ...options, type: 'success' });
    },

    error: (message, options = {}) => {
        return get().addToast(message, { ...options, type: 'error', duration: options.duration ?? 5000 });
    },

    info: (message, options = {}) => {
        return get().addToast(message, { ...options, type: 'info' });
    },

    warning: (message, options = {}) => {
        return get().addToast(message, { ...options, type: 'warning' });
    },
}));

export default useToastStore;
