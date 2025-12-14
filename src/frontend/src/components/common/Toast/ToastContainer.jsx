// components/common/Toast/ToastContainer.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import useToastStore from '../../../store/useToastStore';
import Toast from './Toast';
import './Toast.css';

const ToastContainer = () => {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return createPortal(
        <div className="toast-container" aria-label="Notifications">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    toast={toast}
                    onDismiss={removeToast}
                />
            ))}
        </div>,
        document.body
    );
};

export default ToastContainer;
