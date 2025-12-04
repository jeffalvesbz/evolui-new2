<<<<<<< HEAD
import React, { useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastMessage {
  id: number | string;
=======
import React, { useState, useEffect, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  message: string;
  type: ToastType;
}

let toastId = 0;
<<<<<<< HEAD
const listeners: Array<(toast: ToastMessage) => void> = [];
const dismissListeners: Array<(id: number | string) => void> = [];

const toast = (message: string, type: ToastType = 'info') => {
  const id = ++toastId;
  listeners.forEach((listener) => {
    listener({ id, message, type });
  });
  return id;
=======
const listeners: Array<(toast: Omit<ToastMessage, 'id'>) => void> = [];

const toast = (message: string, type: ToastType = 'info') => {
  listeners.forEach((listener) => {
    listener({ message, type });
  });
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
};

toast.success = (message: string) => toast(message, 'success');
toast.error = (message: string) => toast(message, 'error');
toast.info = (message: string) => toast(message, 'info');
<<<<<<< HEAD
toast.warning = (message: string) => toast(message, 'warning');
toast.loading = (message: string) => toast(message, 'loading');
toast.dismiss = (id: number | string) => {
  dismissListeners.forEach((listener) => listener(id));
};
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a

export { toast };

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
<<<<<<< HEAD
    const newToastListener = (newToast: ToastMessage) => {
      setToasts((currentToasts) => {
        // Evitar mensagens duplicadas consecutivas
        const lastToast = currentToasts[currentToasts.length - 1];
        if (lastToast && lastToast.message === newToast.message && lastToast.type === newToast.type) {
          return currentToasts;
        }

        // Limitar a 3 toasts simultâneos
        const limitedToasts = currentToasts.slice(-2);
        const newToasts = [...limitedToasts, newToast];

        if (newToast.type !== 'loading') {
          setTimeout(() => {
            setToasts((current) => current.filter((t) => t.id !== newToast.id));
          }, 3000);
        }

        return newToasts;
      });
    };

    const dismissListener = (id: number | string) => {
      setToasts((current) => current.filter((t) => t.id !== id));
    };

    listeners.push(newToastListener);
    dismissListeners.push(dismissListener);

=======
    const newToastListener = (newToast: Omit<ToastMessage, 'id'>) => {
      const id = toastId++;
      setToasts((currentToasts) => [...currentToasts, { ...newToast, id }]);
      setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((t) => t.id !== id));
      }, 3000);
    };

    listeners.push(newToastListener);
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    return () => {
      const index = listeners.indexOf(newToastListener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
<<<<<<< HEAD
      const dismissIndex = dismissListeners.indexOf(dismissListener);
      if (dismissIndex > -1) {
        dismissListeners.splice(dismissIndex, 1);
      }
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    };
  }, []);

  const getToastClasses = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
<<<<<<< HEAD
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      case 'loading':
        return 'bg-gray-500 border-gray-600';
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  return (
<<<<<<< HEAD
    <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[100] space-y-2 max-w-[calc(100vw-2rem)] sm:max-w-md">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-3 py-2 sm:px-4 sm:py-3 rounded-md text-white border-b-4 shadow-lg text-xs sm:text-sm font-medium animate-fade-in-down ${getToastClasses(t.type)} flex items-center gap-2`}
        >
          {t.type === 'loading' && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
=======
    <div className="fixed top-5 right-5 z-[100] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-md text-white border-b-4 shadow-lg text-sm font-medium animate-fade-in-down ${getToastClasses(t.type)}`}
        >
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
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
