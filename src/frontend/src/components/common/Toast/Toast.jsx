// components/common/Toast/Toast.jsx
import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import './Toast.css';

const ICONS = {
    success: Check,
    error: X,
    warning: AlertCircle,
    info: Info,
};

const Toast = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);
    const Icon = ICONS[toast.type] || Info;

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 200);
    };

    // Trigger exit animation before auto-removal
    useEffect(() => {
        if (toast.duration > 0) {
            const exitTimer = setTimeout(() => {
                setIsExiting(true);
            }, toast.duration - 200);

            return () => clearTimeout(exitTimer);
        }
    }, [toast.duration]);

    return (
        <div
            className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <div className="toast-icon">
                <Icon size={16} />
            </div>
            <span className="toast-message">{toast.message}</span>
            <button
                className="toast-dismiss"
                onClick={handleDismiss}
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>

            {/* Progress bar for auto-dismiss */}
            {toast.duration > 0 && (
                <div
                    className="toast-progress"
                    style={{ animationDuration: `${toast.duration}ms` }}
                />
            )}
        </div>
    );
};

export default Toast;
