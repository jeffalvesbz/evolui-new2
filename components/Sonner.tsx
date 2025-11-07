import React, { useState, useEffect, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners: Array<(toast: Omit<ToastMessage, 'id'>) => void> = [];

const toast = (message: string, type: ToastType = 'info') => {
  listeners.forEach((listener) => {
    listener({ message, type });
  });
};

toast.success = (message: string) => toast(message, 'success');
toast.error = (message: string) => toast(message, 'error');
toast.info = (message: string) => toast(message, 'info');

export { toast };

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const newToastListener = (newToast: Omit<ToastMessage, 'id'>) => {
      const id = toastId++;
      setToasts((currentToasts) => [...currentToasts, { ...newToast, id }]);
      setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((t) => t.id !== id));
      }, 3000);
    };

    listeners.push(newToastListener);
    return () => {
      const index = listeners.indexOf(newToastListener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const getToastClasses = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  return (
    <div className="fixed top-5 right-5 z-[100] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-md text-white border-b-4 shadow-lg text-sm font-medium animate-fade-in-down ${getToastClasses(t.type)}`}
        >
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes fade-in-down {
            0% {
                opacity: 0;
                transform: translateY(-10px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
