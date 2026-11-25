import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem',
      zIndex: 60,
      maxWidth: '380px',
    }}>
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        const borderColor = isSuccess ? 'rgba(16, 185, 129, 0.4)' : isError ? 'rgba(244, 63, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)';
        const iconColor = isSuccess ? '#34d399' : isError ? '#fb7185' : '#818cf8';

        return (
          <div
            key={toast.id}
            className="animate-slide-in"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: `1px solid ${borderColor}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ flexShrink: 0 }}>
              {isSuccess && <CheckCircle2 size={18} color={iconColor} />}
              {isError && <AlertCircle size={18} color={iconColor} />}
              {!isSuccess && !isError && <Info size={18} color={iconColor} />}
            </div>

            <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {toast.text}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                color: 'var(--text-muted)',
                padding: '0.2rem',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
