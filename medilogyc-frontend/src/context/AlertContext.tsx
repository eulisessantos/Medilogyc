import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ApiError } from '../types';

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
}

interface AlertContextValue {
  toasts: Toast[];
  showToast: (message: string, variant?: Toast['variant']) => void;
  handleApiError: (error: unknown) => ApiError | null;
  medicalBlock: string | null;
  setMedicalBlock: (message: string | null) => void;
  compatibilityWarning: string | null;
  setCompatibilityWarning: (message: string | null) => void;
  fieldErrors: Record<string, boolean>;
  setFieldErrors: (fields: Record<string, boolean>) => void;
  clearFieldErrors: () => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [medicalBlock, setMedicalBlock] = useState<string | null>(null);
  const [compatibilityWarning, setCompatibilityWarning] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const showToast = useCallback((message: string, variant: Toast['variant'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const handleApiError = useCallback(
    (error: unknown): ApiError | null => {
      if (!error || typeof error !== 'object' || !('type' in error)) {
        showToast('Error inesperado. Intente nuevamente.', 'error');
        return null;
      }
      const apiError = error as ApiError;
      if (apiError.type === 'allergy') {
        setMedicalBlock(apiError.message);
        return apiError;
      }
      if (apiError.type === 'compatibility') {
        setCompatibilityWarning(apiError.message);
        return apiError;
      }
      if (apiError.type === 'duplicate') {
        setFieldErrors({ correo: true, numeroDocumento: true });
        showToast(apiError.message, 'error');
        return apiError;
      }
      showToast(apiError.message, 'error');
      return apiError;
    },
    [showToast],
  );

  const clearFieldErrors = useCallback(() => setFieldErrors({}), []);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      handleApiError,
      medicalBlock,
      setMedicalBlock,
      compatibilityWarning,
      setCompatibilityWarning,
      fieldErrors,
      setFieldErrors,
      clearFieldErrors,
    }),
    [
      toasts,
      showToast,
      handleApiError,
      medicalBlock,
      compatibilityWarning,
      fieldErrors,
      clearFieldErrors,
    ],
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert debe usarse dentro de AlertProvider');
  return ctx;
}
