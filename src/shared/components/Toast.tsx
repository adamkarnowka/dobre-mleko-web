import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { errorMessage } from '../errors';

type Toast = { message: string; error: boolean } | null;
type Notify = { ok: (message: string) => void; fail: (err: unknown) => void };

const ToastContext = createContext<Notify>({ ok: () => {}, fail: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((message: string, error: boolean) => {
    setToast({ message, error });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), error ? 6000 : 3000);
  }, []);
  const ok = useCallback((message: string) => show(message, false), [show]);
  const fail = useCallback((err: unknown) => show(errorMessage(err), true), [show]);
  return (
    <ToastContext.Provider value={{ ok, fail }}>
      {children}
      <div className={`toast${toast?.error ? ' error' : ''}`} role="status" aria-live="polite" hidden={!toast}>
        {toast?.message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
