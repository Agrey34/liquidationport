import { getCleanErrorMessage } from './error-utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  show(type: ToastType, message: string, options?: { description?: string; duration?: number; id?: string }) {
    const id = options?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
    const duration = options?.duration ?? 4000;

    const newToast: ToastItem = {
      id,
      type,
      message,
      description: options?.description,
      duration,
    };

    // Keep at most 5 toasts visible at a time
    this.toasts = [...this.toasts.filter((t) => t.id !== id), newToast].slice(-5);
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

export const toast = {
  success: (message: string, options?: { description?: string; duration?: number; id?: string }) =>
    toastManager.show('success', message, options),
  error: (message: string, options?: { description?: string; duration?: number; id?: string }) => {
    const cleanMsg = getCleanErrorMessage(message);
    const cleanDesc = options?.description ? getCleanErrorMessage(options.description) : undefined;
    return toastManager.show('error', cleanMsg, options ? { ...options, description: cleanDesc } : undefined);
  },
  info: (message: string, options?: { description?: string; duration?: number; id?: string }) =>
    toastManager.show('info', message, options),
  warning: (message: string, options?: { description?: string; duration?: number; id?: string }) =>
    toastManager.show('warning', message, options),
  dismiss: (id: string) => toastManager.dismiss(id),
  clear: () => toastManager.clear(),
};
