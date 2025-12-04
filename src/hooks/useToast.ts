/**
 * useToast Hook
 * 
 * Custom hook for managing toast notifications
 * Provides a simple API for showing success, error, warning, and info toasts
 * 
 * Requirements: 1.6, 1.7, 7.6
 */

import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: ToastMessage = { id, message, type };
    
    setToasts((prev) => [...prev, toast]);
    
    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, 3000);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    return showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message: string) => {
    return showToast(message, 'error');
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    return showToast(message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    return showToast(message, 'info');
  }, [showToast]);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
  };
}
