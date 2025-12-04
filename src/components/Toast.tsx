import { useEffect } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

/**
 * Toast notification component for user feedback
 * Requirement 4.3: Provide immediate visual feedback for user interactions
 */
export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      <div className="toast-content">
        <span className="toast-icon">{getIcon(type)}</span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="关闭通知">
        ×
      </button>
    </div>
  );
}

function getIcon(type: ToastType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return '';
  }
}
