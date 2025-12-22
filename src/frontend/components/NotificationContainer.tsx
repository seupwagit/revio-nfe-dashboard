/**
 * Container de Notificações
 * 
 * Componente que renderiza todas as notificações ativas
 * Deve ser incluído no nível raiz da aplicação
 */

import React from 'react';
import { Toast } from './ui/Toast';
import { Notification } from '../hooks/useNotifications';

export interface NotificationContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
  position = 'top-right'
}) => {
  return (
    <div className="fixed z-50 pointer-events-none">
      <div className="pointer-events-auto space-y-4">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{
              marginTop: index > 0 ? '1rem' : 0
            }}
          >
            <Toast
              id={notification.id}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              duration={notification.persistent ? 0 : notification.duration}
              onClose={onClose}
              position={position}
            />
          </div>
        ))}
      </div>
    </div>
  );
};