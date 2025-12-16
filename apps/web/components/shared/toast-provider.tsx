'use client';

import { createContext, useContext, useState, useCallback } from 'react';

type ToastVariant = 'success' | 'error' | 'default';

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([
    {
      id: 1,
      title: 'Swap was successful!',
      description: 'Swapped 12.5 S to USDC successfully.',
      variant: 'success',
    },
  ]);

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    setToasts(prev => [...prev, { id: Date.now(), ...toast }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2">
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`cursor-pointer rounded-xl border px-4 py-3 shadow-lg w-72 
              transition-transform duration-300 ease-out animate-[slideIn_0.3s_ease-out]
              ${
                t.variant === 'success'
                  ? 'bg-cherry-bright text-cream-white border-cherry-soda'
                  : t.variant === 'error'
                    ? 'bg-negative text-white border-red-700'
                    : 'bg-white text-yellow-dark border-gray-200'
              }`}
          >
            <strong className="font-semibold block mb-0.5">{t.title}</strong>
            {t.description && <div className="text-sm text-cream-white/90">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
