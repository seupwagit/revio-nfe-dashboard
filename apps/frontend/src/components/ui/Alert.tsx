/**
 * Componente de Alerta
 * 
 * Componente reutilizável para exibir mensagens de sucesso, erro, aviso e informação
 * usando Tailwind CSS com design moderno e acessível
 */

import React from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
  showIcon?: boolean;
  actions?: React.ReactNode;
}

const alertStyles = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-400',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-400',
    iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: 'text-yellow-400',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-400',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  className = '',
  showIcon = true,
  actions
}) => {
  const styles = alertStyles[type];

  return (
    <div className={`rounded-lg border p-4 ${styles.container} ${className}`} role="alert">
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            <svg
              className={`h-5 w-5 ${styles.icon}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={styles.iconPath}
              />
            </svg>
          </div>
        )}
        
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          
          <div className="text-sm">
            {message}
          </div>
          
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>
        
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-opacity-20 hover:bg-gray-600 ${styles.icon} focus:ring-offset-${type === 'warning' ? 'yellow' : type === 'error' ? 'red' : type === 'success' ? 'green' : 'blue'}-50 focus:ring-${type === 'warning' ? 'yellow' : type === 'error' ? 'red' : type === 'success' ? 'green' : 'blue'}-600`}
                onClick={onClose}
                aria-label="Fechar alerta"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componentes específicos para cada tipo
export const SuccessAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert {...props} type="success" />
);

export const ErrorAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert {...props} type="error" />
);

export const WarningAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert {...props} type="warning" />
);

export const InfoAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert {...props} type="info" />
);