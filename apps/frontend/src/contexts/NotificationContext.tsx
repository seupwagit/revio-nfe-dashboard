/**
 * Contexto de Notificações
 * 
 * Fornece acesso global ao sistema de notificações
 * Permite que qualquer componente exiba notificações
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications, NotificationOptions } from '../hooks/useNotifications';
import { NotificationContainer } from '../components/NotificationContainer';

interface NotificationContextType {
  success: (message: string, options?: NotificationOptions) => string;
  error: (message: string, options?: NotificationOptions) => string;
  warning: (message: string, options?: NotificationOptions) => string;
  info: (message: string, options?: NotificationOptions) => string;
  remove: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export interface NotificationProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  position = 'top-right'
}) => {
  const {
    notifications,
    success,
    error,
    warning,
    info,
    removeNotification,
    clearAll
  } = useNotifications();

  const contextValue: NotificationContextType = {
    success,
    error,
    warning,
    info,
    remove: removeNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        position={position}
      />
    </NotificationContext.Provider>
  );
};

export const useNotify = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotify deve ser usado dentro de um NotificationProvider');
  }
  return context;
};