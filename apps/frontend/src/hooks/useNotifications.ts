/**
 * Hook para gerenciamento de notificações
 * 
 * Fornece métodos para exibir toasts, alertas e modais
 * com gerenciamento de estado centralizado
 */

import { useState, useCallback } from 'react';
import { AlertType } from '../components/ui/Alert';

export interface Notification {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

export interface NotificationOptions {
  title?: string;
  duration?: number;
  persistent?: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addNotification = useCallback((
    type: AlertType,
    message: string,
    options: NotificationOptions = {}
  ) => {
    const notification: Notification = {
      id: generateId(),
      type,
      message,
      title: options.title,
      duration: options.duration ?? (type === 'error' ? 8000 : 5000),
      persistent: options.persistent ?? false
    };

    setNotifications(prev => [...prev, notification]);
    return notification.id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Métodos de conveniência
  const success = useCallback((message: string, options?: NotificationOptions) => {
    return addNotification('success', message, options);
  }, [addNotification]);

  const error = useCallback((message: string, options?: NotificationOptions) => {
    return addNotification('error', message, options);
  }, [addNotification]);

  const warning = useCallback((message: string, options?: NotificationOptions) => {
    return addNotification('warning', message, options);
  }, [addNotification]);

  const info = useCallback((message: string, options?: NotificationOptions) => {
    return addNotification('info', message, options);
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };
};