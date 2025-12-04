/**
 * ToastContainer Component
 * 
 * Container for displaying multiple toast notifications
 * Stacks toasts vertically in the top-right corner
 * 
 * Requirements: 1.6, 1.7, 7.6
 */

import { Toast, type ToastType } from './Toast';
import './ToastContainer.css';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
}
