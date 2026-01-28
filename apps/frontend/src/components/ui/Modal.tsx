/**
 * Componente de Modal
 * 
 * Modal reutilizável para exibir conteúdo sobreposto com backdrop
 * Usado para confirmações, formulários e exibição de erros detalhados
 */

import React, { useEffect } from 'react';
import { AlertType } from './Alert';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: AlertType;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  actions?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

const typeStyles = {
  success: 'border-t-4 border-green-400',
  error: 'border-t-4 border-red-400',
  warning: 'border-t-4 border-yellow-400',
  info: 'border-t-4 border-blue-400'
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  type,
  showCloseButton = true,
  closeOnBackdrop = true,
  actions
}) => {
  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleBackdropClick}
      >
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        />

        {/* Centralizar modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal */}
        <div
          className={`
            inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl 
            transform transition-all sm:my-8 sm:align-middle w-full ${sizeClasses[size]}
            ${type ? typeStyles[type] : ''}
          `}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between">
                {title && (
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {title}
                  </h3>
                )}
                
                {showCloseButton && (
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`bg-white px-4 ${title || showCloseButton ? 'pt-0' : 'pt-5'} pb-4 sm:p-6 ${title || showCloseButton ? 'sm:pt-0' : ''}`}>
            {children}
          </div>

          {/* Actions */}
          {actions && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componentes específicos para cada tipo
export const ErrorModal: React.FC<Omit<ModalProps, 'type'>> = (props) => (
  <Modal {...props} type="error" />
);

export const SuccessModal: React.FC<Omit<ModalProps, 'type'>> = (props) => (
  <Modal {...props} type="success" />
);

export const WarningModal: React.FC<Omit<ModalProps, 'type'>> = (props) => (
  <Modal {...props} type="warning" />
);

export const InfoModal: React.FC<Omit<ModalProps, 'type'>> = (props) => (
  <Modal {...props} type="info" />
);