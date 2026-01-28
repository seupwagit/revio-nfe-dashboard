/**
 * Componente de Toast
 * 
 * Notificações temporárias que aparecem no canto da tela
 * com animações suaves e auto-dismiss
 */

import React, { useEffect, useState } from 'react';
import { AlertType } from './Alert';

export interface ToastProps {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const toastStyles = {
  success: {
    container: 'bg-white border-l-4 border-green-400 shadow-lg',
    icon: 'text-green-400',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  error: {
    container: 'bg-white border-l-4 border-red-400 shadow-lg',
    icon: 'text-red-400',
    iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  warning: {
    container: 'bg-white border-l-4 border-yellow-400 shadow-lg',
    icon: 'text-yellow-400',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
  },
  info: {
    container: 'bg-white border-l-4 border-blue-400 shadow-lg',
    icon: 'text-blue-400',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const styles = toastStyles[type];

  useEffect(() => {
    // Animar entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div
      className={`
        fixed z-50 max-w-sm w-full transition-all duration-300 ease-in-out
        ${positionClasses[position]}
        ${isVisible && !isLeaving 
          ? 'transform translate-x-0 opacity-100' 
          : position.includes('right')
            ? 'transform translate-x-full opacity-0'
            : 'transform -translate-x-full opacity-0'
        }
      `}
    >
      <div className={`rounded-lg p-4 ${styles.container}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className={`h-5 w-5 ${styles.icon}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={styles.iconPath}
              />
            </svg>
          </div>
          
          <div className="ml-3 flex-1">
            {title && (
              <p className="text-sm font-medium text-gray-900">
                {title}
              </p>
            )}
            <p className={`text-sm ${title ? 'text-gray-500' : 'text-gray-900'}`}>
              {message}
            </p>
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleClose}
            >
              <span className="sr-only">Fechar</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Barra de progresso */}
        {duration > 0 && (
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${
                type === 'success' ? 'bg-green-400' :
                type === 'error' ? 'bg-red-400' :
                type === 'warning' ? 'bg-yellow-400' :
                'bg-blue-400'
              }`}
              style={{
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// CSS para animação da barra de progresso
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
document.head.appendChild(style);